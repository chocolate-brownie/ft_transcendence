/**
 * Issue #290 — Frontend Stats & Match History
 * TypeScript interfaces for the stats and match history API responses.
 * Field names must match the backend (issue #289) exactly.
 */

/**
 * Issue #290 — User stats summary returned by GET /api/users/:id/stats.
 * Includes aggregate counts, win rate, games-by-type breakdown, and last game date.
 */
export interface UserStats {
  userId: number;
  username: string;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  gamesAsPlayer1: number;
  gamesAsPlayer2: number;
  gamesByType: {
    classic: number;
    custom: number;
    tournament: number;
    ai: number;
  };
  lastGameAt: string | null;
}

/**
 * Issue #290 — Single match entry returned by GET /api/users/:id/matches.
 * Contains opponent info, result from the queried user's perspective,
 * game metadata (type, board size), and computed duration in seconds.
 */
export interface Match {
  gameId: number;
  gameType: string;
  boardSize: number;
  result: "win" | "loss" | "draw";
  opponent: {
    id: number | null;
    username: string;
    avatarUrl: string | null;
  };
  duration: number | null;
  finishedAt: string;
}

/**
 * Issue #290 — Paginated response wrapper for match history.
 * Includes the matches array and pagination metadata (page, limit, total, totalPages).
 */
export interface MatchHistoryResponse {
  matches: Match[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
