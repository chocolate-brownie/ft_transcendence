import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Board } from "../types/game";
import GameBoard from "../components/Game/GameBoard";
import TurnIndicator from "../components/Game/TurnIndicator";
import Button from "../components/Button";
import { findWinningLine } from "../utils/gameUtils";

export default function LocalGame() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X");
  const [result, setResult] = useState<"X" | "O" | "DRAW" | null>(null);

  const [scoreX, setScoreX] = useState(0);
  const [scoreO, setScoreO] = useState(0);
  const [scoreDraw, setScoreDraw] = useState(0);

  const navigate = useNavigate();

  const backButtonClass =
    "relative flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md " +
    "transition-colors bg-pong-surface text-pong-text/70 " +
    "hover:bg-pong-accent/10 hover:text-pong-accent focus:outline-none";

  const boardClass =
    "transition-opacity duration-200 " +
    (result !== null ? "opacity-40 pointer-events-none" : "opacity-100");

  const turnTextOverride =
    result !== null
      ? ""
      : currentPlayer === "X"
        ? "Player 1’s turn (X)"
        : "Player 2’s turn (O)";

  let gameOverText = "";
  if (result === "DRAW") gameOverText = "It's a draw!";
  else if (result === "X") gameOverText = "Player 1 wins! (X)";
  else if (result === "O") gameOverText = "Player 2 wins! (O)";

  function handleBackToLobby() {
    navigate("/game");
  }

  function handleCellClick(index: number) {
    if (result !== null) return;
    if (board[index] !== null) return;

    const nextBoard = [...board];
    nextBoard[index] = currentPlayer;

    const nextWinningLine = findWinningLine(nextBoard);
    const isBoardFull = nextBoard.every((c) => c !== null);
    const isDraw = nextWinningLine === null && isBoardFull;

    setBoard(nextBoard);

    if (nextWinningLine !== null) {
      setResult(currentPlayer);

      if (currentPlayer === "X") setScoreX(scoreX + 1);
      else setScoreO(scoreO + 1);

      return;
    }

    if (isDraw) {
      setResult("DRAW");
      setScoreDraw(scoreDraw + 1);
      return;
    }

    setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
  }

  function handlePlayAgain() {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setResult(null);
  }

  const winningLine = findWinningLine(board);
  const playerSymbol: "X" | "O" = "X";
  const isYourTurn = result === null && currentPlayer === playerSymbol;

  return (
    <div className="min-h-screen w-full px-4 pt-4">
      {/* Back to lobby */}
      <div className="flex w-full justify-start">
        <button type="button" onClick={handleBackToLobby} className={backButtonClass}>
          <span className="text-base leading-none">←</span>
          <span>Back to Lobby</span>
        </button>
      </div>

      {/* Game content */}
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold text-pong-text -mb-4">Local Game Mode</h1>

        <TurnIndicator
          currentPlayer={currentPlayer}
          playerSymbol={playerSymbol}
          isYourTurn={isYourTurn}
          className={"-mb-6" + (result !== null ? " invisible" : "")}
          textOverride={turnTextOverride}
        />

        <div className="relative">
          <GameBoard
            board={board}
            onCellClick={handleCellClick}
            winningLine={winningLine}
            className={boardClass}
          />

          {result !== null && (
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
              <span
                className={
                  "text-xl font-semibold " +
                  (result === "X"
                    ? "text-pong-accent"
                    : result === "O"
                      ? "text-pong-secondary"
                      : "text-pong-text")
                }
              >
                {gameOverText}
              </span>

              <Button variant="primary" onClick={handlePlayAgain}>
                Play Again
              </Button>
            </div>
          )}
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
              <span className="text-3xl font-sans font-bold text-pong-accent">
                {scoreX}
              </span>
            </div>

            {/* VS + Draws */}
            <div className="flex flex-col items-center px-7">
              <span className="text-xl font-semibold uppercase tracking-wide text-pong-text/50">
                VS
              </span>
              <span className="mt-1 text-xs text-pong-text/50">Draws: {scoreDraw}</span>
            </div>

            {/* Player 2 */}
            <div className="flex flex-col items-center">
              <span className="font-semibold uppercase tracking-wide text-pong-text/50">
                Player 2
              </span>
              <span className="text-sm">
                Opponent <span className="text-pong-secondary">(O)</span>
              </span>
              <span className="text-3xl font-sans font-bold text-pong-secondary">
                {scoreO}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}