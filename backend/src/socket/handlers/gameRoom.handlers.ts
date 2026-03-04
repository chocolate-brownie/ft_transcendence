import type { Server, Socket } from "socket.io";
import prisma from "../../lib/prisma";
import { gameRoomService } from "../services/gameRoom.service";
import { getSocketUser, getGameRoomName, assertGameId } from "../helpers";
import { disconnectionService } from "../../services/disconnection.service";

type JoinGameRoomPayload = { gameId?: unknown };
type LeaveGameRoomPayload = { gameId?: unknown };
type GameStatePayload = { gameId?: unknown };
type AckCallback = (response: Record<string, unknown>) => void;

const gamePlayersSelect = {
  player1: {
    select: { id: true, username: true, avatarUrl: true },
  },
  player2: {
    select: { id: true, username: true, avatarUrl: true },
  },
} as const;

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
  player1: { id: number; username: string; avatarUrl: string | null };
  player2: { id: number; username: string; avatarUrl: string | null } | null;
}): Record<string, unknown> {
  return {
    gameId: game.id,
    game: {
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

export function registerGameRoomHandlers(_io: Server, socket: Socket) {
  socket.on(
    "join_game_room",
    async (payload: JoinGameRoomPayload, callback?: AckCallback) => {
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
        const response = { error: "Unauthorized: You are not a participant in this game" };
        socket.emit("error", { message: response.error });
        callback?.(response);
        return;
      }

      const roomName = getGameRoomName(gameId);

      const cancelled = disconnectionService.cancelForfeitTimer(gameId, user.id);
      if (cancelled) {
        socket.to(roomName).emit("opponent_reconnected", {
          userId: user.id,
          username: user.username,
          message: "Opponent reconnected",
        });
      }

      await socket.join(roomName);

      gameRoomService.addPlayerToRoom(gameId, {
        userId: user.id,
        socketId: socket.id,
        username: user.username,
        joinedAt: new Date(),
      });

      const yourSymbol =
        game.player1Id === user.id ? game.player1Symbol : game.player2Symbol;
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
      callback?.({ success: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to join room";
      socket.emit("error", { message });
      callback?.({ error: message });
    }
    },
  );

  socket.on("leave_game_room", async (payload: LeaveGameRoomPayload) => {
    try {
      const user = getSocketUser(socket);
      const gameId = assertGameId(payload?.gameId);
      const roomName = getGameRoomName(gameId);

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

  socket.on(
    "get_game_state",
    async (payload: GameStatePayload, callback?: AckCallback) => {
      try {
        const user = getSocketUser(socket);
        const gameId = assertGameId(payload?.gameId);
        const game = await prisma.game.findUnique({
          where: { id: gameId },
        });

        if (!game) {
          callback?.({ error: "Game not found" });
          return;
        }

        const isPlayer = game.player1Id === user.id || game.player2Id === user.id;
        if (!isPlayer) {
          callback?.({
            error: "Unauthorized: You are not a participant in this game",
          });
          return;
        }

        callback?.({
          gameId: game.id,
          boardState: game.boardState,
          boardSize: game.boardSize,
          currentTurn: game.currentTurn,
          status: game.status,
          winnerId: game.winnerId,
          player1Id: game.player1Id,
          player2Id: game.player2Id,
          player1Symbol: game.player1Symbol,
          player2Symbol: game.player2Symbol,
          createdAt: game.createdAt,
          finishedAt: game.finishedAt,
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to fetch game state";
        callback?.({ error: message });
      }
    },
  );
}

export function handleGameRoomDisconnect(_io: Server, socket: Socket) {
  try {
    const user = getSocketUser(socket);
    // Only clean up room membership here. The disconnect notification for
    // active games is emitted by disconnection.handlers.ts to avoid duplicates.
    gameRoomService.removePlayerFromAllRooms(user.id);
  } catch {
    // Ignore disconnect cleanup errors
  }
}
