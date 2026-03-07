import type { Server, Socket } from "socket.io";
import prisma from "../../lib/prisma";
import { matchmakingService } from "../services/matchmaking.service";
import { createGameInDb } from "../../services/games.service";
import { gameRoomService } from "../services/gameRoom.service";
import { disconnectionService } from "../../services/disconnection.service";
import { getGameRoomName } from "../helpers";

export function registerMatchmakingHandlers(io: Server, socket: Socket) {
  const userId: number = socket.data.user.id;

  socket.on("find_game", async () => {
    if (!matchmakingService.startProcessing(userId)) return;
    try {
      if (matchmakingService.isInQueue(userId)) {
        return socket.emit("error", { message: "Already searching for a game" });
      }

      const activeGame = await prisma.game.findFirst({
        where: {
          OR: [{ player1Id: userId }, { player2Id: userId }],
          status: "IN_PROGRESS",
        },
        include: {
          player1: { select: { id: true, username: true } },
          player2: { select: { id: true, username: true } },
        },
      });
      if (activeGame) {
        // Check if the player is actually in the game room
        const playersInRoom = gameRoomService.getPlayersInRoom(activeGame.id);
        const isInRoom = playersInRoom.some((p) => p.userId === userId);

        if (isInRoom) {
          return socket.emit("error", { message: "Already in an active game" });
        }

        // Player is not in the room — auto-forfeit the stale game
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[Matchmaking] Auto-forfeiting stale game ${activeGame.id} for user ${userId}`,
          );
        }

        const isPlayer1 = activeGame.player1Id === userId;
        const opponent = isPlayer1 ? activeGame.player2 : activeGame.player1;

        if (opponent) {
          const disconnectedSymbol = isPlayer1
            ? activeGame.player1Symbol
            : activeGame.player2Symbol;
          const opponentSymbol = isPlayer1
            ? activeGame.player2Symbol
            : activeGame.player1Symbol;
          const roomName = getGameRoomName(activeGame.id);

          await disconnectionService.handleForfeit(
            io,
            activeGame.id,
            {
              id: userId,
              username: socket.data.user.username,
              symbol: disconnectedSymbol,
            },
            { id: opponent.id, username: opponent.username, symbol: opponentSymbol },
            roomName,
          );
        } else {
          // No opponent — just mark as abandoned
          await prisma.game.update({
            where: { id: activeGame.id },
            data: { status: "ABANDONED", finishedAt: new Date() },
          });
        }
      }

      matchmakingService.addToQueue({
        userId,
        socketId: socket.id,
        joinedAt: new Date(),
      });

      socket.emit("searching", {
        position: matchmakingService.getQueuePosition(userId),
      });

      const match = matchmakingService.dequeueMatch();
      if (!match) return;

      const { player1, player2 } = match;

      const p1Socket = io.sockets.sockets.get(player1.socketId);
      const p2Socket = io.sockets.sockets.get(player2.socketId);

      if (!p1Socket || !p2Socket) {
        if (p1Socket) matchmakingService.requeueAtFront(player1);
        if (p2Socket) matchmakingService.requeueAtFront(player2);
        return;
      }

      for (const player of [player1, player2]) {
        const active = await prisma.game.findFirst({
          where: {
            OR: [{ player1Id: player.userId }, { player2Id: player.userId }],
            status: "IN_PROGRESS",
          },
        });
        if (active) {
          const other = player === player1 ? player2 : player1;
          matchmakingService.requeueAtFront(other);
          io.sockets.sockets.get(player.socketId)?.emit("error", {
            message: "Already in an active game",
          });
          return;
        }
      }

      let game;
      try {
        game = await createGameInDb(player1.userId, player2.userId);
      } catch (err) {
        matchmakingService.requeueAtFront(player2);
        matchmakingService.requeueAtFront(player1);
        console.error("[Matchmaking] Game creation failed:", err);
        p1Socket.emit("error", { message: "Matchmaking failed, please retry" });
        p2Socket.emit("error", { message: "Matchmaking failed, please retry" });
        return;
      }

      if (!game.player2) {
        console.error("[Matchmaking] Game created without player2");
        p1Socket.emit("error", { message: "Matchmaking failed" });
        p2Socket.emit("error", { message: "Matchmaking failed" });
        return;
      }

      const roomName = `game-${game.id}`;
      await p1Socket.join(roomName);
      await p2Socket.join(roomName);

      p1Socket.emit("match_found", {
        gameId: game.id,
        opponent: {
          id: game.player2.id,
          username: game.player2.username,
          avatarUrl: game.player2.avatarUrl,
        },
        yourSymbol: game.player1Symbol,
        room: roomName,
      });

      p2Socket.emit("match_found", {
        gameId: game.id,
        opponent: {
          id: game.player1.id,
          username: game.player1.username,
          avatarUrl: game.player1.avatarUrl,
        },
        yourSymbol: game.player2Symbol,
        room: roomName,
      });
    } catch (error: unknown) {
      console.error("[Matchmaking] Error:", error);
      const message = error instanceof Error ? error.message : "Matchmaking failed";
      socket.emit("error", { message });
    } finally {
      matchmakingService.stopProcessing(userId);
    }
  });

  socket.on("cancel_search", () => {
    const removed = matchmakingService.removeFromQueue(userId);
    if (removed) {
      socket.emit("search_cancelled");
    }
  });
}
