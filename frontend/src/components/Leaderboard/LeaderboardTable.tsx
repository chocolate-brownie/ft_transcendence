/**
 * Issue #291 — Leaderboard table wrapper component.
 * Renders a desktop header row, maps entries to LeaderboardRow, and shows a
 * footer with the data generation timestamp. Stats columns (Wins/Losses/Draws)
 * are hidden on mobile — Rank, Player, and Win Rate always remain visible.
 */

import Card from "../Card";
import LeaderboardRow from "./LeaderboardRow";
import type { LeaderboardEntry } from "../../types/leaderboard";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  generatedAt: string;
}

/**
 * Issue #291 — Formats the ISO 8601 generatedAt timestamp into a human-readable
 * local date/time string for the footer.
 */
function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Issue #291 — LeaderboardTable component. Renders the full ranked table inside
 * a Card, with a sticky-style header row and a timestamp footer.
 */
export default function LeaderboardTable({
  entries,
  generatedAt,
}: LeaderboardTableProps) {
  return (
    <Card variant="elevated" className="overflow-hidden !p-0">
      {/* Table header */}
      <div className="px-4 pt-4 pb-2 border-b border-black/10">
        <h2 className="text-lg font-bold text-pong-accent tracking-tight">Leaderboard</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-black/5 text-xs uppercase tracking-wide text-pong-text/50">
              <th scope="col" className="px-4 py-2 text-left w-12">
                Rank
              </th>
              <th scope="col" className="px-4 py-2 text-left">
                Player
              </th>
              <th scope="col" className="hidden sm:table-cell px-4 py-2 text-center">
                Wins
              </th>
              <th scope="col" className="hidden sm:table-cell px-4 py-2 text-center">
                Losses
              </th>
              <th scope="col" className="hidden sm:table-cell px-4 py-2 text-center">
                Draws
              </th>
              <th scope="col" className="px-4 py-2 text-right">
                Win Rate
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {entries.map((entry) => (
              <LeaderboardRow key={entry.id} entry={entry} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-black/10">
        <p className="text-xs text-pong-text/40 text-right">
          Updated: {formatTimestamp(generatedAt)}
        </p>
      </div>
    </Card>
  );
}
