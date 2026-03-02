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

  addPlayerToRoom(_gameId: number, _player: PlayerInRoom) {
    // TODO
  }

  removePlayerFromRoom(_gameId: number, _userId: number): PlayerInRoom | null {
    // TODO
    return null;
  }

  getPlayersInRoom(_gameId: number): PlayerInRoom[] {
    // TODO
    return [];
  }

  removePlayerFromAllRooms(
    _userId: number,
  ): Array<{ gameId: number; removed: PlayerInRoom }> {
    // TODO
    return [];
  }
}

export const gameRoomService = new GameRoomService();
export type { PlayerInRoom, RoomState };
