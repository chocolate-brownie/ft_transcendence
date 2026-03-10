/**
 * AIGame Page — Issue #183, Issue #209
 *
 * Full "Play vs AI" flow with three phases:
 * - Setup: pick difficulty, symbol, theme, and custom symbols, then start.
 * - Playing: renders GameBoard + TurnIndicator, sends moves via aiService,
 *   shows a 350ms "AI is thinking..." delay after each player move.
 * - Finished: shows the final board + GameOverModal with "Play Again" (resets
 *   to setup) or "New Game (Lobby)" (navigates to /lobby).
 *
 * Issue #209 — theme and symbol customization reuse the same components
 * as LocalGame (ThemeSelector, SymbolSelector from Customization/).
 * The board is always 3x3 (backend AI only supports 3x3).
 */
import { useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import type { PlayerSymbol, CellValue, GameOverPlayerSummary } from "../types/game";
import { findWinningLine } from "../utils/gameUtils";
import { aiService } from "../services/ai.service";
import type { AiDifficulty } from "../services/ai.service";
import GameBoard from "../components/Game/GameBoard";
import GameOverModal from "../components/Game/GameOverModal";
import TurnIndicator from "../components/Game/TurnIndicator";
import DifficultySelector from "../components/AI/DifficultySelector";
import SymbolSelector from "../components/AI/SymbolSelector";
import Button from "../components/Button";
import Card from "../components/Card";
import { useGameCustomization } from "../hooks/useGameCustomization";

/* Issue #209 — customization components shared with LocalGame */
import ThemeSelector from "../components/Customization/ThemeSelector";
import CustomSymbolSelector from "../components/Customization/SymbolSelector";

type GamePhase = "setup" | "playing" | "finished";

interface GameState {
  gameId: number;
  board: CellValue[];
  playerSymbol: PlayerSymbol;
  aiSymbol: PlayerSymbol;
  difficulty: AiDifficulty;
  isPlayerTurn: boolean;
  winner: string | null;
  status: string;
}

/** Back-to-lobby arrow button — matches LocalGame pattern. */
const backButtonClass =
  "relative flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md " +
  "transition-colors bg-pong-surface text-pong-text/70 " +
  "hover:bg-pong-accent/10 hover:text-pong-accent focus:outline-none";

export default function AIGame() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<GamePhase>("setup");
  const [difficulty, setDifficulty] = useState<AiDifficulty>("medium");
  const [symbol, setSymbol] = useState<PlayerSymbol>("X");
  const [game, setGame] = useState<GameState | null>(null);
  const [processing, setProcessing] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalDuration, setFinalDuration] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const startTimeRef = useRef<number>(0);

  /* Issue #209 — shared customization hook (persisted to localStorage) */
  const { customization, setTheme, setSymbols, isThemed, renderSymbol } =
    useGameCustomization();

  /* Issue #209 — display symbol for the "You are ..." label (respects chosen side) */
  const p1Display =
    symbol === "X"
      ? customization.symbols.player1Symbol || "X"
      : customization.symbols.player2Symbol || "O";

  const handleStartGame = useCallback(async () => {
    setError(null);
    setProcessing(true);
    try {
      const res = await aiService.createGame(difficulty, symbol);
      const board = JSON.parse(res.game.boardState) as CellValue[];
      const aiSym: PlayerSymbol = symbol === "X" ? "O" : "X";
      setGame({
        gameId: res.game.id,
        board,
        playerSymbol: symbol,
        aiSymbol: aiSym,
        difficulty,
        isPlayerTurn: res.game.currentTurn === symbol,
        winner: null,
        status: "IN_PROGRESS",
      });
      startTimeRef.current = Date.now();
      setPhase("playing");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create game");
    } finally {
      setProcessing(false);
    }
  }, [difficulty, symbol]);

  const handleCellClick = useCallback(
    async (index: number) => {
      if (!game || processing || aiThinking || !game.isPlayerTurn) return;

      setProcessing(true);
      setError(null);
      try {
        const res = await aiService.makeMove(game.gameId, index);
        const newBoard = res.game.boardState;
        const isGameOver = res.game.status === "FINISHED" || res.game.status === "DRAW";

        // Show player's move immediately, then simulate AI thinking delay
        const boardAfterPlayer = [...newBoard];
        if (res.aiMove) {
          boardAfterPlayer[res.aiMove.moveIndex] = null;
        }
        setGame((prev) =>
          prev ? { ...prev, board: boardAfterPlayer, isPlayerTurn: false } : prev,
        );
        setProcessing(false);

        // Play AI thinking animation before revealing AI's move
        if (res.aiMove) {
          setAiThinking(true);
          await new Promise((r) => setTimeout(r, 350));
          setAiThinking(false);
        }

        // Reveal final board state (with AI move)
        setGame((prev) =>
          prev
            ? {
                ...prev,
                board: newBoard,
                isPlayerTurn: true,
                winner: res.game.winner,
                status: res.game.status,
              }
            : prev,
        );

        if (isGameOver) {
          setFinalDuration(Math.round((Date.now() - startTimeRef.current) / 1000));
          setPhase("finished");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to make move");
        setProcessing(false);
      }
    },
    [game, processing, aiThinking],
  );

  const handlePlayAgain = useCallback(() => {
    setShowModal(false);
    setGame(null);
    setError(null);
    setPhase("setup");
  }, []);

  const totalMoves = game ? game.board.filter((c) => c !== null).length : 0;
  /* Memoize to avoid recomputing on every render (e.g. showModal toggle).
   * Mirrors the pattern in LocalGame.tsx:64. PR #306 follow-up fix. */
  const winningLine = useMemo(
    () =>
      game && game.status !== "DRAW"
        ? (findWinningLine(game.board, 3) ?? undefined)
        : undefined,
    [game?.board, game?.status],
  );

  /* ── GameOverModal prop builders ──────────────────────────────────────────── */

  const buildWinner = (): GameOverPlayerSummary | null => {
    if (!game || !game.winner) return null;
    const isPlayerWin = game.winner === game.playerSymbol;
    return {
      id: isPlayerWin ? 0 : -1,
      username: isPlayerWin ? "You" : `AI (${game.difficulty})`,
      symbol: game.winner as PlayerSymbol,
    };
  };

  const buildLoser = (): GameOverPlayerSummary | null => {
    if (!game || !game.winner) return null;
    const isPlayerWin = game.winner === game.playerSymbol;
    return {
      id: isPlayerWin ? -1 : 0,
      username: isPlayerWin ? `AI (${game.difficulty})` : "You",
      symbol: (game.winner === "X" ? "O" : "X") as PlayerSymbol,
    };
  };

  const buildOpponent = (): GameOverPlayerSummary | null => {
    if (!game) return null;
    return {
      id: -1,
      username: `AI (${game.difficulty})`,
      symbol: game.aiSymbol,
    };
  };

  /* ── Difficulty label for the in-game info bar ────────────────────────────── */
  const difficultyColor =
    game?.difficulty === "easy"
      ? "text-emerald-400"
      : game?.difficulty === "hard"
        ? "text-red-400"
        : "text-amber-400";

  return (
    <div className="min-h-screen w-full px-4 pt-4">
      {/* Back button — always visible, matches LocalGame */}
      <div className="flex w-full justify-start">
        <button
          type="button"
          onClick={() => void navigate("/lobby")}
          className={backButtonClass}
        >
          <span className="text-base leading-none">&larr;</span>
          <span>Back to Lobby</span>
        </button>
      </div>

      {/* ── Setup phase ───────────────────────────────────────────────────── */}
      {phase === "setup" && (
        <div className="mx-auto flex max-w-xl flex-col items-center gap-8 py-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-pong-accent">Play vs AI</h1>
            <p className="mt-2 text-sm text-pong-text/60">
              Choose your difficulty and symbol to begin.
            </p>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-pong-accent" />
              <span className="h-1.5 w-1.5 rounded-full bg-pong-secondary" />
              <span className="h-1.5 w-1.5 rounded-full bg-shadow-grey-300" />
            </div>
          </div>

          {/* Difficulty */}
          <Card
            variant="elevated"
            className="relative w-full overflow-hidden border border-pong-accent/30"
          >
            <div className="absolute left-0 top-0 h-1 w-full bg-pong-accent" />
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-pong-text/50">
              Difficulty
            </h2>
            <DifficultySelector selected={difficulty} onSelect={setDifficulty} />
          </Card>

          {/* Symbol (X or O for the backend) */}
          <Card
            variant="elevated"
            className="relative w-full overflow-hidden border border-pong-secondary/35"
          >
            <div className="absolute left-0 top-0 h-1 w-full bg-pong-secondary" />
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-pong-text/50">
              Your Symbol
            </h2>
            <SymbolSelector selected={symbol} onSelect={setSymbol} />
          </Card>

          {/* Issue #209 — Theme picker */}
          <Card
            variant="elevated"
            className="relative w-full overflow-hidden border border-pong-accent/30"
          >
            <div className="absolute left-0 top-0 h-1 w-full bg-pong-accent" />
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-pong-text/50">
              Theme
            </h2>
            <ThemeSelector selected={customization.theme} onSelect={setTheme} />
          </Card>

          {/* Issue #209 — Custom symbol picker (emojis / initials) */}
          <Card
            variant="elevated"
            className="relative w-full overflow-hidden border border-pong-secondary/35"
          >
            <div className="absolute left-0 top-0 h-1 w-full bg-pong-secondary" />
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-pong-text/50">
              Custom Symbols
            </h2>
            <CustomSymbolSelector
              symbols={customization.symbols}
              onSelect={setSymbols}
            />
          </Card>

          {error && <p className="text-center text-sm text-red-400">{error}</p>}

          {/* Actions */}
          <div className="flex w-full max-w-xs flex-col gap-3">
            <Button
              variant="primary"
              className="w-full py-3 text-base"
              onClick={() => void handleStartGame()}
              disabled={processing}
            >
              {processing ? "Creating game..." : "Start Game"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Playing phase ─────────────────────────────────────────────────── */}
      {phase === "playing" && game && (
        /* Issue #209 — theme wrapper applies CSS variables when non-classic */
        <div
          className={isThemed ? "game-theme-wrapper mx-auto mt-4 max-w-lg" : ""}
          data-theme={isThemed ? customization.theme : undefined}
        >
          <div className="flex flex-col items-center gap-6 py-4">
            {/* Title + info bar */}
            <div className="text-center">
              <h1 className={`text-2xl font-bold ${isThemed ? "" : "text-pong-text"}`}>
                vs AI{" "}
                <span className={`text-sm font-semibold ${difficultyColor}`}>
                  ({game.difficulty})
                </span>
              </h1>
              <p
                className={`mt-1 text-xs ${isThemed ? "opacity-40" : "text-pong-text/40"}`}
              >
                You are{" "}
                <span
                  className={
                    game.playerSymbol === "X"
                      ? isThemed
                        ? "font-bold themed-p1"
                        : "font-bold text-pong-accent"
                      : isThemed
                        ? "font-bold themed-p2"
                        : "font-bold text-pong-secondary"
                  }
                >
                  {p1Display}
                </span>
              </p>
            </div>

            <TurnIndicator
              currentPlayer={game.isPlayerTurn ? game.playerSymbol : game.aiSymbol}
              isYourTurn={game.isPlayerTurn && !aiThinking}
              playerSymbol={game.playerSymbol}
              textOverride={aiThinking ? "AI is thinking..." : ""}
            />

            <GameBoard
              board={game.board}
              onCellClick={(i) => void handleCellClick(i)}
              disabled={processing || aiThinking || !game.isPlayerTurn}
              currentTurnSymbol={game.isPlayerTurn ? game.playerSymbol : game.aiSymbol}
              boardSize={3}
              playerSymbol={game.playerSymbol}
              themed={isThemed}
              renderSymbol={renderSymbol} /* hook returns undefined when default — PR #306 fix */
            />

            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
        </div>
      )}

      {/* ── Finished phase ────────────────────────────────────────────────── */}
      {phase === "finished" && game && (
        /* Issue #209 — keep theme wrapper on finished board too */
        <div
          className={isThemed ? "game-theme-wrapper mx-auto mt-4 max-w-lg" : ""}
          data-theme={isThemed ? customization.theme : undefined}
        >
          {/* [transform:translateZ(0)] creates a containing block for the fixed
              GameOverModal overlay, keeping it anchored to this section. */}
          <div className="relative flex min-h-[calc(100vh-5rem)] flex-col items-center gap-6 py-4 [transform:translateZ(0)]">
            {/* Same title block as playing phase — keeps layout stable. */}
            <div className="text-center">
              <h1 className={`text-2xl font-bold ${isThemed ? "" : "text-pong-text"}`}>
                vs AI{" "}
                <span className={`text-sm font-semibold ${difficultyColor}`}>
                  ({game.difficulty})
                </span>
              </h1>
              <p
                className={`mt-1 text-xs ${isThemed ? "opacity-40" : "text-pong-text/40"}`}
              >
                You are{" "}
                <span
                  className={
                    game.playerSymbol === "X"
                      ? isThemed
                        ? "font-bold themed-p1"
                        : "font-bold text-pong-accent"
                      : isThemed
                        ? "font-bold themed-p2"
                        : "font-bold text-pong-secondary"
                  }
                >
                  {p1Display}
                </span>
              </p>
            </div>

            {/* Result shown where "Your turn / AI's turn" was during play. */}
            <TurnIndicator
              currentPlayer={game.playerSymbol}
              isYourTurn={false}
              playerSymbol={game.playerSymbol}
              textOverride={
                game.status === "DRAW"
                  ? "It's a Draw! 🤝"
                  : game.winner === game.playerSymbol
                    ? "You Won! 🎉"
                    : "You Lost 😢"
              }
            />

            <GameBoard
              board={game.board}
              onCellClick={() => {}}
              disabled
              boardSize={3}
              playerSymbol={game.playerSymbol}
              gameOver
              winnerSymbol={
                game.status !== "DRAW" ? ((game.winner as PlayerSymbol) ?? null) : null
              }
              winningLine={winningLine}
              themed={isThemed}
              renderSymbol={renderSymbol} /* hook returns undefined when default — PR #306 fix */
            />

            {/* themed-btn-primary adapts colour to neon/retro — PR #306 */}
            <Button
              variant="primary"
              onClick={() => setShowModal(true)}
              aria-label="View result"
              className={`${showModal ? "invisible" : ""} ${isThemed ? "themed-btn-primary" : ""}`.trim()}
            >
              View Result
            </Button>

            <GameOverModal
              open={showModal}
              result={game.status === "DRAW" ? "draw" : "win"}
              winner={buildWinner()}
              loser={buildLoser()}
              opponent={buildOpponent()}
              mySymbol={game.playerSymbol}
              totalMoves={totalMoves}
              durationSeconds={finalDuration}
              onPlayAgain={handlePlayAgain}
              onGoLobby={() => void navigate("/lobby")}
              onClose={() => setShowModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
