import { Server } from "socket.io";
import prisma from "../lib/prisma";
import { gameRoomService } from "../socket/services/gameRoom.service";

interface ForfeitTimer {
  gameId: number;
  disconnectedUserId: number;
  timeout: NodeJS.Timeout;
  startedAt: number; // Date.now() when the original timer was created
}

class DisconnectionService {
  private forfeitTimers: Map<string, ForfeitTimer> = new Map();
  private readonly FORFEIT_DELAY = 30000; // 30 seconds

  /* #255, #248: Helper function: shared guard — returns the game only if
   * still IN_PROGRESS */
  private async getInProgressGameOrNull(gameId: number) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!game || game.status !== "IN_PROGRESS") {
      return null;
    }

    return game;
  }

  /* #248: Helper function: both players disconnected — abandon with no winner */
  private async handleBothDisconnected(io: Server, gameId: number, roomName: string) {
    try {
      await prisma.game.update({
        where: { id: gameId },
        data: {
          status: "ABANDONED",
          winnerId: null,
          finishedAt: new Date(),
        },
      });

      const payload = {
        gameId,
        winner: null,
        reason: "Both players disconnected",
        timestamp: new Date().toISOString(),
      };

      io.to(roomName).emit("game_abandoned", payload);

      console.log(
        `[Game Over] Game ${gameId} abandoned. Reason: both players disconnected`,
      );
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "P2025"
      ) {
        return;
      }

      console.error(`[Error] Failed to abandon game ${gameId}:`, error);
    }
  }

  /* Start (or resume) the forfeit countdown for a disconnected player.
     If a timer already existed for this key we use the *original* startedAt
     so that reconnecting then disconnecting again does NOT reset the 30s window */
  async startForfeitTimer(
    io: Server,
    gameId: number,
    disconnectedUser: { id: number; username: string; symbol: string },
    opponent: { id: number; username: string; symbol: string },
    roomName: string,
  ) {
    const key = `${gameId}-${disconnectedUser.id}`;
    const existing = this.forfeitTimers.get(key);

    // Preserve the original start time if a timer was already running
    const startedAt = existing?.startedAt ?? Date.now();
    const elapsed = Date.now() - startedAt;
    const remaining = this.FORFEIT_DELAY - elapsed;

    // Clear any existing JS timeout (but keep startedAt via the variable above)
    if (existing) {
      clearTimeout(existing.timeout);
      this.forfeitTimers.delete(key);
    }

    if (remaining <= 0) {
      // Time already expired — forfeit immediately
      void this.handleForfeit(io, gameId, disconnectedUser, opponent, roomName);
      return;
    }

    const timeout = setTimeout(() => {
      void this.handleForfeit(io, gameId, disconnectedUser, opponent, roomName);
    }, remaining);
    timeout.unref?.();

    this.forfeitTimers.set(key, {
      gameId,
      disconnectedUserId: disconnectedUser.id,
      timeout,
      startedAt,
    });

    const remainingSec = Math.ceil(remaining / 1000);
    console.log(
      `[Timer] Forfeit started for ${disconnectedUser.username} in game ${gameId} (${remainingSec}s remaining)`,
    );
  }

  /** How many seconds remain on a player's forfeit timer (0 if none). */
  getRemainingTime(gameId: number, userId: number): number {
    const key = `${gameId}-${userId}`;
    const timer = this.forfeitTimers.get(key);
    if (!timer) return 0;
    const remaining = this.FORFEIT_DELAY - (Date.now() - timer.startedAt);
    return Math.max(0, Math.ceil(remaining / 1000));
  }

  // Annule le timer (Reconnexion réussie)
  cancelForfeitTimer(gameId: number, userId: number): boolean {
    const key = `${gameId}-${userId}`;
    const timer = this.forfeitTimers.get(key);

    if (timer) {
      clearTimeout(timer.timeout);
      this.forfeitTimers.delete(key);
      console.log(`[Timer] Forfeit cancelled for user ${userId} in game ${gameId}`);
      return true;
    }
    return false;
  }

  // Annule tous les timers liés à une partie spécifique (quand elle se termine normalement)
  cancelAllTimersForGame(gameId: number) {
    for (const [key, timer] of this.forfeitTimers.entries()) {
      if (key.startsWith(`${gameId}-`)) {
        clearTimeout(timer.timeout);
        this.forfeitTimers.delete(key);
        console.log(`[Timer] Cleared forfeit timer for game ${gameId}`);
      }
    }
  }

  // Exécute la logique de forfait en DB et prévient les clients
  async handleForfeit(
    io: Server,
    gameId: number,
    loser: { id: number; username: string; symbol: string },
    winner: { id: number; username: string; symbol: string },
    roomName: string,
  ) {
    try {
      /* --------- #255, #248 │ FIX: Centralized disconnect resolution ------*/
      const game = await this.getInProgressGameOrNull(gameId);
      if (!game) return;
      this.cancelAllTimersForGame(gameId);
      /* timer callback no longer tries to manage duplicate resolution on its own
         That should stop the double forfeit. */
      const playersInRoom = gameRoomService.getPlayersInRoom(gameId);
      const loserInRoom = playersInRoom.some((p) => p.userId === loser.id);
      if (loserInRoom) {
        // Loser reconnected before the timer callback could be cancelled —
        // skip the forfeit (join_game_room already cleared the timer).
        return;
      }
      const winnerInRoom = playersInRoom.some((p) => p.userId === winner.id);
      if (!winnerInRoom) {
        await this.handleBothDisconnected(io, gameId, roomName);
        return;
      }
      /* --------- #255, #248 │ FIX END -------------------- -----------*/

      // 1. Mise à jour de la base de données
      await prisma.game.update({
        where: { id: gameId },
        data: {
          status: "ABANDONED",
          winnerId: winner.id,
          finishedAt: new Date(),
        },
      });

      // 2. Notification Socket.io — emit to the game room (for the winner
      // who is still in it) AND to the loser's personal room (they already
      // left the game room so they wouldn't receive it otherwise).
      const forfeitPayload = {
        gameId,
        forfeitedBy: { id: loser.id, username: loser.username, symbol: loser.symbol },
        winner: { id: winner.id, username: winner.username, symbol: winner.symbol },
        winnerSymbol: winner.symbol,
        loserSymbol: loser.symbol,
        reason: "Player disconnected for too long",
        timestamp: new Date().toISOString(),
      };
      io.to(roomName).emit("game_forfeited", forfeitPayload);
      io.to(`user:${loser.id}`).emit("game_forfeited", forfeitPayload);

      console.log(`[Game Over] Game ${gameId} forfeited. Winner: ${winner.username}`);
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "P2025"
      ) {
        return;
      }
      console.error(`[Error] Failed to forfeit game ${gameId}:`, error);
    }
  }
}

export const disconnectionService = new DisconnectionService();
