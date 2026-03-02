// backend/src/types/tournament.ts

export interface CreateTournamentBody {
  name: string;
  maxPlayers: number;
}

// Re-export the Prisma enum for convenience in non-Prisma code
export type { TournamentStatus } from "@prisma/client";
