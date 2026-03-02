interface PlayerInRoom {
  userId: number;
  socketId: string;
  username: string;
  joinedAt: Date;
}

interface RoomState {
  gameId: number;
  players: PlayerInRoom[];
}

class GameRoomService {
  private rooms = new Map<number, RoomState>();

  addPlayerToRoom(gameId: number, player: PlayerInRoom) {
    if (!this.rooms.has(gameId)) {
      this.rooms.set(gameId, { gameId, players: [] });
    }

    const room = this.rooms.get(gameId)!;
    const existing = room.players.find((p) => p.userId === player.userId);

    if (existing) {
      existing.socketId = player.socketId;
      existing.joinedAt = new Date();
      existing.username = player.username;
      console.log(`[GameRoom] Player ${player.username} reconnected to room ${gameId} with new socket ID`);
      return;
    }

    room.players.push(player);
    console.log(`[GameRoom] Player ${player.username} joined room ${gameId}. Players in room: ${this.rooms.get(gameId)!.players.length}`);
  }

  removePlayerFromRoom(gameId: number, userId: number): PlayerInRoom | null {
    const room = this.rooms.get(gameId);
    if (!room) return null;

    const index = room.players.findIndex((p) => p.userId === userId);
    if (index === -1) return null;

    const [removed] = room.players.splice(index, 1);

    console.log(`[GameRoom] Player ${removed.username} left room ${gameId}. Players remaining: ${room.players.length}`);

    if (room.players.length === 0) {
      this.rooms.delete(gameId);
      console.log(`[GameRoom] Room ${gameId} deleted (empty)`);
    }

    return removed;
  }

  getPlayersInRoom(gameId: number): PlayerInRoom[] {
    const room = this.rooms.get(gameId);
    if (!room) return [];
    return [...room.players];
  }

  removePlayerFromAllRooms(
    userId: number,
  ): Array<{ gameId: number; removed: PlayerInRoom }> {
    const removedEntries: Array<{ gameId: number; removed: PlayerInRoom }> = [];

    for (const [gameId, room] of this.rooms.entries()) {
      const index = room.players.findIndex((p) => p.userId === userId);
      if (index === -1) continue;

      const [removed] = room.players.splice(index, 1);
      removedEntries.push({ gameId, removed });

      if (room.players.length === 0) {
        this.rooms.delete(gameId);
      }
    }

    return removedEntries;
  }
}

export const gameRoomService = new GameRoomService();
export type { PlayerInRoom, RoomState };
