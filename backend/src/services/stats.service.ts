/* Issue:#289 Read path: per-user stats and paginated match history  */

import prisma from "../lib/prisma";

// ─── getUserStats ──────────────────────────────────────────────────────────

/**
 * Issue #289 — Serves GET /api/users/:id/stats.
 *
 * Returns a single user's aggregate statistics: total games, wins, losses,
 * draws, win rate, games played as player1 vs player2, a breakdown of games
 * by type (classic, custom, tournament, ai), and the timestamp of their most
 * recent completed game.
 *
 * Win/loss/draw totals are read directly from the User row (fast, single row).
 * The per-type breakdown and role counts require scanning the Game table for
 * all completed games involving this user.
 *
 * Returns null if the user does not exist (controller maps this to 404).
 */
export async function getUserStats(userId: number) {
  /*  Fetch the user from DB. If they don't exist, return null (the
      controller will turn this into a 404) */
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, wins: true, losses: true, draws: true },
  });
  if (!user) return null;

  // Fetch all completed games for this user (for mode breakdown + role counts)
  const games = await prisma.game.findMany({
    where: {
      status: { in: ["FINISHED", "DRAW"] },
      OR: [{ player1Id: userId }, { player2Id: userId }],
    },
    select: { gameType: true, player1Id: true, finishedAt: true },
    orderBy: { finishedAt: "desc" },
  });

  const totalGames = user.wins + user.losses + user.draws;
  const winRate = totalGames > 0 ? Math.round((user.wins / totalGames) * 10000) / 100 : 0;

  // Mode breakdown using actual GameType enum
  const gamesByType: Record<string, number> = {};
  let gamesAsPlayer1 = 0;
  let gamesAsPlayer2 = 0;

  for (const g of games) {
    const key = g.gameType.toLowerCase();
    gamesByType[key] = (gamesByType[key] ?? 0) + 1;
    if (g.player1Id === userId) gamesAsPlayer1++;
    else gamesAsPlayer2++;
  }

  return {
    userId: user.id,
    username: user.username,
    totalGames,
    wins: user.wins,
    losses: user.losses,
    draws: user.draws,
    winRate,
    gamesAsPlayer1,
    gamesAsPlayer2,
    gamesByType,
    lastGameAt: games[0]?.finishedAt ?? null,
  };
}

// ─── getUserMatches ────────────────────────────────────────────────────────

const PLAYER_SELECT = { id: true, username: true, avatarUrl: true };

/**
 * Issue #289 — Serves GET /api/users/:id/matches.
 *
 * Returns a paginated list of a user's completed games, most recent first.
 * Each match entry includes the game type, board size, result (win/loss/draw),
 * opponent info (username + avatar), duration in seconds, and finish timestamp.
 *
 * For AI games where player2 is null, the opponent is returned as
 * { id: null, username: "AI", avatarUrl: null }.
 *
 * Two queries run in parallel via Promise.all: one for the total count (used
 * to calculate totalPages) and one for the current page of games. Pagination
 * uses skip/take (offset-based).
 *
 * Returns null if the user does not exist (controller maps this to 404).
 */
export async function getUserMatches(userId: number, page: number, limit: number) {
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!userExists) return null;

  const where = {
    status: { in: ["FINISHED", "DRAW"] as ["FINISHED", "DRAW"] },
    OR: [{ player1Id: userId }, { player2Id: userId }],
  };

  const [total, games] = await Promise.all([
    prisma.game.count({ where }),
    prisma.game.findMany({
      where,
      orderBy: { finishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        player1: { select: PLAYER_SELECT },
        player2: { select: PLAYER_SELECT },
      },
    }),
  ]);

  const matches = games.map((g) => {
    const isPlayer1 = g.player1Id === userId;
    const opponent = isPlayer1
      ? (g.player2 ?? { id: null, username: "AI", avatarUrl: null })
      : g.player1;

    let result: "win" | "loss" | "draw";
    if (g.status === "DRAW") result = "draw";
    else if (g.winnerId === userId) result = "win";
    else result = "loss";

    const duration =
      g.finishedAt && g.createdAt
        ? Math.floor((g.finishedAt.getTime() - g.createdAt.getTime()) / 1000)
        : null;

    return {
      gameId: g.id,
      gameType: g.gameType.toLowerCase(),
      boardSize: g.boardSize,
      result,
      opponent,
      duration,
      finishedAt: g.finishedAt,
    };
  });

  return {
    matches,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
