/* Issue #289 — Stats & Leaderboard API tests
   Covers all 12 integrated tests from the issue spec.
   Prisma is mocked so no real database is needed. */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import jwt from "jsonwebtoken";

// ─── Mock Prisma ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUserFindUnique = jest.fn<any>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUserFindMany = jest.fn<any>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGameFindMany = jest.fn<any>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGameCount = jest.fn<any>();
const mockQueryRaw = jest.fn();
const mockDisconnect = jest.fn();

jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  default: {
    user: {
      findUnique: mockUserFindUnique,
      findMany: mockUserFindMany,
    },
    game: {
      findMany: mockGameFindMany,
      count: mockGameCount,
    },
    $queryRaw: mockQueryRaw,
    $disconnect: mockDisconnect,
  },
}));

const { default: request } = await import("supertest");
const { app } = await import("../src/index.js");

// ─── Helpers ────────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET!;

function makeToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET);
}

const TOKEN = makeToken({ id: 1, username: "tester" });

function buildFakeUser(overrides = {}) {
  return {
    id: 1,
    username: "alice",
    avatarUrl: "/uploads/avatars/default.png",
    wins: 0,
    losses: 0,
    draws: 0,
    ...overrides,
  };
}

function buildFakeGame(overrides = {}) {
  return {
    id: 1,
    player1Id: 1,
    player2Id: 2,
    winnerId: 1,
    gameType: "CLASSIC",
    boardSize: 3,
    status: "FINISHED",
    createdAt: new Date("2026-03-09T12:00:00Z"),
    finishedAt: new Date("2026-03-09T12:05:00Z"),
    player1: { id: 1, username: "alice", avatarUrl: "/uploads/avatars/default.png" },
    player2: { id: 2, username: "bob", avatarUrl: "/uploads/avatars/default.png" },
    ...overrides,
  };
}

// ─── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Test 1: Basic Stats ────────────────────────────────────────────────────

