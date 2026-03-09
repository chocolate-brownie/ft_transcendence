/**
 * Issue #290 — Frontend Stats & Match History
 * MatchHistoryItem component — renders a single row in the match history list.
 * Shows opponent avatar, name, result badge, and game details (board size, type,
 * duration, date). Detail columns hide on mobile; result badge is always visible.
 */

import type { Match } from "../../types/stats";

interface MatchHistoryItemProps {
  match: Match;
}

/**
 * Issue #290 — Formats a duration in seconds as "m:ss" (e.g. 65 → "1:05").
 * Used by MatchHistoryItem to display game duration.
 */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Issue #290 — Returns Tailwind classes for the result badge.
 * Win → green, Loss → red, Draw → gray.
 */
function resultStyle(result: Match["result"]): string {
  if (result === "win") return "bg-green-500/15 text-green-700 border-green-500/30";
  if (result === "loss") return "bg-red-500/15 text-red-700 border-red-500/30";
  return "bg-gray-400/15 text-gray-600 border-gray-400/30";
}

/**
 * Issue #290 — Renders a single match row with opponent avatar (onError fallback),
 * "vs username" label, colored result badge, and responsive detail columns
 * (board size, game type, duration in mm:ss, date). Details hidden on mobile.
 */
export default function MatchHistoryItem({ match }: MatchHistoryItemProps) {
  const { gameType, boardSize, result, opponent, duration, finishedAt } = match;

  const date = new Date(finishedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  const avatarSrc =
    opponent.avatarUrl && opponent.avatarUrl.startsWith("/uploads/")
      ? opponent.avatarUrl
      : "/default-avatar.png";

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-black/5">
      {/* Opponent avatar */}
      <img
        src={avatarSrc}
        alt={opponent.username}
        className="h-8 w-8 flex-shrink-0 rounded-full border border-black/10 object-cover"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
        }}
      />

      {/* Opponent name */}
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-pong-text">
        vs {opponent.username}
      </span>

      {/* Result badge — always visible */}
      <span
        className={`flex-shrink-0 rounded border px-2 py-0.5 text-xs font-semibold uppercase ${resultStyle(result)}`}
      >
        {result}
      </span>

      {/* Detail columns — hidden on small screens */}
      <span className="hidden w-10 flex-shrink-0 text-right text-xs text-pong-text/50 sm:block">
        {boardSize}x{boardSize}
      </span>
      <span className="hidden w-16 flex-shrink-0 text-right text-xs capitalize text-pong-text/50 sm:block">
        {gameType}
      </span>
      <span className="hidden w-12 flex-shrink-0 text-right text-xs text-pong-text/50 sm:block">
        {duration != null ? formatDuration(duration) : "—"}
      </span>
      <span className="hidden w-16 flex-shrink-0 text-right text-xs text-pong-text/40 sm:block">
        {date}
      </span>
    </div>
  );
}
