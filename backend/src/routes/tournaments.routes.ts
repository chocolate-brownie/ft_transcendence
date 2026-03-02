
import { Router } from "express";
import { auth } from "../middleware/auth";
import {
  createTournamentController,
  joinTournamentController,
  getTournamentsController,
  getTournamentByIdController,
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

export default router;