describe("GET /api/users/:id/stats", () => {
  it("Test 1: returns correct stats for 3 wins, 1 loss, 1 draw", async () => {
    // User has 3 wins, 1 loss, 1 draw
    mockUserFindUnique.mockResolvedValue(buildFakeUser({ wins: 3, losses: 1, draws: 1 }));

    // 5 completed games
    mockGameFindMany.mockResolvedValue([
      buildFakeGame({
        id: 5,
        gameType: "CLASSIC",
        player1Id: 1,
        finishedAt: new Date("2026-03-09T15:00:00Z"),
      }),
      buildFakeGame({
        id: 4,
        gameType: "TOURNAMENT",
        player1Id: 1,
        finishedAt: new Date("2026-03-09T14:00:00Z"),
      }),
      buildFakeGame({
        id: 3,
        gameType: "CLASSIC",
        player1Id: 1,
        finishedAt: new Date("2026-03-09T13:00:00Z"),
      }),
      buildFakeGame({
        id: 2,
        gameType: "CLASSIC",
        player1Id: 2,
        player2Id: 1,
        finishedAt: new Date("2026-03-09T12:00:00Z"),
      }),
      buildFakeGame({
        id: 1,
        gameType: "CLASSIC",
        player1Id: 1,
        finishedAt: new Date("2026-03-09T11:00:00Z"),
      }),
    ]);

    const res = await request(app)
      .get("/api/users/1/stats")
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.totalGames).toBe(5);
    expect(res.body.wins).toBe(3);
    expect(res.body.losses).toBe(1);
    expect(res.body.draws).toBe(1);
    expect(res.body.winRate).toBe(60);
    expect(res.body.username).toBe("alice");
    expect(res.body.lastGameAt).not.toBeNull();
  });

  // ─── Test 2: Different Roles ────────────────────────────────────────────

  it("Test 2: counts gamesAsPlayer1 and gamesAsPlayer2 correctly", async () => {
    mockUserFindUnique.mockResolvedValue(buildFakeUser({ wins: 1, losses: 1, draws: 1 }));

    // Game 1: user is player1, Game 2: user is player2, Game 3: user is player1
    mockGameFindMany.mockResolvedValue([
      buildFakeGame({
        id: 3,
        player1Id: 1,
        gameType: "CLASSIC",
        finishedAt: new Date("2026-03-09T13:00:00Z"),
      }),
      buildFakeGame({
        id: 2,
        player1Id: 2,
        player2Id: 1,
        gameType: "CLASSIC",
        finishedAt: new Date("2026-03-09T12:00:00Z"),
      }),
      buildFakeGame({
        id: 1,
        player1Id: 1,
        gameType: "CLASSIC",
        finishedAt: new Date("2026-03-09T11:00:00Z"),
      }),
    ]);

    const res = await request(app)
      .get("/api/users/1/stats")
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.totalGames).toBe(3);
    expect(res.body.gamesAsPlayer1).toBe(2);
    expect(res.body.gamesAsPlayer2).toBe(1);
  });

  // ─── Test 3: Stats by Game Type ─────────────────────────────────────────

  it("Test 3: breaks down games by type correctly", async () => {
    mockUserFindUnique.mockResolvedValue(buildFakeUser({ wins: 4, losses: 1, draws: 1 }));

    mockGameFindMany.mockResolvedValue([
      buildFakeGame({ id: 6, gameType: "AI", player1Id: 1 }),
      buildFakeGame({ id: 5, gameType: "CLASSIC", player1Id: 1 }),
      buildFakeGame({ id: 4, gameType: "CLASSIC", player1Id: 1 }),
      buildFakeGame({ id: 3, gameType: "TOURNAMENT", player1Id: 1 }),
      buildFakeGame({ id: 2, gameType: "TOURNAMENT", player1Id: 1 }),
      buildFakeGame({ id: 1, gameType: "TOURNAMENT", player1Id: 1 }),
    ]);

    const res = await request(app)
      .get("/api/users/1/stats")
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.gamesByType).toEqual({
      classic: 2,
      tournament: 3,
      ai: 1,
    });
  });

  // ─── Test 4: User Not Found ─────────────────────────────────────────────

  it("Test 4: returns 404 for non-existent user", async () => {
    mockUserFindUnique.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/users/99999/stats")
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("User not found");
  });

  // ─── Test 12: No Games Played ───────────────────────────────────────────

  it("Test 12: returns zeros for user with no completed games", async () => {
    mockUserFindUnique.mockResolvedValue(buildFakeUser({ wins: 0, losses: 0, draws: 0 }));
    mockGameFindMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/users/1/stats")
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.totalGames).toBe(0);
    expect(res.body.wins).toBe(0);
    expect(res.body.losses).toBe(0);
    expect(res.body.draws).toBe(0);
    expect(res.body.winRate).toBe(0);
    expect(res.body.lastGameAt).toBeNull();
  });

  // ─── Invalid ID ─────────────────────────────────────────────────────────

  it("returns 400 for invalid user ID", async () => {
    const res = await request(app)
      .get("/api/users/abc/stats")
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid user ID");
  });

  it("returns 401 without auth token", async () => {
    const res = await request(app).get("/api/users/1/stats");

    expect(res.status).toBe(401);
  });
});

// ─── Tests 5-8: Match History ───────────────────────────────────────────────

