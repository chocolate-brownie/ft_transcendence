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

/* ── Helpers ────────────────────────────────────────────────────── */

/** Resolve which role the user holds and who the opponent is. */
function resolveRoles(
  game: {
    player1Id: number;
    player2Id: number | null;
    player1Symbol: string;
    player2Symbol: string;
    player1: { id: number; username: string; [k: string]: unknown } | null;
    player2: { id: number; username: string; [k: string]: unknown } | null;
  },
  userId: number,
) {
  const isPlayer1 = game.player1Id === userId;
  return {
    isPlayer1,
    role: isPlayer1 ? ("player1" as const) : ("player2" as const),
    opponent: isPlayer1 ? game.player2 : game.player1,
    opponentId: isPlayer1 ? game.player2Id : game.player1Id,
    yourSymbol: isPlayer1 ? game.player1Symbol : game.player2Symbol,
    opponentSymbol: isPlayer1 ? game.player2Symbol : game.player1Symbol,
  };
}

/** Send an error to the socket and optionally ack the callback. */
function emitError(socket: Socket, message: string, callback?: AckCallback) {
  socket.emit("error", { message });
  callback?.({ error: message });
}

/** Build the payload sent with room_joined / game_already_ended.
 *  Accepts the raw Prisma result (with gamePlayersSelect included). */
