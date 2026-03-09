/* Game-over write path: atomically increment User.wins/losses/draws
   AI games are excluded from stats to keep leaderboard competitive-only.
   This files gets called automatically everytime a game ends (from gameOver.service.ts)*/

import prisma from "../lib/prisma";

export interface GameOverStatsPayload {
  gameId: number;
  winnerId: number | null;
  loserId: number | null;
  isDraw: boolean;
  boardSize: number;
  totalMoves: number;
  durationSeconds: number;
  finishedAt: Date;
  player1Id: number;
  player2Id: number | null;
  gameType: string;
}

/**
 * Issue #289 — Write path: update User win/loss/draw counters on game completion.
 *
 * Called automatically by processGameOver() in gameOver.service.ts every time a
 * game finishes. Atomically increments the relevant counter on each player's
 * User row using a Prisma transaction (both updates succeed or neither does).
 *
 * AI games are skipped entirely so bot wins don't inflate leaderboard rankings.
 * For draws, both player1Id and player2Id get +1 draw (winnerId/loserId are null
 * in draw games, which is why the payload carries the raw player IDs).
 */
export async function updateGameStatistics(payload: GameOverStatsPayload): Promise<void> {
  // Skip AI games — leaderboard tracks competitive play only
  if (payload.gameType === "AI") return;

  if (payload.isDraw) {
    // Both players get a draw increment
    const ops = [
      prisma.user.update({
        where: { id: payload.player1Id },
        data: { draws: { increment: 1 } },
      }),
    ];
    if (payload.player2Id) {
      ops.push(
        prisma.user.update({
          where: { id: payload.player2Id },
          data: { draws: { increment: 1 } },
        }),
      );
    }
    await prisma.$transaction(ops);
  } else if (payload.winnerId && payload.loserId) {
    // Winner gets +1 win, loser gets +1 loss
    await prisma.$transaction([
      prisma.user.update({
        where: { id: payload.winnerId },
        data: { wins: { increment: 1 } },
      }),
      prisma.user.update({
        where: { id: payload.loserId },
        data: { losses: { increment: 1 } },
      }),
    ]);
  }
}
