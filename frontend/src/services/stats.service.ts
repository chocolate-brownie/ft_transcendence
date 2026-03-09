/**
 * Issue #290 — Frontend Stats & Match History
 * API service layer for fetching user stats and paginated match history.
 * Uses apiClient (not axios) — query params are appended to the URL string.
 */

import { apiClient } from "../lib/apiClient";
import type { UserStats, MatchHistoryResponse } from "../types/stats";

export const statsService = {
  /**
   * Issue #290 — Fetch a user's aggregate stats (wins, losses, draws, winRate,
   * gamesByType breakdown, lastGameAt). Calls GET /api/users/:id/stats.
   */
  getUserStats(userId: number): Promise<UserStats> {
    return apiClient.get<UserStats>(`/api/users/${userId}/stats`);
  },

  /**
   * Issue #290 — Fetch a user's paginated match history with opponent info,
   * result, duration, and game metadata. Calls GET /api/users/:id/matches.
   */
  getUserMatches(userId: number, page: number, limit = 10): Promise<MatchHistoryResponse> {
    return apiClient.get<MatchHistoryResponse>(
      `/api/users/${userId}/matches?page=${page}&limit=${limit}`,
    );
  },
};
