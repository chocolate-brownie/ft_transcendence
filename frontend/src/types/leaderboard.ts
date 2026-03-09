/**
 * Issue #291 — TypeScript interfaces for the global leaderboard API response.
 * Field names match the backend leaderboard.service.ts exactly.
 * Use `id` (not userId) and `avatarUrl` (not avatar).
 */

/**
 * Issue #291 — Single entry in the leaderboard, ranked by wins.
 * Returned by GET /api/leaderboard inside the `leaderboard` array.
 */
export interface LeaderboardEntry {
  rank: number;
  id: number;
  username: string;
  avatarUrl: string | null;
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  winRate: number;
}

/**
 * Issue #291 — Top-level response from GET /api/leaderboard.
 * `generatedAt` is an ISO 8601 timestamp string.
 */
export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  generatedAt: string;
}
