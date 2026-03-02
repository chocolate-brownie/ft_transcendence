// ─── Matchmaking Service ───────────────────────────────────────────────────
// In-memory FIFO queue that pairs players for random matches.
// Phase 4: simple first-come-first-served. Phase 5: Redis + Elo.

interface QueuedPlayer {
  userId: number;
  socketId: string;
  joinedAt: Date;
}

class MatchmakingService {
  private queue: QueuedPlayer[] = [];

  
   // Add a player to the matchmaking queue.
   // Throws if the player is already queued.

  addToQueue(player: QueuedPlayer): void {
    if (this.isInQueue(player.userId)) {
      throw new Error("Already in queue");
    }
    this.queue.push(player);
    console.log(
      `[Matchmaking] Player ${player.userId} joined queue (size: ${this.queue.length})`,
    );
  }

    // Remove a player from the queue by userId.
    // Returns the removed entry, or null if not found.

  removeFromQueue(userId: number): QueuedPlayer | null {
    const index = this.queue.findIndex((p) => p.userId === userId);
    if (index === -1) return null;
    const [removed] = this.queue.splice(index, 1);
    console.log(
      `[Matchmaking] Player ${removed.userId} left queue (size: ${this.queue.length})`,
    );
    return removed;
  }

  // Check whether a user is currently in the queue.
  isInQueue(userId: number): boolean {
    return this.queue.some((p) => p.userId === userId);
  }

  // 1-based position in queue (0 = not in queue). 
  getQueuePosition(userId: number): number {
    return this.queue.findIndex((p) => p.userId === userId) + 1;
  }

   // Try to dequeue two players for a match (FIFO).
   // Returns the pair or null if fewer than 2 players are waiting.

  dequeueMatch(): { player1: QueuedPlayer; player2: QueuedPlayer } | null {
    if (this.queue.length < 2) return null;
    const player1 = this.queue.shift()!;
    const player2 = this.queue.shift()!;
    console.log(
      `[Matchmaking] Pairing player ${player1.userId} vs ${player2.userId}`,
    );
    return { player1, player2 };
  }

   // Re-insert a player at the front of the queue.
   // Used when a match attempt fails and we need to restore their position.

  requeueAtFront(player: QueuedPlayer): void {
    if (this.isInQueue(player.userId)) return;
    this.queue.unshift(player);
    console.log(
      `[Matchmaking] Player ${player.userId} re-queued at front (size: ${this.queue.length})`,
    );
  }
}

export const matchmakingService = new MatchmakingService();