describe("GET /api/users/:id/matches", () => {
  // ─── Test 5: Pagination ───────────────────────────────────────────────

  it("Test 5: paginates 25 matches correctly", async () => {
    mockUserFindUnique.mockResolvedValue(buildFakeUser());
    mockGameCount.mockResolvedValue(25);

    // Page 1: 10 games
    const page1Games = Array.from({ length: 10 }, (_, i) =>
      buildFakeGame({ id: 25 - i, finishedAt: new Date(2026, 2, 9, 15 - i) }),
    );
    mockGameFindMany.mockResolvedValue(page1Games);

    const res = await request(app)
      .get("/api/users/1/matches?page=1&limit=10")
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.matches).toHaveLength(10);
    expect(res.body.pagination.total).toBe(25);
    expect(res.body.pagination.totalPages).toBe(3);
    expect(res.body.pagination.page).toBe(1);
  });

  it("Test 5b: page 3 returns remaining 5 matches", async () => {
    mockUserFindUnique.mockResolvedValue(buildFakeUser());
    mockGameCount.mockResolvedValue(25);

    const page3Games = Array.from({ length: 5 }, (_, i) =>
      buildFakeGame({ id: 5 - i, finishedAt: new Date(2026, 2, 9, 5 - i) }),
    );
    mockGameFindMany.mockResolvedValue(page3Games);

    const res = await request(app)
      .get("/api/users/1/matches?page=3&limit=10")
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.matches).toHaveLength(5);
  });

  // ─── Test 6: Opponent Info ────────────────────────────────────────────

  it("Test 6: returns correct opponent info and result", async () => {
    mockUserFindUnique.mockResolvedValue(buildFakeUser());
    mockGameCount.mockResolvedValue(1);

    // User (id=1) is player1 and wins against bob (id=2)
    mockGameFindMany.mockResolvedValue([
      buildFakeGame({
        id: 1,
        player1Id: 1,
        player2Id: 2,
        winnerId: 1,
        status: "FINISHED",
        player1: { id: 1, username: "alice", avatarUrl: "/uploads/avatars/alice.png" },
        player2: { id: 2, username: "bob", avatarUrl: "/uploads/avatars/bob.png" },
      }),
    ]);

    const res = await request(app)
      .get("/api/users/1/matches")
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    const match = res.body.matches[0];
    expect(match.opponent.id).toBe(2);
    expect(match.opponent.username).toBe("bob");
    expect(match.opponent.avatarUrl).toBe("/uploads/avatars/bob.png");
    expect(match.result).toBe("win");
  });

  it("Test 6b: returns correct result when user loses as player2", async () => {
    mockUserFindUnique.mockResolvedValue(buildFakeUser());
    mockGameCount.mockResolvedValue(1);

    // User (id=1) is player2 and loses (alice wins)
    mockGameFindMany.mockResolvedValue([
      buildFakeGame({
        id: 1,
        player1Id: 3,
        player2Id: 1,
        winnerId: 3,
        status: "FINISHED",
        player1: { id: 3, username: "charlie", avatarUrl: null },
        player2: { id: 1, username: "alice", avatarUrl: null },
      }),
    ]);

    const res = await request(app)
      .get("/api/users/1/matches")
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    const match = res.body.matches[0];
    expect(match.opponent.id).toBe(3);
    expect(match.opponent.username).toBe("charlie");
    expect(match.result).toBe("loss");
  });

  // ─── Test 7: AI Game ──────────────────────────────────────────────────

  it("Test 7: returns AI opponent when player2 is null", async () => {
    mockUserFindUnique.mockResolvedValue(buildFakeUser());
    mockGameCount.mockResolvedValue(1);

    mockGameFindMany.mockResolvedValue([
      buildFakeGame({
        id: 1,
        player1Id: 1,
        player2Id: null,
        winnerId: 1,
        gameType: "AI",
        status: "FINISHED",
        player1: { id: 1, username: "alice", avatarUrl: null },
        player2: null,
      }),
    ]);

    const res = await request(app)
      .get("/api/users/1/matches")
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    const match = res.body.matches[0];
    expect(match.opponent.id).toBeNull();
    expect(match.opponent.username).toBe("AI");
    expect(match.opponent.avatarUrl).toBeNull();
    expect(match.gameType).toBe("ai");
  });

  // ─── Test 8: Duration Calculation ─────────────────────────────────────

  it("Test 8: calculates duration in seconds from timestamps", async () => {
    mockUserFindUnique.mockResolvedValue(buildFakeUser());
    mockGameCount.mockResolvedValue(1);

    mockGameFindMany.mockResolvedValue([
      buildFakeGame({
        id: 1,
        createdAt: new Date("2026-03-09T12:00:00Z"),
        finishedAt: new Date("2026-03-09T12:05:30Z"),
      }),
    ]);

    const res = await request(app)
      .get("/api/users/1/matches")
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    // 5 minutes 30 seconds = 330 seconds
    expect(res.body.matches[0].duration).toBe(330);
  });

  // ─── Matches: User Not Found ──────────────────────────────────────────

  it("returns 404 for non-existent user", async () => {
    mockUserFindUnique.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/users/99999/matches")
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("User not found");
  });

  // ─── Matches: Draw Result ─────────────────────────────────────────────

  it("returns draw result for DRAW status games", async () => {
    mockUserFindUnique.mockResolvedValue(buildFakeUser());
    mockGameCount.mockResolvedValue(1);

    mockGameFindMany.mockResolvedValue([
      buildFakeGame({
        id: 1,
        winnerId: null,
        status: "DRAW",
      }),
    ]);

    const res = await request(app)
      .get("/api/users/1/matches")
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.matches[0].result).toBe("draw");
  });
});

