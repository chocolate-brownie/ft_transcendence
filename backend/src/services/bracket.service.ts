// Bracket service — bracket generation & match progression logic
// Handles seeding, match creation, winner advancement, round/tournament completion

import prisma from "../lib/prisma";
import type { PrismaClient } from "@prisma/client";

// ─── Transaction client type ───────────────────────────────────────────────
// Matches PrismaClient but without connection/transaction methods
// so the same functions work with both `prisma` and `tx` inside $transaction

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// ─── Seed Order Generation ─────────────────────────────────────────────────
// Produces standard bracket seeding so top seeds meet late in the tournament.
//   4 players → [1, 2]       → matches: 1v4, 2v3
//   8 players → [1, 4, 2, 3] → matches: 1v8, 4v5, 2v7, 3v6

function generateSeedOrder(numPlayers: number): number[] {
  let seeds = [1];

  while (seeds.length < numPlayers / 2) {
    const sum = seeds.length * 2 + 1;
    const next: number[] = [];
    for (const s of seeds) {
      next.push(s, sum - s);
    }
    seeds = next;
  }

  return seeds;
}

// ─── Generate Bracket ──────────────────────────────────────────────────────
// Creates all TournamentMatch rows for every round.
// Round 1 has actual players; later rounds are placeholders (player = null).

export async function generateBracket(
  tournamentId: number,
  tx: TxClient = prisma,
): Promise<void> {
  const tournament = await tx.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      participants: { orderBy: { seed: "asc" } },
    },
  });

  if (!tournament) throw new Error("Tournament not found");

  const { maxPlayers, participants } = tournament;
  const totalRounds = Math.log2(maxPlayers);

  // Map seed number → userId  (seed is 1-based)
  const seedToUser = new Map<number, number>();
  for (const p of participants) {
    seedToUser.set(p.seed, p.userId);
  }

  const allMatches: Array<{
    tournamentId: number;
    round: number;
    matchNumber: number;
    player1Id: number | null;
    player2Id: number | null;
  }> = [];

  // ── Round 1: pair players with standard bracket seeding ──
  const seedOrder = generateSeedOrder(maxPlayers);

  for (let i = 0; i < seedOrder.length; i++) {
    const topSeed = seedOrder[i];
    const bottomSeed = maxPlayers + 1 - topSeed;

    allMatches.push({
      tournamentId,
      round: 1,
      matchNumber: i + 1,
      player1Id: seedToUser.get(topSeed) ?? null,
      player2Id: seedToUser.get(bottomSeed) ?? null,
    });
  }

  // ── Rounds 2+: placeholder matches (players TBD) ──
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = maxPlayers / Math.pow(2, round);

    for (let m = 1; m <= matchesInRound; m++) {
      allMatches.push({
        tournamentId,
        round,
        matchNumber: m,
        player1Id: null,
        player2Id: null,
      });
    }
  }

  await tx.tournamentMatch.createMany({ data: allMatches });
}

// ─── Advance Winner ────────────────────────────────────────────────────────
// Records match result, eliminates loser, advances winner to next round,
// checks if round / tournament is complete.

export async function advanceWinner(
  tournamentId: number,
  matchId: number,
  winnerId: number,
  gameId: number,
  tx: TxClient = prisma,
) {
  // 1. Record result on current match
  const match = await tx.tournamentMatch.update({
    where: { id: matchId },
    data: {
      winnerId,
      gameId,
      completedAt: new Date(),
    },
  });

  // 2. Mark loser as eliminated
  const loserId =
    match.player1Id === winnerId ? match.player2Id : match.player1Id;

  if (loserId) {
    await tx.tournamentParticipant.updateMany({
      where: { tournamentId, userId: loserId },
      data: { eliminatedInRound: match.round },
    });
  }

  // 3. Advance winner to next match (unless this was the finals)
  const tournament = await tx.tournament.findUnique({
    where: { id: tournamentId },
  });

  if (!tournament) throw new Error("Tournament not found");

  const totalRounds = Math.log2(tournament.maxPlayers);
  let nextMatch = null;

  if (match.round < totalRounds) {
    //  R1M1 → R2M1 player1    R1M2 → R2M1 player2
    //  R1M3 → R2M2 player1    R1M4 → R2M2 player2  etc.
    const nextRound = match.round + 1;
    const nextMatchNumber = Math.ceil(match.matchNumber / 2);
    const isPlayer1Slot = match.matchNumber % 2 === 1;

    const updateData = isPlayer1Slot
      ? { player1Id: winnerId }
      : { player2Id: winnerId };

    nextMatch = await tx.tournamentMatch.update({
      where: {
        tournamentId_round_matchNumber: {
          tournamentId,
          round: nextRound,
          matchNumber: nextMatchNumber,
        },
      },
      data: updateData,
    });
  }

  // 4. Check if the round (and possibly the tournament) is complete
  await checkRoundCompletion(tournamentId, match.round, totalRounds, tx);

  return { match, nextMatch };
}

// ─── Round / Tournament Completion ─────────────────────────────────────────

async function checkRoundCompletion(
  tournamentId: number,
  round: number,
  totalRounds: number,
  tx: TxClient,
): Promise<void> {
  const matchesInRound = await tx.tournamentMatch.findMany({
    where: { tournamentId, round },
  });

  const allComplete = matchesInRound.every((m) => m.winnerId !== null);
  if (!allComplete) return;

  if (round === totalRounds) {
    // Finals just completed → declare champion
    const finalsMatch = matchesInRound[0];

    await tx.tournament.update({
      where: { id: tournamentId },
      data: {
        status: "FINISHED",
        winnerId: finalsMatch.winnerId,
        finishedAt: new Date(),
      },
    });
  } else {
    // Advance tournament to next round
    await tx.tournament.update({
      where: { id: tournamentId },
      data: { currentRound: round + 1 },
    });
  }
}
