import { Router } from "express";
import { getLeaderboardController } from "../controllers/leaderboard.controller";
import { auth } from "../middleware/auth";

const router = Router();

// GET /api/leaderboard
router.get("/", auth, getLeaderboardController);

export default router;
