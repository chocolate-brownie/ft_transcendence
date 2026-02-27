import { Router } from "express";
import { auth } from "../middleware/auth";
import { createGame } from "../controllers/games.controller";

const router = Router();

// POST /api/games
router.post("/", auth, createGame);

// GET  /api/games/:id
// POST /api/games/:id/move

export default router;
