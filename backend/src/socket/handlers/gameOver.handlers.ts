import { Server, Socket } from "socket.io";
import prisma from "../../lib/prisma";
import { checkWinnerWithLine } from "../../services/games.service";
import { processGameOver } from "../../services/gameOver.service";

export const handleMakeMove = (io: Server, socket: Socket) => {
  socket.on("make_move", async (data: { gameId: number; cellIndex: number }) => {
    // 1. Récupération de l'état actuel et validation du coup (Logique existante #100)
    // ... (votre code Prisma pour updater le board) ...

    const game = await prisma.game.findUnique({
        where: { id: data.gameId },
        include: { playerX: true, playerO: true }
    });

    if (!game) return;

    const winInfo = checkWinnerWithLine(game.board); // Retourne { winner: 'X', line: [0,1,2] } ou null
    const moveCount = game.board.filter(cell => cell !== null).length;
    const isDraw = !winInfo && moveCount === 9;

    if (winInfo || isDraw) {
      const startTime = new Date(game.createdAt).getTime();
      const duration = Math.floor((Date.now() - startTime) / 1000);

      const payload = {
        gameId: game.id,
        result: winInfo ? ("win" as const) : ("draw" as const),
        winner: winInfo ? {
          id: winInfo.winner === "X" ? game.playerX.id : game.playerO.id,
          username: winInfo.winner === "X" ? game.playerX.username : game.playerO.username,
          symbol: winInfo.winner
        } : null,
        loser: winInfo ? {
          id: winInfo.winner === "X" ? game.playerO.id : game.playerX.id,
          username: winInfo.winner === "X" ? game.playerO.username : game.playerX.username,
          symbol: winInfo.winner === "X" ? "O" : ("X" as "X" | "O")
        } : null,
        finalBoard: game.board,
        totalMoves: moveCount,
        duration: duration,
        winningLine: winInfo ? winInfo.line : null,
        timestamp: new Date().toISOString(),
      };

      // Déclenchement de l'événement de fin de match
      await processGameOver(io, payload);

      // Mettre à jour le statut dans la DB si pas déjà fait par l'Issue #100
      await prisma.game.update({
        where: { id: game.id },
        data: { status: "COMPLETED", winnerId: payload.winner?.id }
      });

    } else {
      // Le jeu continue : simple broadcast de l'update
      io.to(`game-${game.id}`).emit("game_update", game);
    }
  });
};
