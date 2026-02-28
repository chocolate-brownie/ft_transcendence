// Tests for GET /api/friends/status/:userId
// Uses Jest + Supertest with prisma and auth mocked

import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// ─── Mocks ────────────────────────────────────────────────────────────────

let currentUserId = 1;

// Mock Prisma friend.findFirst
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFindFirst = jest.fn<any>();
const mockDisconnect = jest.fn();

jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  default: {
    friend: {
      findFirst: mockFindFirst,
    },
    $disconnect: mockDisconnect,
  },
}));

// Mock auth middleware to inject a test user
jest.unstable_mockModule("../src/middleware/auth.js", () => ({
  auth: (req: any, _res: any, next: () => void) => {
    req.user = { id: currentUserId };
    next();
  },
}));

// Dynamic imports AFTER mocks
const { default: request } = await import("supertest");
const { app } = await import("../src/index.js");

// ─── Helpers ──────────────────────────────────────────────────────────────

const asStatus = (requesterId: number, addresseeId: number, status: "PENDING" | "ACCEPTED") => ({
  id: 42,
  requesterId,
  addresseeId,
  status,
});

// ─── Tests ────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  currentUserId = 1;
});

describe("GET /api/friends/status/:userId", () => {
  it("returns none when no relationship exists", async () => {
    mockFindFirst.mockResolvedValueOnce(null);

    const res = await request(app)
      .get("/api/friends/status/2")
      .set("Authorization", "Bearer dummy");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "none" });
  });

  it("returns pending_sent when current user sent the request", async () => {
    mockFindFirst.mockResolvedValueOnce(asStatus(1, 2, "PENDING"));

    const res = await request(app)
      .get("/api/friends/status/2")
      .set("Authorization", "Bearer dummy");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "pending_sent" });
  });

  it("returns pending_received when current user received the request", async () => {
    mockFindFirst.mockResolvedValueOnce(asStatus(2, 1, "PENDING"));

    const res = await request(app)
      .get("/api/friends/status/2")
      .set("Authorization", "Bearer dummy");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "pending_received" });
  });

  it("returns friends when status is accepted", async () => {
    mockFindFirst.mockResolvedValueOnce(asStatus(2, 1, "ACCEPTED"));

    const res = await request(app)
      .get("/api/friends/status/2")
      .set("Authorization", "Bearer dummy");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "friends" });
  });

  it("returns none (200) when requesting status with self", async () => {
    currentUserId = 5;

    const res = await request(app)
      .get("/api/friends/status/5")
      .set("Authorization", "Bearer dummy");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "none" });
    expect(mockFindFirst).not.toHaveBeenCalled();
  });
});
