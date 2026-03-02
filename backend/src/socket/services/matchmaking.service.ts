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

  // Guards against the same userId entering find_game concurrently
  // (e.g. two sockets for the same account, or rapid duplicate emits).
  // The async gap between isInQueue() and addToQueue() would otherwise
  // allow two handlers to both pass the check before either writes.
  private processing = new Set<number>();

  // Returns true if the caller may proceed; false if already in flight.
  startProcessing(userId: number): boolean {
    if (this.processing.has(userId)) return false;
    this.processing.add(userId);
    return true;
  }

  stopProcessing(userId: number): void {
    this.processing.delete(userId);
  }

  // Add a player to the matchmaking queue.
  // Throws if the player is already queued.
  addToQueue(player: QueuedPlayer): void {
    if (this.isInQueue(player.userId)) {
      throw new Error("Already in queue");
    }
    this.queue.push(player);
  }

  // Remove a player from the queue by userId.
  // Returns the removed entry, or null if not found.
  removeFromQueue(userId: number): QueuedPlayer | null {
    const index = this.queue.findIndex((p) => p.userId === userId);
    if (index === -1) return null;
    const [removed] = this.queue.splice(index, 1);
    return removed;
  }

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
    return { player1, player2 };
  }

  // Re-insert a player at the front of the queue.
  // Used when a match attempt fails and we need to restore their position.
  requeueAtFront(player: QueuedPlayer): void {
    if (this.isInQueue(player.userId)) return;
    this.queue.unshift(player);
  }
}

export const matchmakingService = new MatchmakingService();
