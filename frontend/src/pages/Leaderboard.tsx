/**
 * Issue #291 — Global Leaderboard page.
 * Fetches ranked player data from GET /api/leaderboard, renders loading/error/empty
 * states, and supports incremental "Show More" (10 at a time, up to 100) and refresh.
 */

import { useEffect, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import LeaderboardTable from "../components/Leaderboard/LeaderboardTable";
import { leaderboardService } from "../services/leaderboard.service";
import type { LeaderboardEntry } from "../types/leaderboard";

const INITIAL_LIMIT = 10;
const LIMIT_STEP = 10;
const MAX_LIMIT = 100;

/**
 * Issue #291 — Leaderboard page component. Manages fetch state (loading, error, data),
 * a configurable limit with "Show More", and a manual refresh trigger.
 */
export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string>("");
  const [limit, setLimit] = useState(INITIAL_LIMIT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await leaderboardService.getLeaderboard(limit);
        if (!cancelled) {
          setEntries(data.leaderboard);
          setGeneratedAt(data.generatedAt);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load leaderboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [limit, refreshKey]);

  /**
   * Issue #291 — Increments the limit by LIMIT_STEP, capped at MAX_LIMIT.
   * The useEffect above re-runs automatically when limit changes.
   */
  const handleShowMore = () => {
    setLimit((prev) => Math.min(prev + LIMIT_STEP, MAX_LIMIT));
  };

  /**
   * Issue #291 — Triggers a re-fetch at the current limit without changing state shape.
   */
  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const canShowMore = entries.length >= limit && limit < MAX_LIMIT;

  return (
    <div className="mx-auto w-full max-w-3xl px-4">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-4xl font-bold text-pong-accent">Leaderboard</h1>
        <Button
          variant="secondary"
          onClick={handleRefresh}
          disabled={loading}
          aria-label="Refresh leaderboard"
        >
          Refresh
        </Button>
      </div>

      {/* Loading state */}
      {loading && (
        <Card variant="elevated">
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-pong-accent border-t-transparent" />
          </div>
        </Card>
      )}

      {/* Error state */}
      {!loading && error && (
        <Card variant="elevated">
          <div className="py-4 text-center">
            <p className="mb-3 text-sm text-red-400">{error}</p>
            <Button variant="secondary" onClick={handleRefresh}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && entries.length === 0 && (
        <Card variant="elevated">
          <p className="py-6 text-center text-sm text-pong-text/50">
            No players on the leaderboard yet.
          </p>
        </Card>
      )}

      {/* Populated leaderboard */}
      {!loading && !error && entries.length > 0 && (
        <>
          <LeaderboardTable entries={entries} generatedAt={generatedAt} />

          {/* Show More */}
          {canShowMore && (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" onClick={handleShowMore}>
                Show More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