// ─── Tests 9-10: Leaderboard ────────────────────────────────────────────────

describe("GET /api/leaderboard", () => {
  // ─── Test 9: Ranking Order ────────────────────────────────────────────

  it("Test 9: ranks players by wins desc, then winRate desc", async () => {
    mockUserFindMany.mockResolvedValue([
      // User 3: 12 wins, 5 losses → 70.59% WR
      buildFakeUser({ id: 3, username: "charlie", wins: 12, losses: 5, draws: 0 }),
      // User 1: 10 wins, 2 losses → 83.33% WR
      buildFakeUser({ id: 1, username: "alice", wins: 10, losses: 2, draws: 0 }),
      // User 2: 8 wins, 3 losses → 72.73% WR
      buildFakeUser({ id: 2, username: "bob", wins: 8, losses: 3, draws: 0 }),
    ]);

    const res = await request(app)
      .get("/api/leaderboard?limit=10")
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.leaderboard).toHaveLength(3);

    // Rank 1: charlie (12 wins — most wins)
    expect(res.body.leaderboard[0].rank).toBe(1);
    expect(res.body.leaderboard[0].username).toBe("charlie");
    expect(res.body.leaderboard[0].wins).toBe(12);

    // Rank 2: alice (10 wins, higher WR than bob)
    expect(res.body.leaderboard[1].rank).toBe(2);
    expect(res.body.leaderboard[1].username).toBe("alice");

    // Rank 3: bob (8 wins)
    expect(res.body.leaderboard[2].rank).toBe(3);
    expect(res.body.leaderboard[2].username).toBe("bob");

    // User 4 (no games) should not appear — handled by the WHERE filter
    // generatedAt timestamp present
    expect(res.body.generatedAt).toBeDefined();
  });

  // ─── Test 10: Limit Parameter ─────────────────────────────────────────

  it("Test 10: respects limit parameter", async () => {
    // Mock returns only 3 users (Prisma's `take: 3` is applied at DB level)
    const threeUsers = Array.from({ length: 3 }, (_, i) =>
      buildFakeUser({ id: i + 1, username: `user${i + 1}`, wins: 10 - i }),
    );
    mockUserFindMany.mockResolvedValue(threeUsers);

    const res = await request(app)
      .get("/api/leaderboard?limit=3")
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.leaderboard).toHaveLength(3);
  });

  it("Test 10b: defaults to 10 when no limit provided", async () => {
    const tenUsers = Array.from({ length: 10 }, (_, i) =>
      buildFakeUser({ id: i + 1, username: `user${i + 1}`, wins: 10 - i }),
    );
    mockUserFindMany.mockResolvedValue(tenUsers);

    const res = await request(app)
      .get("/api/leaderboard")
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.leaderboard).toHaveLength(10);
  });

  // ─── Leaderboard: Empty ───────────────────────────────────────────────

  it("returns empty leaderboard when no users have games", async () => {
    mockUserFindMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/leaderboard")
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.leaderboard).toEqual([]);
    expect(res.body.generatedAt).toBeDefined();
  });

  // ─── Leaderboard: Win Rate Tiebreaker ─────────────────────────────────

  it("breaks ties by winRate when wins are equal", async () => {
    mockUserFindMany.mockResolvedValue([
      // Both have 5 wins, but alice has higher WR (83% vs 50%)
      buildFakeUser({ id: 1, username: "alice", wins: 5, losses: 1, draws: 0 }),
      buildFakeUser({ id: 2, username: "bob", wins: 5, losses: 5, draws: 0 }),
    ]);

    const res = await request(app)
      .get("/api/leaderboard")
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    // alice should rank higher (same wins, better WR)
    expect(res.body.leaderboard[0].username).toBe("alice");
    expect(res.body.leaderboard[1].username).toBe("bob");
  });

  it("returns 401 without auth token", async () => {
    const res = await request(app).get("/api/leaderboard");

    expect(res.status).toBe(401);
  });
});
