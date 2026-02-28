import { useState } from "react";
import type { Board } from "../types/game";
import GameBoard from "../components/Game/GameBoard";
import TurnIndicator from "../components/Game/TurnIndicator";
import Button from "../components/Button";

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

// Game page container (mock local state for now)
export default function Game() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X");
  const [showChat, setShowChat] = useState(false); // Later

  function handleCellClick(index: number) {
    if (board[index] !== null) return;

    const nextBoard = [...board];
    nextBoard[index] = currentPlayer;
    setBoard(nextBoard);

    const nextPlayer: "X" | "O" = currentPlayer === "X" ? "O" : "X";
    setCurrentPlayer(nextPlayer);

    console.log(
      `[Game] Cell clicked at index ${index}, placed ${currentPlayer}, next player: ${nextPlayer}`,
    );
}

  const winningLine = findWinningLine(board);
  const playerSymbol: "X" | "O" = "X";
  const isYourTurn = currentPlayer === playerSymbol;

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-2xl font-bold text-pong-text -mb-4">Game</h1>
      {/* Turn indicator */}
      <TurnIndicator
        currentPlayer={currentPlayer}
        playerSymbol={playerSymbol}
        isYourTurn={isYourTurn}
        className="-mb-6"
      />
      {/* Board */}
      <GameBoard
      board={board}
      onCellClick={handleCellClick}
      winningLine={winningLine}
      />
      {/* New / Quit button (placeholders Phase 4) */}
      <div className="mt-7 flex gap-5">
        <Button variant="primary">
          New Game
        </Button>
        <Button variant="danger">
          Quit Game
        </Button>
      </div>
      {/* Scoreboard / Player vs Player */}
      <div className="rounded-lg bg-pong-surface px-12 py-2 shadow-sm">
        <div className="flex items-center gap-8 text-pong-text/80">
          {/* Player 1 */}
          <div className="flex flex-col items-center px-3">
            <span className="font-semibold uppercase tracking-wide text-pong-text/50">
              Player 1
            </span>
            <span className="text-sm">
              You <span className="text-pong-accent">(X)</span>
            </span>
            <span className="text-3xl font-sans font-bold text-pong-accent">0</span>
          </div>

          {/* Ties (optionnel, comme sur ton screenshot) */}
          <div className="flex flex-col items-center px-7">
            <span className="text-xl font-semibold uppercase tracking-wide text-pong-text/50">
              VS
            </span>
          </div>

          {/* Player 2 */}
          <div className="flex flex-col items-center">
            <span className="font-semibold uppercase tracking-wide text-pong-text/50">
              Player 2
            </span>
            <span className="text-sm">
              Opponent <span className="text-pong-secondary">(O)</span>
            </span>
            <span className="text-3xl font-sans font-bold text-pong-secondary">0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
