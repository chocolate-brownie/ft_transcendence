import type { Prisma } from "@prisma/client";

// ─── Request body ──────────────────────────────────────────────────────────

export interface CreateTournamentBody {
  name: string;
  maxPlayers: number;
}

// ─── Prisma-derived types ──────────────────────────────────────────────────

// Full tournament shape returned by getTournamentById
export type TournamentWithParticipants = Prisma.TournamentGetPayload<{
  include: {
    creator: { select: { id: true; username: true } };
    participants: {
      include: { user: { select: { id: true; username: true; avatarUrl: true } } };
    };
    winner: { select: { id: true; username: true } };
  };
}>;

// Re-export the Prisma enum for convenience in non-Prisma code
export type { TournamentStatus } from "@prisma/client";

// ─── Spec mapping ──────────────────────────────────────────────────────────
// Issue spec        → Implementation
// 'pending'         → REGISTERING
// 'active'          → IN_PROGRESS
// 'completed'       → FINISHED
// completedAt       → finishedAt
// eliminatedInRound → eliminatedInRound (renamed)