function buildJoinedPayload(
  game: Awaited<ReturnType<typeof prisma.game.findUnique>> & { player1: unknown; player2: unknown },
): Record<string, unknown> {
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

/**
 * After a player leaves the game room via SPA navigation (socket still
 * alive), wait a short grace period then start the forfeit timer.
 * Page refreshes kill the socket within ~1 s — the disconnect handler
 * covers that case instead.
 */
function scheduleDeferredForfeit(
  io: Server,
  socket: Socket,
  gameId: number,
  user: { id: number; username: string },
  roomName: string,
) {
  const LEAVE_GRACE_MS = 1500;

  setTimeout(
    () =>
      void (async () => {
        if (!socket.connected) return; // refresh or close — disconnect handler covers it

        const game = await prisma.game.findUnique({
          where: { id: gameId },
          select: {
            status: true,
            player1Id: true,
            player2Id: true,
            player1Symbol: true,
            player2Symbol: true,
            player1: { select: { id: true, username: true } },
            player2: { select: { id: true, username: true } },
          },
        });

        if (!game || game.status !== "IN_PROGRESS") return;

        const { opponent, yourSymbol, opponentSymbol } = resolveRoles(game, user.id);
        if (!opponent) return;

        await disconnectionService.startForfeitTimer(
          io,
          gameId,
          { id: user.id, username: user.username, symbol: yourSymbol },
          { id: opponent.id, username: opponent.username, symbol: opponentSymbol },
          roomName,
        );

        const remainingWait = disconnectionService.getRemainingTime(gameId, user.id);
        io.to(roomName).emit("opponent_disconnected", {
          gameId,
          userId: user.id,
          username: user.username,
          waitTime: remainingWait > 0 ? remainingWait : 30,
          message: "Opponent disconnected, waiting for reconnection...",
        });

        // Tell the leaving player they still have an active game so the
        // ActiveGameBanner appears and they can rejoin.
        socket.emit("active_game", { gameId });
      })(),
    LEAVE_GRACE_MS,
  );
}

/* ── Socket handlers ───────────────────────────────────────────── */

export function registerGameRoomHandlers(io: Server, socket: Socket) {
  socket.on(
    "join_game_room",
    async (payload: JoinGameRoomPayload, callback?: AckCallback) => {
      try {
        const user = getSocketUser(socket);
        const gameId = assertGameId(payload?.gameId);

        // Cancel forfeit timer BEFORE any async work — prevents the timer
        // callback from firing during a Prisma await and forfeiting the game
        // while this handler is still running.
        const cancelled = disconnectionService.cancelForfeitTimer(gameId, user.id);

        const game = await prisma.game.findUnique({
          where: { id: gameId },
          include: gamePlayersSelect,
        });

        if (!game) {
          emitError(socket, "Game not found");
          return;
        }

        const isPlayer = game.player1Id === user.id || game.player2Id === user.id;
        if (!isPlayer) {
          emitError(socket, "Unauthorized: You are not a participant in this game", callback);
          return;
        }

        // If the game has already ended, notify the client and do not join the room
        const terminalStatuses = ["ABANDONED", "FINISHED", "DRAW", "CANCELLED"];
        if (terminalStatuses.includes(game.status)) {
          const { yourSymbol } = resolveRoles(game, user.id);
          const endedPayload = buildJoinedPayload(game);
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
          emitError(socket, "Game not found", callback);
          return;
        }

        const { yourSymbol, opponentId, opponent: opponentUser, role } =
          resolveRoles(syncedGame, user.id);
        const payloadForClient = buildJoinedPayload(syncedGame);

        // Check if the opponent has an active forfeit timer (i.e. they are
        // disconnected).  Include this in the payload so the frontend can
        // restore the disconnect warning after a refresh or navigation.
        const opponentRemaining = opponentId
          ? disconnectionService.getRemainingTime(gameId, opponentId)
          : 0;

        socket.emit("room_joined", {
          ...payloadForClient,
          game: {
            ...(payloadForClient.game as Record<string, unknown>),
            yourSymbol,
            ...(opponentRemaining > 0 && opponentUser
              ? {
                  opponentDisconnected: {
                    username: opponentUser.username,
                    remainingTime: opponentRemaining,
                  },
                }
              : {}),
          },
        });

        const joinedPlayer = role === "player1" ? syncedGame.player1 : syncedGame.player2;
        const joinedSymbol =
          role === "player1" ? syncedGame.player1Symbol : syncedGame.player2Symbol;

        socket.to(roomName).emit("opponent_joined", {
          opponent: {
            id: user.id,
            username: user.username,
            avatarUrl: joinedPlayer?.avatarUrl ?? null,
            role,
            symbol: joinedSymbol,
          },
        });
        callback?.({ success: true });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to join room";
        emitError(socket, message, callback);
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

      // Delay the forfeit timer start to distinguish page refresh (socket
      // disconnects within ~1s) from SPA navigate-away (socket stays alive).
      // If the socket disconnects, the disconnect handler starts the timer
      // instead — no duplicate because it checks alreadyRunning.
      scheduleDeferredForfeit(io, socket, gameId, user, roomName);
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
          emitError(socket, "Game not found", callback);
          return;
        }

        const isParticipant = game.player1Id === user.id || game.player2Id === user.id;
        if (!isParticipant) {
          emitError(
            socket,
            "Unauthorized: You are not a participant in this game",
            callback,
          );
          return;
        }

        const newGame = await prisma.game.findUnique({
          where: { id: newGameId },
          select: { player1Id: true, player2Id: true },
        });

        if (!newGame) {
          emitError(socket, "Invalid rematch target game", callback);
          return;
        }

        const sourcePair = [game.player1Id, game.player2Id].filter(
          (value): value is number => typeof value === "number",
        );
        const targetPair = [newGame.player1Id, newGame.player2Id].filter(
          (value): value is number => typeof value === "number",
        );

        if (sourcePair.length !== 2 || targetPair.length !== 2) {
          emitError(socket, "Invalid rematch target game", callback);
          return;
        }

        const sourcePairKey = sourcePair.sort((a, b) => a - b).join(":");
        const targetPairKey = targetPair.sort((a, b) => a - b).join(":");
        if (sourcePairKey !== targetPairKey) {
          emitError(socket, "Invalid rematch target game", callback);
          return;
        }

        const roomName = getGameRoomName(gameId);
        socket.to(roomName).emit("rematch_received", { newGameId });
        callback?.({ success: true });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to send rematch";
        emitError(socket, message, callback);
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
