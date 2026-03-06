import type { PlayerSymbol, RoomPlayerSummary } from "../../types/game";
import type { ServerStatus } from "../../pages/game/types";

interface ScoreboardProps {
  player1: RoomPlayerSummary | null;
  player2: RoomPlayerSummary | null;
  player1Symbol: PlayerSymbol;
  player2Symbol: PlayerSymbol;
  currentTurn: PlayerSymbol;
  serverStatus: ServerStatus;
  player1Score: number;
  player2Score: number;
}

function Avatar({
  player,
  testId,
}: {
  player: RoomPlayerSummary | null;
  testId: string;
}) {
  const avatarSrc = player?.avatarUrl || "/default-avatar.png";
  const avatarLabel = player?.username ?? "Player";

  return (
    <img
      src={avatarSrc}
      alt={`${avatarLabel} avatar`}
      className="h-11 w-11 rounded-full border border-black/10 object-cover"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
      }}
      data-testid={`${testId}-image`}
    />
  );
}

export default function Scoreboard({
  player1,
  player2,
  player1Symbol,
  player2Symbol,
  currentTurn,
  serverStatus,
  player1Score,
  player2Score,
}: ScoreboardProps) {
  const player1Active = serverStatus === "IN_PROGRESS" && currentTurn === player1Symbol;
  const player2Active = serverStatus === "IN_PROGRESS" && currentTurn === player2Symbol;

  return (
    <div className="w-full max-w-xl rounded-xl border border-black/10 bg-pong-surface p-4 shadow-sm">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div
          data-testid="scoreboard-player1-card"
          className={`rounded-lg border px-3 py-3 transition-all duration-200 ${
            player1Active
              ? "border-pong-accent/70 bg-pong-accent/15 ring-2 ring-pong-accent/40"
              : "border-black/10 bg-white/40"
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-pong-text/50">Player 1</p>
          <div className="mt-2 flex items-center gap-3">
            <Avatar player={player1} testId="player1-avatar" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-pong-text">
                {player1?.username ?? "Waiting..."}{" "}
                <span className="text-pong-accent">({player1Symbol})</span>
              </p>
              <p className="text-2xl font-bold text-pong-accent">{player1Score}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center px-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-pong-text/40">
            VS
          </span>
        </div>

        <div
          data-testid="scoreboard-player2-card"
          className={`rounded-lg border px-3 py-3 text-right transition-all duration-200 ${
            player2Active
              ? "border-pong-secondary/70 bg-pong-secondary/15 ring-2 ring-pong-secondary/40"
              : "border-black/10 bg-white/40"
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-pong-text/50">Player 2</p>
          <div data-testid="scoreboard-player2-row" className="mt-2 flex flex-row-reverse items-center gap-3">
            <Avatar player={player2} testId="player2-avatar" />
            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-semibold text-pong-text">
                {player2?.username ?? "Waiting..."}{" "}
                <span className="text-pong-secondary">
                  ({player2 ? player2Symbol : "?"})
                </span>
              </p>
              <p className="text-2xl font-bold text-pong-secondary">{player2Score}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
