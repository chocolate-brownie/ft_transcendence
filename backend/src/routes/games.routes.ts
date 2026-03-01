import { Router } from "express";
import { auth } from "../middleware/auth";
import { createGame, makeMove, getGameById } from "../controllers/games.controller";

const router = Router();

// POST /api/games
router.post("/", auth, createGame);

// GET  /api/games/:id
router.get("/:id", auth, getGameById);

// POST /api/games/:id/move
router.post("/:id/move", auth, makeMove);

export default router;
