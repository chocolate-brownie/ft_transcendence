/**
 * LocalGame — Issue #209
 *
 * Local (pass-and-play) Tic-Tac-Toe page with two phases:
 *   1. Setup — pick board size, theme, and symbols before the game starts
 *   2. Play  — the actual game board wrapped in a theme container
 *
 * Issue #209 — uses useGameCustomization hook so theme/symbol preferences
 * persist across all game modes (local, AI, online, tournament) via localStorage.
 */

import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import type { Board, BoardSize } from "../types/game";

import GameBoard from "../components/Game/GameBoard";
import TurnIndicator from "../components/Game/TurnIndicator";
import Button from "../components/Button";
import ThemeSelector from "../components/Customization/ThemeSelector";
import SymbolSelector from "../components/Customization/SymbolSelector";
import BoardSizeSelector from "../components/Customization/BoardSizeSelector";
import { findWinningLine } from "../utils/gameUtils";
import { useGameCustomization } from "../hooks/useGameCustomization";

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

  /* ------------------------------------------------------------------ */
  /* Issue #209 — shared customization hook (persisted to localStorage)  */
  /* ------------------------------------------------------------------ */
  const { customization, setTheme, setSymbols, isThemed, renderSymbol } =
    useGameCustomization();

  /* ------------------------------------------------------------------ */
  /* Setup phase state                                                   */
  /* ------------------------------------------------------------------ */
  const [phase, setPhase] = useState<"setup" | "play">("setup");
  const [boardSize, setBoardSize] = useState<BoardSize>(() =>
    parseBoardSize(searchParams.get("boardSize")),
  );

  /* ------------------------------------------------------------------ */
  /* Game state                                                         */
  /* ------------------------------------------------------------------ */
  const [board, setBoard] = useState<Board>(() => createEmptyBoard(boardSize));
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X");
  const [result, setResult] = useState<"X" | "O" | "DRAW" | null>(null);
  const [scoreX, setScoreX] = useState(0);
  const [scoreO, setScoreO] = useState(0);
  const [scoreDraw, setScoreDraw] = useState(0);

  const winningLine = useMemo(
    () => findWinningLine(board, boardSize),
    [board, boardSize],
  );
  const playerSymbol: "X" | "O" = "X";
  const isYourTurn = result === null && currentPlayer === playerSymbol;

  /* Helpers for display names / symbols in the scoreboard */
  const p1Display = customization.symbols.player1Symbol || "X";
  const p2Display = customization.symbols.player2Symbol || "O";

  /* ------------------------------------------------------------------ */
  /* Handlers                                                           */
  /* ------------------------------------------------------------------ */

  function handleBackToLobby() {
    void navigate("/lobby");
  }

  function handleStartGame() {
    setBoard(createEmptyBoard(boardSize));
    setCurrentPlayer("X");
    setResult(null);
    setPhase("play");
  }

  function handleBackToSetup() {
    setPhase("setup");
    setBoard(createEmptyBoard(boardSize));
    setCurrentPlayer("X");
    setResult(null);
  }

  function handleBoardSizeChange(size: BoardSize) {
    setBoardSize(size);
    setBoard(createEmptyBoard(size));
    setCurrentPlayer("X");
    setResult(null);
  }

  function handleCellClick(index: number) {
    if (result !== null || board[index] !== null) return;

    const nextBoard = [...board];
    nextBoard[index] = currentPlayer;

    const nextWinningLine = findWinningLine(nextBoard, boardSize);
    const isBoardFull = nextBoard.every((c) => c !== null);

    setBoard(nextBoard);

    if (nextWinningLine !== null) {
      setResult(currentPlayer);
      if (currentPlayer === "X") setScoreX((n) => n + 1);
      else setScoreO((n) => n + 1);
      return;
    }

    if (isBoardFull) {
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

  /* ------------------------------------------------------------------ */
  /* Turn / game-over text                                              */
  /* ------------------------------------------------------------------ */
  const turnTextOverride =
    result !== null
      ? ""
      : currentPlayer === "X"
        ? `Player 1's turn (${p1Display})`
        : `Player 2's turn (${p2Display})`;

  let gameOverText = "";
  if (result === "DRAW") gameOverText = "It's a draw!";
  else if (result === "X") gameOverText = `Player 1 wins! (${p1Display})`;
  else if (result === "O") gameOverText = `Player 2 wins! (${p2Display})`;

  /* ------------------------------------------------------------------ */
  /* Shared back button                                                 */
  /* ------------------------------------------------------------------ */
  const backButtonClass =
    "relative flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md " +
    "transition-colors bg-pong-surface text-pong-text/70 " +
    "hover:bg-pong-accent/10 hover:text-pong-accent focus:outline-none";

  /* ------------------------------------------------------------------ */
  /* Setup phase — Issue #209                                           */
  /* ------------------------------------------------------------------ */
  if (phase === "setup") {
    return (
      <div className="min-h-screen w-full px-4 pt-4">
        <div className="flex w-full justify-start">
          <button type="button" onClick={handleBackToLobby} className={backButtonClass}>
            <span className="text-base leading-none">←</span>
            <span>Back to Lobby</span>
          </button>
        </div>

        <div className="mx-auto flex max-w-lg flex-col items-center gap-6 pt-4">
          <h1 className="text-2xl font-bold text-pong-text">Local Game Setup</h1>

          {/* Board size picker */}
          <section className="w-full">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-pong-text/50">
              Board Size
            </h2>
            <div className="flex justify-center">
              <BoardSizeSelector selected={boardSize} onSelect={handleBoardSizeChange} />
            </div>
          </section>

          {/* Theme picker — Issue #209 */}
          <section className="w-full">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-pong-text/50">
              Theme
            </h2>
            <ThemeSelector selected={customization.theme} onSelect={setTheme} />
          </section>

          {/* Symbol picker — Issue #209 */}
          <section className="w-full">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-pong-text/50">
              Symbols
            </h2>
            <SymbolSelector symbols={customization.symbols} onSelect={setSymbols} />
          </section>

          <Button
            variant="primary"
            onClick={handleStartGame}
            className="mt-2 px-8 py-3 text-lg"
          >
            Start Game
          </Button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Play phase                                                         */
  /* ------------------------------------------------------------------ */
  const boardClass =
    "transition-opacity duration-200 " +
    (result !== null ? "opacity-40 pointer-events-none" : "opacity-100");

  return (
    <div className="min-h-screen w-full px-4 pt-4">
      <div className="flex w-full items-center justify-between">
        <button type="button" onClick={handleBackToSetup} className={backButtonClass}>
          <span className="text-base leading-none">←</span>
          <span>Back to Setup</span>
        </button>
      </div>

      {/* Issue #209 — theme wrapper applies CSS variables when non-classic */}
      <div
        className={isThemed ? "game-theme-wrapper mx-auto mt-4 max-w-lg" : ""}
        data-theme={isThemed ? customization.theme : undefined}
      >
        <div className="flex flex-col items-center gap-6">
          <h1 className={`text-2xl font-bold ${isThemed ? "" : "text-pong-text"} -mb-4`}>
            Local Game
          </h1>

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
              boardSize={boardSize}
              currentTurnSymbol={currentPlayer}
              winnerSymbol={result === "X" || result === "O" ? result : null}
              playerSymbol={playerSymbol}
              gameOver={result !== null}
              disabled={result !== null}
              themed={isThemed}
              renderSymbol={renderSymbol}
            />

            {result !== null && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <span
                  className={
                    "text-xl font-semibold " +
                    (result === "X"
                      ? isThemed
                        ? "themed-p1"
                        : "text-pong-accent"
                      : result === "O"
                        ? isThemed
                          ? "themed-p2"
                          : "text-pong-secondary"
                        : isThemed
                          ? ""
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

          {/* Scoreboard */}
          <div
            className={`rounded-lg px-12 py-2 shadow-sm ${isThemed ? "themed-board" : "bg-pong-surface"}`}
          >
            <div
              className={`flex items-center gap-8 ${isThemed ? "" : "text-pong-text/80"}`}
            >
              <div className="flex flex-col items-center px-3">
                <span
                  className={`font-semibold uppercase tracking-wide ${isThemed ? "opacity-50" : "text-pong-text/50"}`}
                >
                  Player 1
                </span>
                <span className="text-sm">
                  You{" "}
                  <span className={isThemed ? "themed-p1" : "text-pong-accent"}>
                    ({p1Display})
                  </span>
                </span>
                <span
                  className={`text-3xl font-sans font-bold ${isThemed ? "themed-p1" : "text-pong-accent"}`}
                >
                  {scoreX}
                </span>
              </div>

              <div className="flex flex-col items-center px-7">
                <span
                  className={`text-xl font-semibold uppercase tracking-wide ${isThemed ? "opacity-50" : "text-pong-text/50"}`}
                >
                  VS
                </span>
                <span
                  className={`mt-1 text-xs ${isThemed ? "opacity-50" : "text-pong-text/50"}`}
                >
                  Draws: {scoreDraw}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <span
                  className={`font-semibold uppercase tracking-wide ${isThemed ? "opacity-50" : "text-pong-text/50"}`}
                >
                  Player 2
                </span>
                <span className="text-sm">
                  Opponent{" "}
                  <span className={isThemed ? "themed-p2" : "text-pong-secondary"}>
                    ({p2Display})
                  </span>
                </span>
                <span
                  className={`text-3xl font-sans font-bold ${isThemed ? "themed-p2" : "text-pong-secondary"}`}
                >
                  {scoreO}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
