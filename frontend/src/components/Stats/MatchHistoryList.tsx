/**
 * Issue #290 — Frontend Stats & Match History
 * MatchHistoryList component — fetches and renders a paginated list of matches.
 * Handles loading, error (with retry), and empty states. Re-fetches when
 * userId or page changes. Resets to page 1 when switching between users.
 */

import { useEffect, useState } from "react";
import Card from "../Card";
import Button from "../Button";
import MatchHistoryItem from "./MatchHistoryItem";
import { statsService } from "../../services/stats.service";
import type { Match } from "../../types/stats";

interface MatchHistoryListProps {
  userId: number;
}

const PAGE_LIMIT = 10;

/**
 * Issue #290 — Main MatchHistoryList component. Calls statsService.getUserMatches()
 * with pagination (PAGE_LIMIT per page). Renders a spinner while loading, an error
 * message with a Retry button on failure, "No matches played yet" when empty, and
 * Previous/Next pagination controls when there are multiple pages.
 */
export default function MatchHistoryList({ userId }: MatchHistoryListProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await statsService.getUserMatches(userId, currentPage, PAGE_LIMIT);
        if (!cancelled) {
          setMatches(data.matches);
          setTotalPages(data.pagination.totalPages);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load match history");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [userId, currentPage, retryKey]);

  // Reset to page 1 when userId changes
  useEffect(() => {
    setCurrentPage(1);
  }, [userId]);

  return (
    <Card variant="elevated">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-pong-text/80">Match History</p>
        {!loading && !error && totalPages > 1 && (
          <span className="text-xs text-pong-text/40">
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-pong-accent border-t-transparent" />
        </div>
      )}

      {!loading && error && (
        <div className="py-4 text-center">
          <p className="mb-3 text-sm text-red-400">{error}</p>
          <Button variant="secondary" onClick={() => setRetryKey((k) => k + 1)}>
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && matches.length === 0 && (
        <p className="py-4 text-center text-sm text-pong-text/50">
          No matches played yet.
        </p>
      )}

      {!loading && !error && matches.length > 0 && (
        <>
          <div className="divide-y divide-black/5">
            {matches.map((match) => (
              <MatchHistoryItem key={match.gameId} match={match} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="secondary"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
