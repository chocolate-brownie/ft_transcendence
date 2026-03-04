import { useState } from "react";
import type { Board } from "../types/game";
import GameBoard from "../components/Game/GameBoard";
import TurnIndicator from "../components/Game/TurnIndicator";
import Button from "../components/Button";
import { findWinningLine } from "../utils/gameUtils";
import { Scoreboard } from "../components/Scoreboard";

//TEMP FOR DEV (maybe make it a backend issue to send winning line info? or just calculate it on the frontend?)
// TODO: when backend game API is wired to this page,
// use the server-provided winningLine instead of calculating it here.

// Game page container (mock local state for now)
export default function Game() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X");

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
        <Scoreboard isMyTurn={isYourTurn}></Scoreboard>
      </div>
    </div>
  );
}
