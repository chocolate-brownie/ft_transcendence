import { useState } from "react";
import type { Board } from "../types/game";
import GameBoard from "../components/GameBoard";

export default function Game() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState<boolean>(true);

  function handleCellClick(index: number) {
    if (board[index] !== null) return;

    const nextBoard = [...board];
    nextBoard[index] = isXTurn ? "X" : "O";

    setBoard(nextBoard);
    setIsXTurn(!isXTurn);
}

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold text-pong-text">Game</h1>
      <GameBoard board={board} onCellClick={handleCellClick} />
    </div>
  );
}
