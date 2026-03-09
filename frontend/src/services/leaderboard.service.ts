/**
 * Issue #291 — API service layer for the global leaderboard.
 * Uses apiClient (not axios) — the limit param is appended to the URL string.
 */

import { apiClient } from "../lib/apiClient";
import type { LeaderboardResponse } from "../types/leaderboard";

export const leaderboardService = {
  /**
   * Issue #291 — Fetches the global leaderboard ranked by wins.
   * Calls GET /api/leaderboard with a configurable limit parameter.
   */
  getLeaderboard(limit: number): Promise<LeaderboardResponse> {
    return apiClient.get<LeaderboardResponse>(`/api/leaderboard?limit=${limit}`);
  },
};
