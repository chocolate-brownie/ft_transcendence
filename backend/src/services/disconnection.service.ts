import { Server } from "socket.io";
import prisma from "../lib/prisma";

interface ForfeitTimer {
  gameId: number;
  disconnectedUserId: number;
  timeout: NodeJS.Timeout;
  startedAt: number; // Date.now() when the original timer was created
}

class DisconnectionService {
  private forfeitTimers: Map<string, ForfeitTimer> = new Map();
  private readonly FORFEIT_DELAY = 30000; // 30 seconds

  // Start (or resume) the forfeit countdown for a disconnected player.
  // If a timer already existed for this key we use the *original* startedAt
  // so that reconnecting then disconnecting again does NOT reset the 30s window.
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
      this.forfeitTimers.delete(key);
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
      // 1. Mise à jour de la base de données
      await prisma.game.update({
        where: { id: gameId },
        data: {
          status: "ABANDONED",
          winnerId: winner.id,
          finishedAt: new Date(),
        },
      });

      // 2. Notification Socket.io
      io.to(roomName).emit("game_forfeited", {
        gameId,
        forfeitedBy: { id: loser.id, username: loser.username, symbol: loser.symbol },
        winner: { id: winner.id, username: winner.username, symbol: winner.symbol },
        winnerSymbol: winner.symbol,
        loserSymbol: loser.symbol,
        reason: "Player disconnected for too long",
        timestamp: new Date().toISOString(),
      });

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
