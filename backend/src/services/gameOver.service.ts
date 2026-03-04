import { Server } from "socket.io";
import { getGameRoomName } from "../socket/helpers";

interface PlayerInfo {
  id: number;
  username: string;
  symbol: string;
}

export async function processGameOver(io: Server, updatedGame: any, gameOverResult: any) {
  const { id, player1, player2, player1Symbol, player2Symbol, boardState, createdAt } =
    updatedGame;

  const isDraw = updatedGame.status === "DRAW";
  const winnerId = updatedGame.winnerId;

  // Déterminer qui est le gagnant et le perdant
  let winner: PlayerInfo | null = null;
  let loser: PlayerInfo | null = null;

  if (!isDraw && winnerId) {
    const isP1Winner = winnerId === player1.id;
    winner = {
      id: isP1Winner ? player1.id : player2.id,
      username: isP1Winner ? player1.username : player2.username,
      symbol: isP1Winner ? player1Symbol : player2Symbol,
    };
    loser = {
      id: isP1Winner ? player2.id : player1.id,
      username: isP1Winner ? player2.username : player1.username,
      symbol: isP1Winner ? player2Symbol : player1Symbol,
    };
  }

  const payload = {
    gameId: id,
    result: isDraw ? "draw" : "win",
    winner,
    loser,
    finalBoard: boardState,
    totalMoves: boardState.filter((cell: string | null) => cell !== null).length,
    duration: Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000),
    winningLine: gameOverResult.line || null,
    timestamp: new Date().toISOString(),
  };

  // Broadcast de l'événement dédié
  const roomName = getGameRoomName(id);
  io.to(roomName).emit("game_over", payload);

  // Log pour analytics
  console.log(`[Game Over] ID: ${id} | Result: ${payload.result}`);

  // Post-Game Cleanup : Garder la room 5 minutes pour le chat
  const cleanupTimer = setTimeout(
    () => {
      console.log(`[Room Cleanup] Closing post-game window for ${roomName}`);
      // Ici, on pourrait forcer le départ des sockets si nécessaire
    },
    5 * 60 * 1000,
  );
  cleanupTimer.unref?.();

  return payload;
}
