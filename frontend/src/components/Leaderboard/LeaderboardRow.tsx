/**
 * Issue #291 — Single row in the leaderboard table.
 * Renders rank circle (gold/silver/bronze for top 3, plain for the rest),
 * player avatar + username, stat columns (hidden on mobile), and a win-rate badge.
 * The entire row is clickable and navigates to /profile/:id.
 */

import { useNavigate } from "react-router-dom";
import type { LeaderboardEntry } from "../../types/leaderboard";

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
}

/**
 * Issue #291 — Returns Tailwind classes for the rank circle based on position.
 * Top 3 get colored rings; rank 4+ get a plain muted circle.
 */
function rankCircleClass(rank: number): string {
  if (rank === 1) return "border-2 border-yellow-400 text-yellow-500 bg-yellow-400/10";
  if (rank === 2) return "border-2 border-slate-400 text-slate-500 bg-slate-400/10";
  if (rank === 3) return "border-2 border-amber-600 text-amber-700 bg-amber-600/10";
  return "border border-black/10 text-pong-text/40 bg-black/5";
}

/**
 * Issue #291 — Returns Tailwind text color class for the win-rate badge.
 * Thresholds: >=70% green, >=50% blue, >=30% yellow, <30% red.
 */
function winRateBadgeClass(rate: number): string {
  if (rate >= 70) return "text-green-600 bg-green-500/10";
  if (rate >= 50) return "text-blue-600 bg-blue-500/10";
  if (rate >= 30) return "text-yellow-600 bg-yellow-500/10";
  return "text-red-500 bg-red-500/10";
}

/**
 * Issue #291 — LeaderboardRow component. Renders one player row inside the
 * leaderboard table. Navigates to /profile/:id on click.
 */
export default function LeaderboardRow({ entry }: LeaderboardRowProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    void navigate(`/profile/${entry.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      void navigate(`/profile/${entry.id}`);
    }
  };

  const avatarSrc =
    entry.avatarUrl && entry.avatarUrl.startsWith("/uploads/")
      ? entry.avatarUrl
      : "/default-avatar.png";

  return (
    <tr
      className="cursor-pointer transition-colors hover:bg-pong-accent/5 focus-within:bg-pong-accent/5"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="link"
      aria-label={`View profile of ${entry.username}, rank ${entry.rank}`}
    >
      {/* Rank */}
      <td className="px-4 py-3 w-12">
        <div
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${rankCircleClass(entry.rank)}`}
        >
          {entry.rank}
        </div>
      </td>

      {/* Player */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src={avatarSrc}
            alt={`${entry.username} avatar`}
            className="h-8 w-8 rounded-full object-cover border border-black/10 flex-shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
            }}
          />
          <div>
            <p className="text-sm font-semibold text-pong-text leading-tight">
              {entry.username}
            </p>
            <p className="text-xs text-pong-text/40">{entry.totalGames} games</p>
          </div>
        </div>
      </td>

      {/* Wins — hidden on mobile */}
      <td className="hidden sm:table-cell px-4 py-3 text-center">
        <span className="text-sm font-medium text-green-600">{entry.wins}</span>
      </td>

      {/* Losses — hidden on mobile */}
      <td className="hidden sm:table-cell px-4 py-3 text-center">
        <span className="text-sm font-medium text-red-500">{entry.losses}</span>
      </td>

      {/* Draws — hidden on mobile */}
      <td className="hidden sm:table-cell px-4 py-3 text-center">
        <span className="text-sm font-medium text-blue-500">{entry.draws}</span>
      </td>

      {/* Win rate */}
      <td className="px-4 py-3 text-right">
        <span
          className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${winRateBadgeClass(entry.winRate)}`}
        >
          {(entry.winRate ?? 0).toFixed(1)}%
        </span>
      </td>
    </tr>
  );
}
