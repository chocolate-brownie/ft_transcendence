// Tournaments controller — handles HTTP request/response for tournament operations
// Calls tournaments.service.ts for business logic

import { Response } from "express";
import { TournamentStatus } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";
import {
  createTournament,
  joinTournament,
  getTournaments,
  getTournamentById,
  recordMatchResult,
  getTournamentBracket,
  TournamentError,
} from "../services/tournaments.service";

// ─── POST /api/tournaments ─────────────────────────────────────────────────

export async function createTournamentController(
  req: AuthRequest,
  res: Response,
) {
  try {
    const { name, maxPlayers } = req.body;

    // ── Validation ──
    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "Name is required" });
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 3 || trimmedName.length > 50) {
      return res
        .status(400)
        .json({ message: "Name must be between 3 and 50 characters" });
    }

    const mp = Number(maxPlayers);

    if (![4, 8].includes(mp)) {
      return res
        .status(400)
        .json({ message: "maxPlayers must be 4 or 8" });
    }

    const tournament = await createTournament(
      trimmedName,
      mp as 4 | 8,
      req.user.id,
    );

    return res.status(201).json(tournament);
  } catch (error) {
    console.error("[CreateTournament]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── POST /api/tournaments/:id/join ────────────────────────────────────────

export async function joinTournamentController(
  req: AuthRequest,
  res: Response,
) {
  try {
    const tournamentId = parseInt(req.params.id as string, 10);

    if (isNaN(tournamentId)) {
      return res.status(400).json({ message: "Invalid tournament ID" });
    }

    const result = await joinTournament(tournamentId, req.user.id);

    return res.status(200).json({
      message: "Successfully joined tournament",
      participant: result.participant,
      tournament: result.tournamentInfo,
    });
  } catch (error) {
    if (error instanceof TournamentError) {
      return res
        .status(error.statusCode)
        .json({ message: error.message });
    }
    console.error("[JoinTournament]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── GET /api/tournaments ──────────────────────────────────────────────────

export async function getTournamentsController(
  req: AuthRequest,
  res: Response,
) {
  try {
    const status = req.query.status as string | undefined;

    if (status) {
      const validStatuses = Object.values(TournamentStatus);

      if (!validStatuses.includes(status as TournamentStatus)) {
        return res.status(400).json({
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }
    }

    const tournaments = await getTournaments(
      status as TournamentStatus | undefined,
    );

    return res.status(200).json({ tournaments });
  } catch (error) {
    console.error("[GetTournaments]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── GET /api/tournaments/:id ──────────────────────────────────────────────

export async function getTournamentByIdController(
  req: AuthRequest,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id as string, 10);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid tournament ID" });
    }

    const tournament = await getTournamentById(id);

    return res.status(200).json(tournament);
  } catch (error) {
    if (error instanceof TournamentError) {
      return res
        .status(error.statusCode)
        .json({ message: error.message });
    }
    console.error("[GetTournamentById]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── POST /api/tournaments/:id/matches/:matchId/result ─────────────────────
// Records a match result and advances the winner (Issue #156)

export async function recordMatchResultController(
  req: AuthRequest,
  res: Response,
) {
  try {
    const tournamentId = parseInt(req.params.id as string, 10);
    const matchId = parseInt(req.params.matchId as string, 10);

    if (isNaN(tournamentId) || isNaN(matchId)) {
      return res
        .status(400)
        .json({ message: "Invalid tournament ID or match ID" });
    }

    const { winnerId, gameId } = req.body;

    // ── Validation ──
    if (!winnerId || typeof winnerId !== "number") {
      return res
        .status(400)
        .json({ message: "winnerId is required and must be a number" });
    }

    if (!gameId || typeof gameId !== "number") {
      return res
        .status(400)
        .json({ message: "gameId is required and must be a number" });
    }

    const result = await recordMatchResult(
      tournamentId,
      matchId,
      winnerId,
      gameId,
      req.user.id,
    );

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof TournamentError) {
      return res
        .status(error.statusCode)
        .json({ message: error.message });
    }
    console.error("[RecordMatchResult]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── GET /api/tournaments/:id/bracket ──────────────────────────────────────
// Returns the full bracket with all matches (Issue #156)

export async function getTournamentBracketController(
  req: AuthRequest,
  res: Response,
) {
  try {
    const tournamentId = parseInt(req.params.id as string, 10);

    if (isNaN(tournamentId)) {
      return res.status(400).json({ message: "Invalid tournament ID" });
    }

    const bracket = await getTournamentBracket(tournamentId);

    return res.status(200).json(bracket);
  } catch (error) {
    if (error instanceof TournamentError) {
      return res
        .status(error.statusCode)
        .json({ message: error.message });
    }
    console.error("[GetTournamentBracket]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
