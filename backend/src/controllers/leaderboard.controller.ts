import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { getLeaderboard } from "../services/leaderboard.service";

/**
 * Issue #289 — Controller for GET /api/leaderboard.
 *
 * Parses the ?limit query param (default 10, clamped between 1 and 100),
 * calls the leaderboard service, and returns the ranked list as JSON.
 * No user ID needed — the leaderboard is global.
 */
export async function getLeaderboardController(req: AuthRequest, res: Response) {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
  const result = await getLeaderboard(limit);
  return res.json(result);
}
