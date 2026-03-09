/**
 * Issue #290 — Frontend Stats & Match History
 * StatsCard component — displays a user's aggregate stats on their profile page.
 * Replaces the simpler ProfileStats component with a richer display including
 * win-rate progress bar and games-by-type breakdown.
 */

import Card from "../Card";
import type { UserStats } from "../../types/stats";

interface StatsCardProps {
  stats: UserStats;
}

/**
 * Issue #290 — Returns the Tailwind background class for the win-rate progress bar.
 * Thresholds: >=70% green, >=50% blue, >=30% yellow, <30% red.
 */
function winRateColor(rate: number): string {
  if (rate >= 70) return "bg-green-500";
  if (rate >= 50) return "bg-blue-500";
  if (rate >= 30) return "bg-yellow-500";
  return "bg-red-500";
}

/**
 * Issue #290 — Reusable tile for a single stat value (Total, Wins, Losses, Draws).
 * Accepts an optional tint class for colored backgrounds (e.g. bg-green-500/10).
 */
function StatTile({
  label,
  value,
  tint,
}: {
  label: string;
  value: number | string;
  tint?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-black/10 p-3 text-center ${tint ?? "bg-white/20"}`}
    >
      <p className="text-xs text-pong-text/50">{label}</p>
      <p className="text-lg font-bold text-pong-text">{value}</p>
    </div>
  );
}

/**
 * Issue #290 — Main StatsCard component. Renders stat tiles (2-col mobile, 4-col desktop),
 * a color-coded win-rate progress bar, a games-by-type breakdown grid (Classic, Custom,
 * Tournament, AI), and the last-played date. Uses the project's Card component.
 */
export default function StatsCard({ stats }: StatsCardProps) {
  const { totalGames, wins, losses, draws, winRate, gamesByType, lastGameAt } = stats;

  const lastPlayed = lastGameAt
    ? new Date(lastGameAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Never";

  return (
    <Card variant="elevated">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-pong-text/50">
        Stats
      </p>

      {/* Top stat tiles — 2-col on mobile, 4-col on desktop */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Total" value={totalGames} />
        <StatTile label="Wins" value={wins} tint="bg-green-500/10" />
        <StatTile label="Losses" value={losses} tint="bg-red-500/10" />
        <StatTile label="Draws" value={draws} tint="bg-blue-500/10" />
      </div>

      {/* Win rate bar */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-pong-text/50">Win Rate</span>
          <span className="font-semibold text-pong-text">
            {(winRate ?? 0).toFixed(1)}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${winRateColor(winRate)}`}
            style={{ width: `${Math.min(winRate, 100)}%` }}
          />
        </div>
      </div>

      {/* Games by type */}
      <div className="mb-3 rounded-lg border border-black/10 bg-white/10 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-pong-text/50">
          By Type
        </p>
        <div className="grid grid-cols-4 gap-1 text-center">
          {(
            [
              ["Classic", gamesByType.classic ?? 0],
              ["Custom", gamesByType.custom ?? 0],
              ["Tourney", gamesByType.tournament ?? 0],
              ["AI", gamesByType.ai ?? 0],
            ] as [string, number][]
          ).map(([label, count]) => (
            <div key={label}>
              <p className="text-base font-bold text-pong-text">{count}</p>
              <p className="text-xs text-pong-text/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Last game */}
      <p className="text-right text-xs text-pong-text/40">Last played: {lastPlayed}</p>
    </Card>
  );
}
