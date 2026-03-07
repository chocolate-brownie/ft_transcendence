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

export function registerGameRoomHandlers(io: Server, socket: Socket) {
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
          const response = {
            error: "Unauthorized: You are not a participant in this game",
          };
          socket.emit("error", { message: response.error });
          callback?.(response);
          return;
        }

        // If the game has already ended, notify the client and do not join the room
        const terminalStatuses = ["ABANDONED", "FINISHED", "DRAW", "CANCELLED"];
        if (terminalStatuses.includes(game.status)) {
          const endedPayload = buildJoinedPayload(game);
          const yourSymbol =
            game.player1Id === user.id ? game.player1Symbol : game.player2Symbol;
          socket.emit("game_already_ended", {
            ...endedPayload,
            game: {
              ...(endedPayload.game as Record<string, unknown>),
              yourSymbol,
            },
          });
          callback?.({ error: "Game has already ended", status: game.status });
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

        // Re-fetch after room join so the joining client receives the latest
        // authoritative state (avoids stale snapshots during rematch races).
        const syncedGame = await prisma.game.findUnique({
          where: { id: gameId },
          include: gamePlayersSelect,
        });

        if (!syncedGame) {
          socket.emit("error", { message: "Game not found" });
          callback?.({ error: "Game not found" });
          return;
        }

        const yourSymbol =
          syncedGame.player1Id === user.id
            ? syncedGame.player1Symbol
            : syncedGame.player2Symbol;
        const payloadForClient = buildJoinedPayload(syncedGame);

        socket.emit("room_joined", {
          ...payloadForClient,
          game: {
            ...(payloadForClient.game as Record<string, unknown>),
            yourSymbol,
          },
        });

        const joinedPlayer =
          syncedGame.player1Id === user.id ? syncedGame.player1 : syncedGame.player2;
        const joinedRole = syncedGame.player1Id === user.id ? "player1" : "player2";
        const joinedSymbol =
          joinedRole === "player1" ? syncedGame.player1Symbol : syncedGame.player2Symbol;

        socket.to(roomName).emit("opponent_joined", {
          opponent: {
            id: user.id,
            username: user.username,
            avatarUrl: joinedPlayer?.avatarUrl ?? null,
            role: joinedRole,
            symbol: joinedSymbol,
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

      // Check if the game is still in progress
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: {
          player1: { select: { id: true, username: true } },
          player2: { select: { id: true, username: true } },
        },
      });

      if (game && game.status === "IN_PROGRESS") {
        const isPlayer1 = game.player1Id === user.id;
        const isPlayer2 = game.player2Id === user.id;

        if ((isPlayer1 || isPlayer2) && game.player1 && game.player2) {
          const opponent = isPlayer1 ? game.player2 : game.player1;
          const opponentSymbol = isPlayer1 ? game.player2Symbol : game.player1Symbol;
          const disconnectedSymbol = isPlayer1 ? game.player1Symbol : game.player2Symbol;

          // Start (or resume) forfeit timer — must happen before emitting so
          // getRemainingTime reflects the correct value.
          await disconnectionService.startForfeitTimer(
            io,
            gameId,
            { id: user.id, username: user.username, symbol: disconnectedSymbol },
            { id: opponent.id, username: opponent.username, symbol: opponentSymbol },
            roomName,
          );

          // Notify the opponent with actual remaining time
          const remainingWait = disconnectionService.getRemainingTime(gameId, user.id);
          socket.to(roomName).emit("opponent_disconnected", {
            gameId,
            userId: user.id,
            username: user.username,
            waitTime: remainingWait > 0 ? remainingWait : 30,
            message: "Opponent left the game, waiting for reconnection...",
          });

          // Let the leaving player know they still have an active game
          // so the frontend can show the rejoin banner immediately.
          socket.emit("active_game", { gameId });
        }
      } else {
        // Game terminée ou pas trouvée → simple notification
        socket.to(roomName).emit("opponent_left", {
          userId: user.id,
          username: user.username,
        });
      }
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

  // Rematch relay: only game participants can notify opponent in the old game room.
  socket.on(
    "send_rematch",
    async (
      payload: { gameId?: unknown; newGameId?: unknown },
      callback?: AckCallback,
    ) => {
      try {
        const user = getSocketUser(socket);
        const gameId = assertGameId(payload?.gameId);
        const newGameId = assertGameId(payload?.newGameId);

        const game = await prisma.game.findUnique({
          where: { id: gameId },
          select: { player1Id: true, player2Id: true },
        });

        if (!game) {
          const response = { error: "Game not found" };
          socket.emit("error", { message: response.error });
          callback?.(response);
          return;
        }

        const isParticipant = game.player1Id === user.id || game.player2Id === user.id;
        if (!isParticipant) {
          const response = {
            error: "Unauthorized: You are not a participant in this game",
          };
          socket.emit("error", { message: response.error });
          callback?.(response);
          return;
        }

        const newGame = await prisma.game.findUnique({
          where: { id: newGameId },
          select: { player1Id: true, player2Id: true },
        });

        if (!newGame) {
          const response = { error: "Invalid rematch target game" };
          socket.emit("error", { message: response.error });
          callback?.(response);
          return;
        }

        const sourcePair = [game.player1Id, game.player2Id].filter(
          (value): value is number => typeof value === "number",
        );
        const targetPair = [newGame.player1Id, newGame.player2Id].filter(
          (value): value is number => typeof value === "number",
        );

        if (sourcePair.length !== 2 || targetPair.length !== 2) {
          const response = { error: "Invalid rematch target game" };
          socket.emit("error", { message: response.error });
          callback?.(response);
          return;
        }

        const sourcePairKey = sourcePair.sort((a, b) => a - b).join(":");
        const targetPairKey = targetPair.sort((a, b) => a - b).join(":");
        if (sourcePairKey !== targetPairKey) {
          const response = { error: "Invalid rematch target game" };
          socket.emit("error", { message: response.error });
          callback?.(response);
          return;
        }

        const roomName = getGameRoomName(gameId);
        socket.to(roomName).emit("rematch_received", { newGameId });
        callback?.({ success: true });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to send rematch";
        socket.emit("error", { message });
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
