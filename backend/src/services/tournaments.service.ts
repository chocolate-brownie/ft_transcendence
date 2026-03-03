// Tournaments service — business logic for tournament operations
// Create, join, bracket generation, match recording, progression

import prisma from "../lib/prisma";
import { TournamentStatus } from "@prisma/client";
import { generateBracket, advanceWinner } from "./bracket.service";

// ─── Custom error with HTTP status ─────────────────────────────────────────

export class TournamentError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "TournamentError";
  }
}

// ─── Create ────────────────────────────────────────────────────────────────

export async function createTournament(
  name: string,
  maxPlayers: 4 | 8,
  createdById: number,
) {
  return prisma.tournament.create({
    data: {
      name,
      maxPlayers,
      createdById,
    },
    include: {
      creator: {
        select: { id: true, username: true },
      },
      participants: {
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true },
          },
        },
      },
    },
  });
}

// ─── Join (atomic transaction — also generates bracket when full) ──────────

export async function joinTournament(tournamentId: number, userId: number) {
  return prisma.$transaction(async (tx) => {
    // 1. Fetch tournament with current participants
    const tournament = await tx.tournament.findUnique({
      where: { id: tournamentId },
      include: { participants: true },
    });

    if (!tournament) {
      throw new TournamentError("Tournament not found", 404);
    }

    if (tournament.status !== "REGISTERING") {
      throw new TournamentError(
        "Tournament is no longer accepting players",
        409,
      );
    }

    if (tournament.participants.length >= tournament.maxPlayers) {
      throw new TournamentError("Tournament is full", 409);
    }

    const alreadyJoined = tournament.participants.some(
      (p) => p.userId === userId,
    );

    if (alreadyJoined) {
      throw new TournamentError("Already joined this tournament", 400);
    }

    // 2. Assign next seed (join order)
    const seed = tournament.participants.length + 1;

    const participant = await tx.tournamentParticipant.create({
      data: {
        tournamentId,
        userId,
        seed,
      },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    // 3. Check if tournament is now full → auto-start + generate bracket
    const newCount = seed;
    const isFull = newCount === tournament.maxPlayers;

    let updatedStatus: TournamentStatus = tournament.status;

    if (isFull) {
      await tx.tournament.update({
        where: { id: tournamentId },
        data: {
          status: "IN_PROGRESS",
          startedAt: new Date(),
          currentRound: 1,
        },
      });
      updatedStatus = "IN_PROGRESS";

      // Generate bracket inside the same transaction (atomic)
      await generateBracket(tournamentId, tx);
    }

    return {
      participant,
      tournamentInfo: {
        id: tournament.id,
        name: tournament.name,
        currentParticipants: newCount,
        maxPlayers: tournament.maxPlayers,
        status: updatedStatus,
      },
    };
  });
}

// ─── Record Match Result ───────────────────────────────────────────────────
// Validates everything, then delegates to bracket.service.advanceWinner

export async function recordMatchResult(
  tournamentId: number,
  matchId: number,
  winnerId: number,
  gameId: number,
  requestingUserId: number,
) {
  return prisma.$transaction(async (tx) => {
    // 1. Validate tournament
    const tournament = await tx.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new TournamentError("Tournament not found", 404);
    }
    if (tournament.status !== "IN_PROGRESS") {
      throw new TournamentError("Tournament is not in progress", 400);
    }

    // 2. Authorization — only the tournament creator can record results
    if (tournament.createdById !== requestingUserId) {
      throw new TournamentError(
        "Only the tournament creator can record match results",
        403,
      );
    }

    // 3. Validate match belongs to this tournament
    const match = await tx.tournamentMatch.findFirst({
      where: { id: matchId, tournamentId },
    });

    if (!match) {
      throw new TournamentError("Match not found in this tournament", 404);
    }
    if (match.winnerId !== null) {
      throw new TournamentError("Match result already recorded", 409);
    }
    if (match.player1Id === null || match.player2Id === null) {
      throw new TournamentError(
        "Both players must be determined before recording a result",
        400,
      );
    }

    // 4. Winner must be one of the two players
    if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
      throw new TournamentError(
        "Winner must be player1 or player2 of this match",
        400,
      );
    }

    // 5. Validate game exists, is finished, and winner matches
    const game = await tx.game.findUnique({ where: { id: gameId } });

    if (!game) {
      throw new TournamentError("Game not found", 404);
    }
    if (game.status !== "FINISHED") {
      throw new TournamentError("Game must be finished", 400);
    }
    if (game.winnerId !== winnerId) {
      throw new TournamentError(
        "Game winner does not match the specified winner",
        400,
      );
    }

    // 6. Record result + advance winner (bracket logic)
    const result = await advanceWinner(
      tournamentId,
      matchId,
      winnerId,
      gameId,
      tx,
    );

    return {
      message: "Match result recorded",
      match: result.match,
      nextMatch: result.nextMatch,
    };
  });
}

// ─── Get Tournament Bracket ────────────────────────────────────────────────

export async function getTournamentBracket(tournamentId: number) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });

  if (!tournament) {
    throw new TournamentError("Tournament not found", 404);
  }

  const matches = await prisma.tournamentMatch.findMany({
    where: { tournamentId },
    include: {
      player1: { select: { id: true, username: true, avatarUrl: true } },
      player2: { select: { id: true, username: true, avatarUrl: true } },
      winner: { select: { id: true, username: true } },
    },
    orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
  });

  return {
    tournamentId,
    name: tournament.name,
    status: tournament.status,
    totalRounds: Math.log2(tournament.maxPlayers),
    currentRound: tournament.currentRound,
    matches,
  };
}

// ─── List ──────────────────────────────────────────────────────────────────

export async function getTournaments(status?: TournamentStatus) {
  const where = status ? { status } : {};

  const tournaments = await prisma.tournament.findMany({
    where,
    include: {
      creator: {
        select: { id: true, username: true },
      },
      participants: {
        select: { id: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return tournaments.map((t) => ({
    id: t.id,
    name: t.name,
    maxPlayers: t.maxPlayers,
    currentParticipants: t.participants.length,
    status: t.status,
    currentRound: t.currentRound,
    createdAt: t.createdAt,
    creator: t.creator,
  }));
}

// ─── Get by ID ─────────────────────────────────────────────────────────────

export async function getTournamentById(id: number) {
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      creator: {
        select: { id: true, username: true },
      },
      participants: {
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true },
          },
        },
        orderBy: {
          seed: "asc",
        },
      },
      winner: {
        select: { id: true, username: true },
      },
      // Include bracket matches (Issue #156)
      matches: {
        include: {
          player1: { select: { id: true, username: true } },
          player2: { select: { id: true, username: true } },
          winner: { select: { id: true, username: true } },
        },
        orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
      },
    },
  });

  if (!tournament) {
    throw new TournamentError("Tournament not found", 404);
  }

  return tournament;
}
