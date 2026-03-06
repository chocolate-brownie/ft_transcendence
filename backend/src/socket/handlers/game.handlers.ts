import type { Server, Socket } from "socket.io";
import { makeMoveInDb, checkGameOver } from "../../services/games.service";
import { getSocketUser, getGameRoomName, assertGameId } from "../helpers";
import { processGameOver } from "../../services/gameOver.service";
import type { Board } from "../../types/game";
import { disconnectionService } from "../../services/disconnection.service";
import type { BoardSize } from "../../types/game";

export function registerGameHandlers(io: Server, socket: Socket) {
  socket.on("make_move", async (payload: unknown) => {
    const rawGameId = (payload as any)?.gameId;
    const rawCellIndex = (payload as any)?.cellIndex;
    const cellIndex = typeof rawCellIndex === "number" ? rawCellIndex : null;
    let gameId: number | null = null;

    try {
      const user = getSocketUser(socket);
      gameId = assertGameId(rawGameId);

      // 1. Validation de l'index
      if (
        cellIndex === null ||
        cellIndex < 0 ||
        !Number.isInteger(cellIndex)
      ) {
        socket.emit("move_error", { error: "Invalid cell index", cellIndex });
        return;
      }

      // 2. Exécution du mouvement en base de données
      // C'est ici que le statut passe à "FINISHED" ou "DRAW" si le coup est gagnant
      const updatedGame = await makeMoveInDb(gameId, cellIndex, user.id);

      // 3. Détermination du symbole du joueur pour le log/payload
      const playerSymbol =
        updatedGame.player1Id === user.id
          ? updatedGame.player1Symbol
          : updatedGame.player2Symbol;

      // 4. Vérification de la ligne gagnante (pour le frontend)
      const boardData = updatedGame.boardState as Board; // Cast pour s'assurer que c'est bien un Board
      const gameOverResult = checkGameOver(boardData, updatedGame.boardSize as BoardSize);

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
        ...(gameOverResult.line && { winningLine: gameOverResult.line }),
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