/**
 * AIGame Page — Issue #183
 *
 * Full "Play vs AI" flow with three phases:
 * - Setup: pick difficulty (Easy/Medium/Hard) and symbol (X/O), then start.
 * - Playing: renders GameBoard + TurnIndicator, sends moves via aiService,
 *   shows a 350ms "AI is thinking..." delay after each player move.
 * - Finished: shows the final board + GameOverModal with "Play Again" (resets
 *   to setup) or "New Game (Lobby)" (navigates to /lobby).
 *
 * Reuses existing GameBoard, GameOverModal, and TurnIndicator components.
 * The board is always 3x3 (backend AI only supports 3x3).
 */
import { useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import type { PlayerSymbol, CellValue, GameOverPlayerSummary } from "../types/game";
import { aiService } from "../services/ai.service";
import type { AiDifficulty } from "../services/ai.service";
import GameBoard from "../components/Game/GameBoard";
import GameOverModal from "../components/Game/GameOverModal";
import TurnIndicator from "../components/Game/TurnIndicator";
import DifficultySelector from "../components/AI/DifficultySelector";
import SymbolSelector from "../components/AI/SymbolSelector";
import Button from "../components/Button";

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

export default function AIGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initDifficulty = (searchParams.get("difficulty") as AiDifficulty) || "medium";

  const [phase, setPhase] = useState<GamePhase>("setup");
  const [difficulty, setDifficulty] = useState<AiDifficulty>(initDifficulty);
  const [symbol, setSymbol] = useState<PlayerSymbol>("X");
  const [game, setGame] = useState<GameState | null>(null);
  const [processing, setProcessing] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<number>(0);

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
        isPlayerTurn: true,
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

        if (isGameOver) {
          setGame((prev) =>
            prev
              ? { ...prev, board: newBoard, winner: res.game.winner, status: res.game.status }
              : prev,
          );
          setProcessing(false);
          setPhase("finished");
          return;
        }

        // Show player's move immediately, then simulate AI thinking delay
        const boardAfterPlayer = [...newBoard];
        if (res.aiMove) {
          boardAfterPlayer[res.aiMove.moveIndex] = null as CellValue;
        }
        setGame((prev) =>
          prev ? { ...prev, board: boardAfterPlayer, isPlayerTurn: false } : prev,
        );
        setProcessing(false);

        if (res.aiMove) {
          setAiThinking(true);
          await new Promise((r) => setTimeout(r, 350));
          setGame((prev) =>
            prev
              ? { ...prev, board: newBoard, isPlayerTurn: true }
              : prev,
          );
          setAiThinking(false);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to make move");
        setProcessing(false);
      }
    },
    [game, processing, aiThinking],
  );

  const handlePlayAgain = useCallback(() => {
    setGame(null);
    setError(null);
    setPhase("setup");
  }, []);

  const totalMoves = game ? game.board.filter((c) => c !== null).length : 0;
  const durationSeconds = game
    ? Math.round((Date.now() - startTimeRef.current) / 1000)
    : 0;

  // Build GameOverModal props
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

  return (
    <div className="w-full max-w-2xl space-y-6 py-4">
      {/* Setup phase */}
      {phase === "setup" && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-pong-accent">Play vs AI</h1>
            <p className="mt-1 text-sm text-pong-text/60">
              Choose your difficulty and symbol to begin.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-pong-text/70">Difficulty</h2>
            <DifficultySelector selected={difficulty} onSelect={setDifficulty} />
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-pong-text/70">Your Symbol</h2>
            <SymbolSelector selected={symbol} onSelect={setSymbol} />
          </div>

          {error && (
            <p className="text-center text-sm text-red-400">{error}</p>
          )}

          <div className="flex flex-col items-center gap-3">
            <Button
              variant="primary"
              className="w-full max-w-xs"
              onClick={() => void handleStartGame()}
              disabled={processing}
            >
              {processing ? "Creating game..." : "Start Game"}
            </Button>
            <Button
              variant="secondary"
              className="w-full max-w-xs"
              onClick={() => void navigate("/lobby")}
            >
              Back to Lobby
            </Button>
          </div>
        </div>
      )}

      {/* Playing phase */}
      {phase === "playing" && game && (
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-pong-text">
              vs AI{" "}
              <span className="text-sm font-normal text-pong-text/50">
                ({game.difficulty})
              </span>
            </h1>
            <p className="text-xs text-pong-text/40">
              You are{" "}
              <span
                className={
                  game.playerSymbol === "X"
                    ? "font-bold text-pong-accent"
                    : "font-bold text-pong-secondary"
                }
              >
                {game.playerSymbol}
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
          />

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </div>
      )}

      {/* Finished phase */}
      {phase === "finished" && game && (
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-pong-text">Game Over</h1>
          </div>

          <GameBoard
            board={game.board}
            onCellClick={() => {}}
            disabled
            boardSize={3}
            playerSymbol={game.playerSymbol}
            gameOver
            winnerSymbol={(game.winner as PlayerSymbol) ?? null}
          />

          <GameOverModal
            open
            result={game.status === "DRAW" ? "draw" : "win"}
            winner={buildWinner()}
            loser={buildLoser()}
            opponent={buildOpponent()}
            mySymbol={game.playerSymbol}
            totalMoves={totalMoves}
            durationSeconds={durationSeconds}
            onPlayAgain={handlePlayAgain}
            onGoLobby={() => void navigate("/lobby")}
            onClose={handlePlayAgain}
          />
        </div>
      )}
    </div>
  );
}
