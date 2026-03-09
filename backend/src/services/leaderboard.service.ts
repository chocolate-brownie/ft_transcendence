import prisma from "../lib/prisma";

/**
 * Issue #289 — Serves GET /api/leaderboard.
 *
 * Returns a global ranked list of players sorted by wins (descending), then
 * by win rate (descending) as a tiebreaker. Users who have never played a
 * completed game are excluded.
 *
 * Reads directly from the User.wins/losses/draws columns — this is a single
 * indexed query against the users table, avoiding the N+1 problem (the issue
 * spec's original approach would fire one Game query per user).
 *
 * Prisma cannot sort by computed fields (winRate = wins / totalGames), so
 * the primary sort (wins desc) is done in the DB query and the secondary
 * sort (winRate desc) is applied in JavaScript after fetching.
 *
 * Each entry includes a rank number (1, 2, 3...), user display info, and
 * the computed totalGames and winRate fields.
 */
export async function getLeaderboard(limit: number) {
  const users = await prisma.user.findMany({
    where: {
      OR: [{ wins: { gt: 0 } }, { losses: { gt: 0 } }, { draws: { gt: 0 } }],
    },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      wins: true,
      losses: true,
      draws: true,
    },
    orderBy: [{ wins: "desc" }],
    take: limit,
  });

  // Secondary sort by winRate (Prisma can't sort by computed fields)
  const ranked = users
    .map((u) => {
      const totalGames = u.wins + u.losses + u.draws;
      const winRate = totalGames > 0 ? Math.round((u.wins / totalGames) * 10000) / 100 : 0;
      return { ...u, totalGames, winRate };
    })
    .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate)
    .map((u, i) => ({ rank: i + 1, ...u }));

  return {
    leaderboard: ranked,
    generatedAt: new Date().toISOString(),
  };
}
