import type { Server, Socket } from "socket.io";
import prisma from "../../lib/prisma";
import { gameRoomService } from "../services/gameRoom.service";

type JoinGameRoomPayload = { gameId?: unknown };
type LeaveGameRoomPayload = { gameId?: unknown };

type SocketUser = {
  id: number;
  username: string;
  avatarUrl?: string;
};

const gamePlayersSelect = {
  player1: {
    select: { id: true, username: true, avatarUrl: true },
  },
  player2: {
    select: { id: true, username: true, avatarUrl: true },
  },
} as const;

function assertGameId(value: unknown): number {
  if (!Number.isInteger(value) || Number(value) <= 0) {
    throw new Error("Invalid gameId");
  }
  return Number(value);
}

function roomNameForGame(gameId: number): string {
  return `game-${gameId}`;
}

function getSocketUser(socket: Socket): SocketUser {
  const user = socket.data.user as Partial<SocketUser> | undefined;

  if (!user || typeof user.id !== "number" || typeof user.username !== "string") {
    throw new Error("Unauthorized");
  }

  return {
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
  };
}

function buildJoinedPayload(game: {
  id: number;
  boardState: unknown;
  boardSize: number;
  currentTurn: string;
  status: string;
  winnerId: number | null;
  gameType: string;
  settings: unknown;
  player1Symbol: string;
  player2Symbol: string;
  tournamentId: number | null;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  player1: { id: number; username: string; avatarUrl: string };
  player2: { id: number; username: string; avatarUrl: string } | null;
}): Record<string, unknown> {
  return {
    gameId: game.id,
    game: {
      board: game.boardState,
      boardState: game.boardState,
      boardSize: game.boardSize,
      currentTurn: game.currentTurn,
      status: game.status,
      winnerId: game.winnerId,
      gameType: game.gameType,
      settings: game.settings,
      player1: game.player1,
      player2: game.player2,
      player1Symbol: game.player1Symbol,
      player2Symbol: game.player2Symbol,
      tournamentId: game.tournamentId,
      createdAt: game.createdAt,
      startedAt: game.startedAt,
      finishedAt: game.finishedAt,
    },
  };
}

export function registerGameRoomHandlers(io: Server, socket: Socket) {
  socket.on("join_game_room", async (payload: JoinGameRoomPayload) => {
    try {
      const user = getSocketUser(socket);
      const gameId = assertGameId(payload?.gameId);

      const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: gamePlayersSelect,
      });

      if (!game) {
        socket.emit("error", { message: "Game not found" });
        return;
      }

      const isPlayer = game.player1Id === user.id || game.player2Id === user.id;
      if (!isPlayer) {
        socket.emit("error", { message: "You are not in this game" });
        return;
      }

      const roomName = roomNameForGame(gameId);
      await socket.join(roomName);

      gameRoomService.addPlayerToRoom(gameId, {
        userId: user.id,
        socketId: socket.id,
        username: user.username,
        joinedAt: new Date(),
      });

      const yourSymbol = game.player1Id === user.id ? game.player1Symbol : game.player2Symbol;
      const payloadForClient = buildJoinedPayload(game);

      socket.emit("room_joined", {
        ...payloadForClient,
        game: {
          ...(payloadForClient.game as Record<string, unknown>),
          yourSymbol,
        },
      });

      socket.to(roomName).emit("opponent_joined", {
        opponent: {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatarUrl,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to join room";
      socket.emit("error", { message });
    }
  });

  socket.on("leave_game_room", async (payload: LeaveGameRoomPayload) => {
    try {
      const user = getSocketUser(socket);
      const gameId = assertGameId(payload?.gameId);
      const roomName = roomNameForGame(gameId);

      await socket.leave(roomName);
      gameRoomService.removePlayerFromRoom(gameId, user.id);

      socket.to(roomName).emit("opponent_left", {
        userId: user.id,
        username: user.username,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to leave room";
      socket.emit("error", { message });
    }
  });

  socket.on("disconnect", () => {
    try {
      const user = getSocketUser(socket);
      const removedEntries = gameRoomService.removePlayerFromAllRooms(user.id);

      for (const { gameId } of removedEntries) {
        const roomName = roomNameForGame(gameId);
        socket.to(roomName).emit("opponent_disconnected", {
          userId: user.id,
          username: user.username,
        });
      }
    } catch {
      // Ignore disconnect cleanup errors
    }
  });
}
