import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import prisma from "../src/lib/prisma";
import { registerGameRoomHandlers } from "../src/socket/handlers/gameRoom.handlers";

type JoinHandler = (payload: { gameId?: unknown }, callback?: (response: any) => void) => void;

function createMockSocket() {
  const handlers = new Map<string, JoinHandler>();

  return {
    id: "socket-1",
    data: {
      user: {
        id: 10,
        username: "alice",
        avatarUrl: null,
      },
    },
    on: jest.fn((event: string, handler: JoinHandler) => {
      handlers.set(event, handler);
      return undefined;
    }),
    emit: jest.fn(),
    join: jest.fn(async (_room: string) => undefined),
    to: jest.fn(() => ({ emit: jest.fn() })),
    getHandler(event: string) {
      return handlers.get(event);
    },
  };
}

describe("gameRoom join sync snapshot", () => {
  let findUniqueSpy: jest.SpiedFunction<typeof prisma.game.findUnique>;

  beforeEach(() => {
    findUniqueSpy = jest.spyOn(prisma.game, "findUnique");
  });

  afterEach(() => {
    findUniqueSpy.mockRestore();
  });

  it("emits room_joined with the post-join latest board snapshot", async () => {
    const staleGame = {
      id: 1,
      player1Id: 10,
      player2Id: 20,
      boardState: Array(9).fill(null),
      boardSize: 3,
      currentTurn: "X",
      status: "IN_PROGRESS",
      winnerId: null,
      gameType: "ONLINE",
      settings: null,
      player1Symbol: "X",
      player2Symbol: "O",
      tournamentId: null,
      createdAt: new Date(),
      startedAt: new Date(),
      finishedAt: null,
      player1: { id: 10, username: "alice", avatarUrl: null },
      player2: { id: 20, username: "bob", avatarUrl: null },
    };

    const freshGame = {
      ...staleGame,
      boardState: ["X", null, null, null, null, null, null, null, null],
      currentTurn: "O",
    };

    findUniqueSpy.mockResolvedValueOnce(staleGame as any).mockResolvedValueOnce(freshGame as any);

    const socket = createMockSocket();
    registerGameRoomHandlers({} as any, socket as any);

    const joinHandler = socket.getHandler("join_game_room");
    expect(joinHandler).toBeDefined();

    await joinHandler?.({ gameId: 1 });

    const roomJoinedCall = socket.emit.mock.calls.find((call) => call[0] === "room_joined");
    const roomJoinedPayload = roomJoinedCall?.[1] as any;
    expect(roomJoinedCall).toBeDefined();
    expect(roomJoinedPayload?.game?.boardState).toEqual(freshGame.boardState);
    expect(roomJoinedPayload?.game?.currentTurn).toBe("O");
    expect(findUniqueSpy).toHaveBeenCalledTimes(2);
    expect(socket.join).toHaveBeenCalledWith("game-1");
  });
});
