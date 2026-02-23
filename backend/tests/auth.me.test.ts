// Issue #27 — Test Protected Routes
// Backend API tests using Jest + Supertest
// Tests GET /api/auth/me — the endpoint backing ProtectedRoute
// Prisma is mocked so no real database is needed

import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import jwt from "jsonwebtoken";

// ─── Mock Prisma (must be hoisted before any import of prisma) ───────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFindUnique = jest.fn<any>();
const mockQueryRaw = jest.fn();
const mockDisconnect = jest.fn();

jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  default: {
    user: {
      findUnique: mockFindUnique,
    },
    $queryRaw: mockQueryRaw,
    $disconnect: mockDisconnect,
  },
}));

// Dynamic imports AFTER mocking so the mock is in place
const { default: request } = await import("supertest");
const { app } = await import("../src/index.js");

// ─── Helpers ─────────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET!;

function makeToken(payload: object, options?: jwt.SignOptions): string {
  return jwt.sign(payload, JWT_SECRET, options);
}

const VALID_PAYLOAD = { id: 1, email: "alice@example.com", username: "alice" };

const buildFakeUser = (overrides = {}) => ({
  id: 1,
  email: "alice@example.com",
  username: "alice",
  displayName: null,
  avatarUrl: null,
  isOnline: true,
  wins: 3,
  losses: 1,
  draws: 0,
  createdAt: new Date("2024-01-01"),
  ...overrides,
});

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("GET /api/auth/me", () => {
  // ── Happy Path ────────────────────────────────────────────────────────────

  describe("Valid token (happy path)", () => {
    it("returns 200 with user data for a valid token", async () => {
      const token = makeToken(VALID_PAYLOAD);
      mockFindUnique.mockResolvedValue(buildFakeUser());

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("user");
    });

    it("returns correct user fields (no passwordHash)", async () => {
      const token = makeToken(VALID_PAYLOAD);
      mockFindUnique.mockResolvedValue(buildFakeUser());

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      const { user } = res.body;
      expect(user).toMatchObject({
        id: 1,
        email: "alice@example.com",
        username: "alice",
        isOnline: true,
        wins: 3,
        losses: 1,
        draws: 0,
      });
      expect(user).not.toHaveProperty("passwordHash");
    });

    it("queries the database by the userId from the JWT (fresh data)", async () => {
      const token = makeToken(VALID_PAYLOAD);
      mockFindUnique.mockResolvedValue(buildFakeUser());

      await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(mockFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } })
      );
    });
  });

  // ── No Token ─────────────────────────────────────────────────────────────

  describe("No token", () => {
    it("returns 401 when Authorization header is absent", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
    });

    it("does not call the database when no token is provided", async () => {
      await request(app).get("/api/auth/me");

      expect(mockFindUnique).not.toHaveBeenCalled();
    });
  });

  // ── Invalid Token ─────────────────────────────────────────────────────────

  describe("Invalid token", () => {
    it("returns 401 for a tampered token (one char changed)", async () => {
      const token = makeToken(VALID_PAYLOAD);
      const tampered = token.slice(0, -1) + (token.slice(-1) === "a" ? "b" : "a");

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${tampered}`);

      expect(res.status).toBe(401);
    });

    it("returns 401 for a completely fake token string", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer totally-not-a-jwt");

      expect(res.status).toBe(401);
    });

    it("returns 401 for a token signed with a wrong secret", async () => {
      const wrongToken = jwt.sign(VALID_PAYLOAD, "wrong-secret");

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${wrongToken}`);

      expect(res.status).toBe(401);
    });

    it("returns 401 when Authorization header is missing 'Bearer ' prefix", async () => {
      const token = makeToken(VALID_PAYLOAD);

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", token); // no "Bearer " prefix

      expect(res.status).toBe(401);
    });

    it("does not call the database for an invalid token", async () => {
      await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token");

      expect(mockFindUnique).not.toHaveBeenCalled();
    });
  });

  // ── Expired Token ─────────────────────────────────────────────────────────

  describe("Expired token", () => {
    it("returns 401 for an already-expired token", async () => {
      // expiresIn: 0 creates a token that expired at the moment of signing
      const expiredToken = makeToken(VALID_PAYLOAD, { expiresIn: 0 });

      // Wait 1100ms so the token's exp (in seconds) is definitely in the past
      await new Promise((r) => setTimeout(r, 1100));

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });

    it("returns a message that mentions token expiry", async () => {
      const expiredToken = makeToken(VALID_PAYLOAD, { expiresIn: 0 });
      await new Promise((r) => setTimeout(r, 1100));

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(res.body.message).toMatch(/expired/i);
    });
  });

  // ── User Not Found ────────────────────────────────────────────────────────

  describe("User deleted after token was issued", () => {
    it("returns 404 when the user no longer exists in the database", async () => {
      const token = makeToken(VALID_PAYLOAD);
      mockFindUnique.mockResolvedValue(null);

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message");
    });
  });

  // ── Database Error ────────────────────────────────────────────────────────

  describe("Database error", () => {
    it("returns 500 when the database throws", async () => {
      const token = makeToken(VALID_PAYLOAD);
      mockFindUnique.mockRejectedValue(new Error("DB connection lost"));

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(500);
    });
  });
});
