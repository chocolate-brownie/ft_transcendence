import { Server, Socket } from "socket.io";
import prisma from "../../lib/prisma";
import { disconnectionService } from "../../services/disconnection.service";

export async function handleGameDisconnection(io: Server, socket: Socket) {
  const user = socket.data.user;
  if (!user) return;

  try {
    // Trouver les parties en cours du joueur
    const activeGames = await prisma.game.findMany({
      where: {
        status: "IN_PROGRESS",
        OR: [{ player1Id: user.id }, { player2Id: user.id }],
      },
      include: {
        player1: { select: { id: true, username: true } },
        player2: { select: { id: true, username: true } },
      },
    });

    if (activeGames.length === 0) return;

    for (const game of activeGames) {
      const roomName = `game-${game.id}`;
      const isPlayer1 = game.player1Id === user.id;
      const opponent = isPlayer1 ? game.player2 : game.player1;
      const opponentSymbol = isPlayer1 ? game.player2Symbol : game.player1Symbol;
      const disconnectedSymbol = isPlayer1 ? game.player1Symbol : game.player2Symbol;

      if (!opponent) continue;

      // Alerte l'adversaire
      socket.to(roomName).emit("opponent_disconnected", {
        userId: user.id,
        username: user.username,
        waitTime: 30,
        message: "Opponent disconnected, waiting for reconnection...",
      });

      // Démarre le chrono de 30s
      await disconnectionService.startForfeitTimer(
        io,
        game.id,
        { id: user.id, username: user.username, symbol: disconnectedSymbol },
        { id: opponent.id, username: opponent.username, symbol: opponentSymbol },
        roomName,
      );
    }
  } catch (error) {
    console.error("[Disconnect Handler] Error:", error);
  }
}
