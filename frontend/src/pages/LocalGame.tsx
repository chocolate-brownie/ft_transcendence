import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import type { Board, BoardSize } from "../types/game";
import GameBoard from "../components/Game/GameBoard";
import TurnIndicator from "../components/Game/TurnIndicator";
import Button from "../components/Button";
import { findWinningLine } from "../utils/gameUtils";

function parseBoardSize(value: string | null): BoardSize {
  if (value === "4") return 4;
  if (value === "5") return 5;
  return 3;
}

function createEmptyBoard(boardSize: BoardSize): Board {
  return Array(boardSize * boardSize).fill(null);
}

export default function LocalGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const boardSize = useMemo(
    () => parseBoardSize(searchParams.get("boardSize")),
    [searchParams],
  );

  const [board, setBoard] = useState<Board>(() => createEmptyBoard(boardSize));
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X");
  const [result, setResult] = useState<"X" | "O" | "DRAW" | null>(null);
  const [scoreX, setScoreX] = useState(0);
  const [scoreO, setScoreO] = useState(0);
  const [scoreDraw, setScoreDraw] = useState(0);

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
    void navigate("/lobby");
  }

  function handleCellClick(index: number) {
    if (result !== null) return;
    if (board[index] !== null) return;

    const nextBoard = [...board];
    nextBoard[index] = currentPlayer;

    const nextWinningLine = findWinningLine(nextBoard, boardSize);
    const isBoardFull = nextBoard.every((c) => c !== null);
    const isDraw = nextWinningLine === null && isBoardFull;

    setBoard(nextBoard);

    if (nextWinningLine !== null) {
      setResult(currentPlayer);
      if (currentPlayer === "X") setScoreX((n) => n + 1);
      else setScoreO((n) => n + 1);
      return;
    }

    if (isDraw) {
      setResult("DRAW");
      setScoreDraw((n) => n + 1);
      return;
    }

    setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
  }

  function handlePlayAgain() {
    setBoard(createEmptyBoard(boardSize));
    setCurrentPlayer("X");
    setResult(null);
  }

  const winningLine = findWinningLine(board, boardSize);
  const playerSymbol: "X" | "O" = "X";
  const isYourTurn = result === null && currentPlayer === playerSymbol;
  const moveCount = board.filter((cell) => cell !== null).length;
  const totalCells = boardSize * boardSize;

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={handleBackToLobby} className={backButtonClass}>
          ← Back
        </button>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-pong-text/40">Local Game</p>
          <p className="text-sm font-semibold text-pong-text">{boardSize}x{boardSize}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-center gap-3 text-sm text-pong-text/70">
        <span className="rounded-full bg-pong-surface px-3 py-1">X: {scoreX}</span>
        <span className="rounded-full bg-pong-surface px-3 py-1">O: {scoreO}</span>
        <span className="rounded-full bg-pong-surface px-3 py-1">Draws: {scoreDraw}</span>
        <span className="rounded-full bg-pong-surface px-3 py-1">
          Move {moveCount} / {totalCells}
        </span>
      </div>

      <div className="flex flex-col items-center gap-5">
        <TurnIndicator
          currentPlayer={currentPlayer}
          playerSymbol={playerSymbol}
          isYourTurn={isYourTurn}
          textOverride={result !== null ? gameOverText : turnTextOverride}
        />

        <div className={boardClass}>
          <GameBoard
            board={board}
            onCellClick={handleCellClick}
            disabled={result !== null}
            winningLine={winningLine}
            winnerSymbol={result === "X" || result === "O" ? result : null}
            playerSymbol={playerSymbol}
            gameOver={result !== null}
            currentTurnSymbol={currentPlayer}
            boardSize={boardSize}
          />
        </div>

        {result !== null ? (
          <div className="flex gap-3">
            <Button variant="primary" onClick={handlePlayAgain}>
              Play Again
            </Button>
            <Button variant="secondary" onClick={handleBackToLobby}>
              Back to Lobby
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}