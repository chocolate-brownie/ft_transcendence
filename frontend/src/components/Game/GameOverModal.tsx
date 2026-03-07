import { useEffect } from "react";
import type { GameOverPlayerSummary, PlayerSymbol } from "../../types/game";

import Button from "../Button";

interface GameOverModalProps {
  open: boolean;
  result: "win" | "draw";
  winner: GameOverPlayerSummary | null;
  loser: GameOverPlayerSummary | null;
  opponent: GameOverPlayerSummary | null;
  mySymbol: PlayerSymbol;
  totalMoves: number;
  durationSeconds?: number;
  isForfeit?: boolean;
  opponentAvatarUrl?: string | null;
  rematchLoading?: boolean;
  rematchError?: string | null;
  onPlayAgain: () => void;
  onGoLobby: () => void;
  onGoHome: () => void;
  onClose: () => void;
}

function formatDuration(seconds?: number): string {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) {
    return "N/A";
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function GameOverModal({
  open,
  result,
  winner,
  loser,
  opponent,
  mySymbol,
  totalMoves,
  durationSeconds,
  isForfeit = false,
  opponentAvatarUrl = null,
  rematchLoading = false,
  rematchError = null,
  onPlayAgain,
  onGoLobby,
  onGoHome,
  onClose,
}: GameOverModalProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [open, onClose]);

  if (!open) return null;

  const didIWin = result === "win" && winner?.symbol === mySymbol;
  const title = isForfeit
    ? didIWin
      ? "You Won! ⚠️"
      : "You Lost ⚠️"
    : result === "draw"
      ? "It's a Draw! 🤝"
      : didIWin
        ? "You Won! 🎉"
        : "You Lost 😢";
  const subtitle = isForfeit
    ? didIWin
      ? "Opponent disconnected for too long."
      : "You were disconnected for too long."
    : result === "draw"
      ? "Well played by both players."
      : `${winner?.username ?? "Unknown"} wins with ${winner?.symbol ?? "?"}.`;
  const derivedOpponent = didIWin ? loser : winner;
  const shownOpponent = opponent ?? derivedOpponent;
  const headerToneClass = isForfeit
    ? "from-amber-500/20 to-amber-300/10 border-amber-300/30"
    : result === "draw"
      ? "from-slate-500/20 to-slate-300/10 border-slate-300/30"
      : didIWin
        ? "from-emerald-500/20 to-emerald-300/10 border-emerald-300/30"
        : "from-red-500/20 to-red-300/10 border-red-300/30";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
      onClick={(event) => event.stopPropagation()}
      data-testid="game-over-modal"
    >
      <div
        className={`relative w-full max-w-md rounded-xl border bg-gradient-to-b ${headerToneClass} bg-pong-surface p-6 shadow-xl`}
      >
        {isForfeit ? null : didIWin ? (
          <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 text-lg opacity-80">
            ✨ 🎉 ✨
          </div>
        ) : null}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="game-over-title" className="text-3xl font-bold text-pong-text">
              {title}
            </h2>
            <p className="mt-1 text-sm text-pong-text/70">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-pong-text/60 hover:bg-pong-accent/10 hover:text-pong-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pong-accent/50"
            aria-label="Close game over modal"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 rounded-lg bg-black/15 p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-pong-text/60">
              Total Moves
            </p>
            <p className="text-2xl font-bold text-pong-text">{totalMoves}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-pong-text/60">Duration</p>
            <p className="text-2xl font-bold text-pong-text">
              {formatDuration(durationSeconds)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-pong-text/60">Winner</p>
            <p className="text-lg font-semibold text-pong-text">
              {result === "draw" ? (
                "Draw"
              ) : (
                <>
                  {winner?.username ?? "Unknown"}{" "}
                  <span
                    className={
                      winner?.symbol === "X"
                        ? "font-bold text-pong-accent"
                        : "font-bold text-pong-secondary"
                    }
                  >
                    ({winner?.symbol ?? "?"})
                  </span>
                </>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-pong-text/60">Opponent</p>
            <div className="mt-1 flex items-center gap-2">
              {shownOpponent ? (
                opponentAvatarUrl ? (
                  <img
                    src={opponentAvatarUrl}
                    alt={`${shownOpponent.username} avatar`}
                    className="h-7 w-7 flex-shrink-0 rounded-full border border-black/10 object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                    }}
                  />
                ) : (
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/40 text-xs font-bold text-pong-text/70">
                    {shownOpponent.username[0]?.toUpperCase() ?? "?"}
                  </div>
                )
              ) : null}
              <p className="truncate text-base font-semibold text-pong-text">
                {shownOpponent
                  ? `${shownOpponent.username} (${shownOpponent.symbol})`
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {rematchError ? (
          <p className="mt-3 text-xs text-red-400">{rematchError}</p>
        ) : null}

        <div className="mt-5 space-y-3">
          <Button
            variant="primary"
            className="w-full"
            onClick={onPlayAgain}
            disabled={rematchLoading}
          >
            {rematchLoading
              ? "Creating rematch..."
              : isForfeit
                ? "Find New Game"
                : "Play Again"}
          </Button>
          <Button variant="secondary" className="w-full" onClick={onGoLobby}>
            New Game (Lobby)
          </Button>
          <Button variant="danger" className="w-full" onClick={onGoHome}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
