import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { getUserStats, getUserMatches } from "../services/stats.service";

/**
 * Issue #289 — Controller for GET /api/users/:id/stats.
 *
 * Validates the :id path param (must be a positive integer), calls the stats
 * service, and maps the result to HTTP: null becomes 404, otherwise 200 + JSON.
 */
export async function getUserStatsController(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const stats = await getUserStats(id);
  if (!stats) return res.status(404).json({ error: "User not found" });

  return res.json(stats);
}

/**
 * Issue #289 — Controller for GET /api/users/:id/matches.
 *
 * Validates :id, parses page (default 1, min 1) and limit (default 10, max 50)
 * from query params, calls the matches service, and returns paginated results.
 * Returns 404 if user does not exist, 400 if :id is invalid.
 */
export async function getUserMatchesController(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

  const result = await getUserMatches(id, page, limit);
  if (!result) return res.status(404).json({ error: "User not found" });

  return res.json(result);
}
