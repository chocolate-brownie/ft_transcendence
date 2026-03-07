import { Server } from "socket.io";
import prisma from "../lib/prisma";

interface ForfeitTimer {
  gameId: number;
  disconnectedUserId: number;
  timeout: NodeJS.Timeout;
}

class DisconnectionService {
  private forfeitTimers: Map<string, ForfeitTimer> = new Map();
  private readonly FORFEIT_DELAY = 30000; // 30 seconds

  // Démarre le compte à rebours avant forfait
  async startForfeitTimer(
    io: Server,
    gameId: number,
    disconnectedUser: { id: number; username: string; symbol: string },
    opponent: { id: number; username: string; symbol: string },
    roomName: string,
  ) {
    const key = `${gameId}-${disconnectedUser.id}`;
    this.cancelForfeitTimer(gameId, disconnectedUser.id);

    const timeout = setTimeout(() => {
      void this.handleForfeit(io, gameId, disconnectedUser, opponent, roomName);
      this.forfeitTimers.delete(key);
    }, this.FORFEIT_DELAY);
    timeout.unref?.();

    this.forfeitTimers.set(key, {
      gameId,
      disconnectedUserId: disconnectedUser.id,
      timeout,
    });

    console.log(
      `[Timer] Forfeit started for ${disconnectedUser.username} in game ${gameId}`,
    );
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
