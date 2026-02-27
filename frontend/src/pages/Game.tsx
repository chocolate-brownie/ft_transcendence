import { useState } from "react";
import type { Board } from "../types/game";
import GameBoard from "../components/GameBoard";

//TEMP FOR DEV (maybe make it a backend issue to send winning line info? or just calculate it on the frontend?)
// TODO: when backend game API is wired to this page,
// use the server-provided winningLine instead of calculating it here.
// Every possible winning outcome
const WIN_LINES: number[][] = [
  [0, 1, 2], // horizontal
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6], // vertical
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8], // diagonal
  [2, 4, 6],
];

// Function to check a line
function findWinningLine(board: Board) {
  for (let i = 0; i < WIN_LINES.length; i++) {
    const line = WIN_LINES[i];
    const a = line[0];
    const b = line[1];
    const c = line[2];

    const value = board[a];

    if (value && value === board[b] && value === board[c]) {
      return line;
    }
  }

  return null;
}
//TEMP FOR DEV

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

  const winningLine = findWinningLine(board);

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold text-pong-text">Game</h1>
      <GameBoard board={board} onCellClick={handleCellClick} winningLine={winningLine} />
    </div>
  );
}
