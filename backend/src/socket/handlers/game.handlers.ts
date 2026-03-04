import type { Server, Socket } from "socket.io";
import { makeMoveInDb, checkGameOver } from "../../services/games.service";
import { getSocketUser, getGameRoomName, assertGameId } from "../helpers";
import { processGameOver } from "../../services/gameOver.service";
import type { Board } from "../../types/game";
import prisma from "../../lib/prisma";
import { disconnectionService } from "../../services/disconnection.service";

export function registerGameHandlers(io: Server, socket: Socket) {

  // --- HANDLER: JOIN GAME (Essentiel pour Test 4 & 5) ---
  socket.on("join_game_room", async ({ gameId }) => {
    const user = getSocketUser(socket);
    const id = assertGameId(gameId);

    const game = await prisma.game.findUnique({
      where: { id },
      select: { player1Id: true, player2Id: true }
    });

    // VERIFICATION D'AUTORISATION
    if (!game || (game.player1Id !== user.id && game.player2Id !== user.id)) {
      console.warn(`[Auth] User ${user.id} tried to join game ${id} without permission`);
      socket.emit("unauthorized", { error: "You are not a participant in this game" });
      return;
    }

      // ANNULLER LE FORFAIT SI RECONNEXION
    const cancelled = disconnectionService.cancelForfeitTimer(id, user.id);
    if (cancelled) {
       socket.to(getGameRoomName(id)).emit("opponent_reconnected", {
        userId: user.id,
        username: user.username,
        message: "Opponent reconnected"
      });
    }

    await socket.join(getGameRoomName(id));
    console.log(`[Game ${id}] User ${user.username} joined the room`);
  });

  socket.on("get_game_state", async ({ gameId }, callback) => {
    try {
      const id = assertGameId(gameId);
      const game = await prisma.game.findUnique({
        where: { id },
      });

      if (!game) {
        return callback?.({ error: "Game not found" });
      }

      // On renvoie l'état pour que le client se synchronise
      callback?.(game);
    } catch (e) {
      callback?.({ error: "Failed to fetch game state", e });
    }
  });

  socket.on("make_move", async (payload: unknown) => {
    const rawGameId = (payload as any)?.gameId;
    const rawCellIndex = (payload as any)?.cellIndex;
    const cellIndex = typeof rawCellIndex === "number" ? rawCellIndex : null;
    let gameId: number | null = null;

    try {
      const user = getSocketUser(socket);
      gameId = assertGameId(rawGameId);

      // 1. Validation de l'index
      if (cellIndex === null || cellIndex < 0 || cellIndex > 8 || !Number.isInteger(cellIndex)) {
        socket.emit("move_error", { error: "Invalid cell index", cellIndex });
        return;
      }

      // 2. Exécution du mouvement en base de données
      // C'est ici que le statut passe à "FINISHED" ou "DRAW" si le coup est gagnant
      const updatedGame = await makeMoveInDb(gameId, cellIndex, user.id);

      // 3. Détermination du symbole du joueur pour le log/payload
      const playerSymbol = updatedGame.player1Id === user.id
        ? updatedGame.player1Symbol
        : updatedGame.player2Symbol;

      // 4. Vérification de la ligne gagnante (pour le frontend)
      const boardData = updatedGame.boardState as Board; // Cast pour s'assurer que c'est bien un Board
      const gameOverResult = checkGameOver(
        boardData,
        updatedGame.boardSize
      );

      // 5. Construction du payload de mise à jour standard
      const gameUpdate = {
        gameId: updatedGame.id,
        board: updatedGame.boardState,
        currentTurn: updatedGame.currentTurn,
        status: updatedGame.status,
        player1Symbol: updatedGame.player1Symbol,
        player2Symbol: updatedGame.player2Symbol,
        lastMove: {
          player: playerSymbol,
          userId: user.id,
          cellIndex,
          timestamp: new Date().toISOString(),
        },
        ...(gameOverResult.line && { winningLine: gameOverResult.line })
      };

      // 6. Broadcast de l'update (toujours envoyé pour mettre à jour le plateau)
      const roomName = getGameRoomName(gameId);
      io.to(roomName).emit("game_update", gameUpdate);

      console.log(`[Game ${gameId}] Move by ${user.username} (${playerSymbol})`);

      // 7. Gestion de la fin de partie via le service dédié
      if (updatedGame.status === "FINISHED" || updatedGame.status === "DRAW") {
        disconnectionService.cancelAllTimersForGame(updatedGame.id);

        await processGameOver(io, updatedGame, gameOverResult);
      }

    } catch (error: unknown) {
      const rawMessage = error instanceof Error ? error.message : "Failed to make move";
      const errorMessage = rawMessage.replace(/^Invalid move:\s*/i, "");

      console.warn(`[Game ${gameId ?? "?"}] Move rejected: ${errorMessage}`);
      socket.emit("move_error", { error: errorMessage, cellIndex });
    }
  });
}
