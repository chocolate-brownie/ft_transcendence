import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import jwt from "jsonwebtoken";

const mockFindMany = jest.fn<() => Promise<object[]>>();
const mockQueryRaw = jest.fn();
const mockDisconnect = jest.fn();

jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  default: {
    user: {
      findMany: mockFindMany,
    },
    $queryRaw: mockQueryRaw,
    $disconnect: mockDisconnect,
  },
}));

const { default: request } = await import("supertest");
const { app } = await import("../src/index.js");

const JWT_SECRET = process.env.JWT_SECRET!;

function makeToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET);
}

describe("GET /api/users/search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null avatarUrl for users with default avatar", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 10,
        username: "alice",
        displayName: "Alice",
        avatarUrl: "/uploads/avatars/default.png",
        isOnline: false,
      },
      {
        id: 11,
        username: "bob",
        displayName: "Bob",
        avatarUrl: "/uploads/avatars/11-custom.png",
        isOnline: true,
      },
    ]);

    const token = makeToken({ id: 1, username: "requester" });
    const res = await request(app)
      .get("/api/users/search?q=a")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      expect.objectContaining({
        id: 10,
        avatarUrl: null,
      }),
      expect.objectContaining({
        id: 11,
        avatarUrl: "/uploads/avatars/11-custom.png",
      }),
    ]);
  });
});
