// Tournaments service — business logic for tournament operations
// Create, join, bracket generation, progression

// backend/src/services/tournaments.service.ts

import prisma from "../lib/prisma";
import { TournamentStatus } from "@prisma/client";

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

// ─── Join (atomic transaction) ─────────────────────────────────────────────

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

    // 3. Check if tournament is now full → auto-start
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
    },
  });

  if (!tournament) {
    throw new TournamentError("Tournament not found", 404);
  }

  return tournament;
}
