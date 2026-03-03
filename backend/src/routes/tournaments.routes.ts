
import { Router } from "express";
import { auth } from "../middleware/auth";
import {
  createTournamentController,
  joinTournamentController,
  getTournamentsController,
  getTournamentByIdController,
  recordMatchResultController,
  getTournamentBracketController,
} from "../controllers/tournaments.controller";

const router = Router();

// POST /api/tournaments
router.post("/", auth, createTournamentController);

// POST /api/tournaments/:id/join
router.post("/:id/join", auth, joinTournamentController);

// GET  /api/tournaments
router.get("/", auth, getTournamentsController);

// GET  /api/tournaments/:id
router.get("/:id", auth, getTournamentByIdController);

// GET  /api/tournaments/:id/bracket
router.get("/:id/bracket", auth, getTournamentBracketController);

// POST /api/tournaments/:id/matches/:matchId/result
router.post("/:id/matches/:matchId/result", auth, recordMatchResultController);

export default router;
