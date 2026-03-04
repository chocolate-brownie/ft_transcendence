import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { Server as SocketIOServer } from "socket.io";
import { io as Client, Socket as ClientSocket } from "socket.io-client";
import http from "http";
import jwt from "jsonwebtoken";
import prisma from "../src/lib/prisma";
import { registerGameRoomHandlers } from "../src/socket/handlers/gameRoom.handlers";
import { gameRoomService } from "../src/socket/services/gameRoom.service";

const JWT_SECRET = process.env.JWT_SECRET || "test_secret";
const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

type TestUser = {
  id: number;
  email: string;
  username: string;
};

function waitForEvent<T = unknown>(
  socket: ClientSocket,
  eventName: string,
  timeoutMs = 3000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${eventName}`));
    }, timeoutMs);

    socket.once(eventName, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

describeDb("Socket Game Rooms", () => {
  let server: http.Server;
  let io: SocketIOServer;
  let port!: number;

  let player1: TestUser;
  let player2: TestUser;
  let outsider: TestUser;

  beforeAll(async () => {
    server = http.createServer();
    io = new SocketIOServer(server, { cors: { origin: "*" } });

    io.use((socket, next) => {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token || !token.startsWith("Bearer ")) {
        return next(new Error("No token provided"));
      }

      try {
        const decoded = jwt.verify(token.split(" ")[1], JWT_SECRET) as {
          id: number;
          username?: string;
          avatarUrl?: string;
        };

        socket.data.user = {
          id: decoded.id,
          username: decoded.username || "unknown",
          avatarUrl: decoded.avatarUrl,
        };

        next();
      } catch {
        next(new Error("Invalid token"));
      }
    });

    io.on("connection", (socket) => {
      registerGameRoomHandlers(io, socket);
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        port = typeof addr === "object" && addr ? addr.port : 0;
        resolve();
      });
    });

    player1 = await prisma.user.create({
      data: {
        email: "room_player1@test.com",
        username: "room_player1",
        passwordHash: "hash",
      },
    });

    player2 = await prisma.user.create({
      data: {
        email: "room_player2@test.com",
        username: "room_player2",
        passwordHash: "hash",
      },
    });

    outsider = await prisma.user.create({
      data: {
        email: "room_outsider@test.com",
        username: "room_outsider",
        passwordHash: "hash",
      },
    });
  });

  beforeEach(() => {
    gameRoomService.removePlayerFromAllRooms(player1.id);
    gameRoomService.removePlayerFromAllRooms(player2.id);
    gameRoomService.removePlayerFromAllRooms(outsider.id);
  });

  afterAll(async () => {
    await prisma.game.deleteMany({
      where: {
        OR: [
          { player1Id: player1.id },
          { player2Id: player1.id },
          { player1Id: player2.id },
          { player2Id: player2.id },
          { player1Id: outsider.id },
          { player2Id: outsider.id },
        ],
      },
    });

    await prisma.user.deleteMany({
      where: { id: { in: [player1.id, player2.id, outsider.id] } },
    });

    io.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  });

  it("joins room and notifies opponent", async () => {
    const game = await prisma.game.create({
      data: {
        player1Id: player1.id,
        player2Id: player2.id,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    const p1Token = jwt.sign({ id: player1.id, username: player1.username }, JWT_SECRET);
    const p2Token = jwt.sign({ id: player2.id, username: player2.username }, JWT_SECRET);

    const p1 = Client(`http://localhost:${port}`, {
      auth: { token: `Bearer ${p1Token}` },
    });
    const p2 = Client(`http://localhost:${port}`, {
      auth: { token: `Bearer ${p2Token}` },
    });

    try {
      await Promise.all([waitForEvent(p1, "connect"), waitForEvent(p2, "connect")]);

      const p1JoinedPromise = waitForEvent<{
        gameId: number;
        game: { yourSymbol: string };
      }>(p1, "room_joined");
      p1.emit("join_game_room", { gameId: game.id });
      const p1Joined = await p1JoinedPromise;

      expect(p1Joined.gameId).toBe(game.id);
      expect(p1Joined.game.yourSymbol).toBe("X");

      const p2JoinedPromise = waitForEvent<{
        gameId: number;
        game: { yourSymbol: string };
      }>(p2, "room_joined");
      const p1OpponentJoinedPromise = waitForEvent<{
        opponent: { id: number; username: string };
      }>(p1, "opponent_joined");

      p2.emit("join_game_room", { gameId: game.id });

      const [p2Joined, p1OpponentJoined] = await Promise.all([
        p2JoinedPromise,
        p1OpponentJoinedPromise,
      ]);

      expect(p2Joined.gameId).toBe(game.id);
      expect(p2Joined.game.yourSymbol).toBe("O");
      expect(p1OpponentJoined.opponent.id).toBe(player2.id);

      const playersInRoom = gameRoomService.getPlayersInRoom(game.id);
      expect(playersInRoom).toHaveLength(2);
    } finally {
      p1.close();
      p2.close();
    }
  });

  it("rejects join for non-existent game", async () => {
    const p1Token = jwt.sign({ id: player1.id, username: player1.username }, JWT_SECRET);

    const socket = Client(`http://localhost:${port}`, {
      auth: { token: `Bearer ${p1Token}` },
    });

    try {
      await waitForEvent(socket, "connect");
      const errorPromise = waitForEvent<{ message: string }>(socket, "error");

      socket.emit("join_game_room", { gameId: 999999 });
      const errorPayload = await errorPromise;

      expect(errorPayload.message).toBe("Game not found");
    } finally {
      socket.close();
    }
  });

  it("rejects join when user is not in game", async () => {
    const game = await prisma.game.create({
      data: {
        player1Id: player1.id,
        player2Id: player2.id,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    const outsiderToken = jwt.sign(
      { id: outsider.id, username: outsider.username },
      JWT_SECRET,
    );

    const outsiderSocket = Client(`http://localhost:${port}`, {
      auth: { token: `Bearer ${outsiderToken}` },
    });

    try {
      await waitForEvent(outsiderSocket, "connect");
      const errorPromise = waitForEvent<{ message: string }>(outsiderSocket, "error");

      outsiderSocket.emit("join_game_room", { gameId: game.id });
      const errorPayload = await errorPromise;

      expect(errorPayload.message).toBe("You are not in this game");
      expect(gameRoomService.getPlayersInRoom(game.id)).toHaveLength(0);
    } finally {
      outsiderSocket.close();
    }
  });

  it("emits opponent_left and opponent_disconnected", async () => {
    const game = await prisma.game.create({
      data: {
        player1Id: player1.id,
        player2Id: player2.id,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    const p1Token = jwt.sign({ id: player1.id, username: player1.username }, JWT_SECRET);
    const p2Token = jwt.sign({ id: player2.id, username: player2.username }, JWT_SECRET);

    const p1 = Client(`http://localhost:${port}`, {
      auth: { token: `Bearer ${p1Token}` },
    });
    const p2 = Client(`http://localhost:${port}`, {
      auth: { token: `Bearer ${p2Token}` },
    });

    try {
      await Promise.all([waitForEvent(p1, "connect"), waitForEvent(p2, "connect")]);

      p1.emit("join_game_room", { gameId: game.id });
      p2.emit("join_game_room", { gameId: game.id });
      await Promise.all([
        waitForEvent(p1, "room_joined"),
        waitForEvent(p2, "room_joined"),
      ]);

      const opponentLeftPromise = waitForEvent<{ userId: number }>(p2, "opponent_left");
      p1.emit("leave_game_room", { gameId: game.id });
      const leftPayload = await opponentLeftPromise;

      expect(leftPayload.userId).toBe(player1.id);
      expect(gameRoomService.getPlayersInRoom(game.id)).toHaveLength(1);

      const p1RejoinPromise = waitForEvent(p1, "room_joined");
      p1.emit("join_game_room", { gameId: game.id });
      await p1RejoinPromise;

      const opponentDisconnectedPromise = waitForEvent<{ userId: number }>(
        p2,
        "opponent_disconnected",
      );
      p1.close();
      const disconnectedPayload = await opponentDisconnectedPromise;

      expect(disconnectedPayload.userId).toBe(player1.id);
    } finally {
      p1.close();
      p2.close();
    }
  });

  it("updates socket ID on reconnection", async () => {
    const game = await prisma.game.create({
      data: {
        player1Id: player1.id,
        player2Id: player2.id,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    const p1Token = jwt.sign({ id: player1.id, username: player1.username }, JWT_SECRET);

    const p1First = Client(`http://localhost:${port}`, {
      auth: { token: `Bearer ${p1Token}` },
    });

    try {
      await waitForEvent(p1First, "connect");
      p1First.emit("join_game_room", { gameId: game.id });
      await waitForEvent(p1First, "room_joined");

      const firstSocketId = p1First.id;
      const playersAfterFirstJoin = gameRoomService.getPlayersInRoom(game.id);
      expect(playersAfterFirstJoin).toHaveLength(1);
      expect(playersAfterFirstJoin[0].socketId).toBe(firstSocketId);

      // Simulate reconnection with a new socket (same user, new socket ID)
      const p1Second = Client(`http://localhost:${port}`, {
        auth: { token: `Bearer ${p1Token}` },
      });

      try {
        await waitForEvent(p1Second, "connect");
        p1Second.emit("join_game_room", { gameId: game.id });
        await waitForEvent(p1Second, "room_joined");

        const secondSocketId = p1Second.id;
        expect(secondSocketId).not.toBe(firstSocketId);

        const playersAfterReconnect = gameRoomService.getPlayersInRoom(game.id);
        expect(playersAfterReconnect).toHaveLength(1);
        expect(playersAfterReconnect[0].socketId).toBe(secondSocketId);
      } finally {
        p1Second.close();
      }
    } finally {
      p1First.close();
    }
  });
});
