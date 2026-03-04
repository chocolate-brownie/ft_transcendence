import type { Server, Socket } from "socket.io";
import { makeMoveInDb, checkGameOver } from "../../services/games.service";
import { getSocketUser, getGameRoomName, assertGameId } from "../helpers";
import type { Board } from "../../types/game";

export function registerGameHandlers(io: Server, socket: Socket) {
  socket.on("make_move", async (payload: unknown) => {
    const rawGameId = (payload as any)?.gameId;
    const rawCellIndex = (payload as any)?.cellIndex;
    const cellIndex = typeof rawCellIndex === "number" ? rawCellIndex : null;
    let gameId: number | null = null;

    try {
      const user = getSocketUser(socket);

      // Check gameId
      gameId = assertGameId(rawGameId);

      // Check cellIndex
      if (
        typeof rawCellIndex !== "number" ||
        !Number.isInteger(rawCellIndex) ||
        rawCellIndex < 0 ||
        rawCellIndex > 8
      ) {
        socket.emit("move_error", {
          error: "Invalid cell index",
          cellIndex: rawCellIndex ?? null,
        });
        return;
      }

      // Execute Move (atomic transaction in service)
      const updatedGame = await makeMoveInDb(gameId, rawCellIndex, user.id);

      // Check Player Symbol
      const playerSymbol =
        updatedGame.player1Id === user.id
          ? updatedGame.player1Symbol
          : updatedGame.player2Symbol;

      // Won line for Frontend
      const gameOverResult = checkGameOver(
        updatedGame.boardState as Board,
        updatedGame.boardSize,
      );

      // Build game_update payload
      const gameUpdate: Record<string, unknown> = {
        gameId: updatedGame.id,
        board: updatedGame.boardState,
        currentTurn: updatedGame.currentTurn,
        status: updatedGame.status,
        winner: updatedGame.winner ?? null,
        winnerId: updatedGame.winnerId ?? null,
        player1: updatedGame.player1,
        player2: updatedGame.player2,
        player1Symbol: updatedGame.player1Symbol,
        player2Symbol: updatedGame.player2Symbol,
        lastMove: {
          player: playerSymbol,
          userId: user.id,
          cellIndex: rawCellIndex,
          timestamp: new Date().toISOString(),
        },
      };

      if (gameOverResult.line) {
        gameUpdate.winningLine = gameOverResult.line;
      }

      // Room Broadcast (2 players receives it)
      const roomName = getGameRoomName(gameId);
      io.to(roomName).emit("game_update", gameUpdate);

      console.log(
        `[Game ${gameId}] ${user.username} (${playerSymbol}) → cell ${rawCellIndex}`,
      );

      // If GameOver Send game_over
      if (updatedGame.status === "FINISHED" || updatedGame.status === "DRAW") {
        const gameOver: Record<string, unknown> = {
          gameId: updatedGame.id,
          status: updatedGame.status,
          winner: updatedGame.winner ?? null,
          winnerId: updatedGame.winnerId ?? null,
          board: updatedGame.boardState,
        };

        if (gameOverResult.line) {
          gameOver.winningLine = gameOverResult.line;
        }

        io.to(roomName).emit("game_over", gameOver);

        const outcome =
          updatedGame.status === "DRAW"
            ? "Draw"
            : `Winner: ${updatedGame.winner?.username ?? updatedGame.winnerId}`;

        console.log(`[Game ${gameId}] Game over — ${outcome}`);
      }
    } catch (error: unknown) {
      const rawMessage = error instanceof Error ? error.message : "Failed to make move";
      const errorMessage = rawMessage.replace(/^Invalid move:\s*/i, "");

      console.warn(`[Game ${gameId ?? "?"}] Move rejected: ${errorMessage}`);

      socket.emit("move_error", {
        error: errorMessage,
        cellIndex,
      });
    }
  });
}
