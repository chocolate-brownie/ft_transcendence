import { useEffect } from "react";

import Button from "../Button";

type Symbol = "X" | "O";

interface PlayerSummary {
  id: number;
  username: string;
  symbol: Symbol;
}

interface GameOverModalProps {
  open: boolean;
  result: "win" | "draw";
  winner: PlayerSummary | null;
  loser: PlayerSummary | null;
  mySymbol: Symbol;
  totalMoves: number;
  durationSeconds?: number;
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
  mySymbol,
  totalMoves,
  durationSeconds,
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
  const title =
    result === "draw" ? "It's a Draw! 🤝" : didIWin ? "You Won! 🎉" : "You Lost 😢";
  const subtitle =
    result === "draw"
      ? "Well played by both players."
      : `${winner?.username ?? "Unknown"} wins with ${winner?.symbol ?? "?"}.`;
  const opponent = didIWin ? loser : winner;
  const headerToneClass =
    result === "draw"
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
        {didIWin ? (
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
            className="rounded-md px-2 py-1 text-pong-text/60 hover:bg-pong-accent/10 hover:text-pong-text"
            aria-label="Close game over modal"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 rounded-lg bg-black/15 p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-pong-text/60">Total Moves</p>
            <p className="text-2xl font-bold text-pong-text">{totalMoves}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-pong-text/60">Duration</p>
            <p className="text-2xl font-bold text-pong-text">{formatDuration(durationSeconds)}</p>
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
            <p className="text-lg font-semibold text-pong-text">
              {opponent ? `${opponent.username} (${opponent.symbol})` : "N/A"}
            </p>
          </div>
        </div>

        {rematchError ? <p className="mt-3 text-xs text-red-400">{rematchError}</p> : null}

        <div className="mt-5 space-y-3">
          <Button variant="primary" className="w-full" onClick={onPlayAgain} disabled={rematchLoading}>
            {rematchLoading ? "Creating rematch..." : "Play Again"}
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
