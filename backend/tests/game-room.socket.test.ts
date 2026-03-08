import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { Server as SocketIOServer } from "socket.io";
import { io as Client, Socket as ClientSocket } from "socket.io-client";
import http from "http";
import jwt from "jsonwebtoken";
import prisma from "../src/lib/prisma";
import {
  registerGameRoomHandlers,
  handleGameRoomDisconnect,
} from "../src/socket/handlers/gameRoom.handlers";
import { gameRoomService } from "../src/socket/services/gameRoom.service";
import { createOrGetRematchInDb } from "../src/services/games.service";

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

function expectNoEvent(
  socket: ClientSocket,
  eventName: string,
  waitMs = 300,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const handler = () => {
      clearTimeout(timer);
      reject(new Error(`Unexpected event received: ${eventName}`));
    };

    const timer = setTimeout(() => {
      socket.off(eventName, handler);
      resolve();
    }, waitMs);

    socket.once(eventName, handler);
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
      socket.on("disconnect", () => {
        handleGameRoomDisconnect(io, socket);
      });
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

  beforeEach(async () => {
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
        opponent: {
          id: number;
          username: string;
          role: "player1" | "player2";
          symbol: "X" | "O";
        };
      }>(p1, "opponent_joined");

      p2.emit("join_game_room", { gameId: game.id });

      const [p2Joined, p1OpponentJoined] = await Promise.all([
        p2JoinedPromise,
        p1OpponentJoinedPromise,
      ]);

      expect(p2Joined.gameId).toBe(game.id);
      expect(p2Joined.game.yourSymbol).toBe("O");
      expect(p1OpponentJoined.opponent.id).toBe(player2.id);
      expect(p1OpponentJoined.opponent.role).toBe("player2");
      expect(p1OpponentJoined.opponent.symbol).toBe("O");

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

      expect(errorPayload.message).toMatch(/Unauthorized|not a participant/i);
      expect(gameRoomService.getPlayersInRoom(game.id)).toHaveLength(0);
    } finally {
      outsiderSocket.close();
    }
  });

  it("emits opponent_joined avatar from DB instead of JWT payload", async () => {
    const freshAvatar = "/uploads/avatars/player2-fresh.png";
    await prisma.user.update({
      where: { id: player2.id },
      data: { avatarUrl: freshAvatar },
    });

    const game = await prisma.game.create({
      data: {
        player1Id: player1.id,
        player2Id: player2.id,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    const p1Token = jwt.sign({ id: player1.id, username: player1.username }, JWT_SECRET);
    const p2Token = jwt.sign(
      {
        id: player2.id,
        username: player2.username,
        avatarUrl: "/uploads/avatars/player2-stale-from-token.png",
      },
      JWT_SECRET,
    );

    const p1 = Client(`http://localhost:${port}`, {
      auth: { token: `Bearer ${p1Token}` },
    });
    const p2 = Client(`http://localhost:${port}`, {
      auth: { token: `Bearer ${p2Token}` },
    });

    try {
      await Promise.all([waitForEvent(p1, "connect"), waitForEvent(p2, "connect")]);

      p1.emit("join_game_room", { gameId: game.id });
      await waitForEvent(p1, "room_joined");

      const opponentJoinedPromise = waitForEvent<{
        opponent: { id: number; username: string; avatarUrl: string | null };
      }>(p1, "opponent_joined");

      p2.emit("join_game_room", { gameId: game.id });
      const opponentJoinedPayload = await opponentJoinedPromise;

      expect(opponentJoinedPayload.opponent.id).toBe(player2.id);
      expect(opponentJoinedPayload.opponent.avatarUrl).toBe(freshAvatar);
    } finally {
      p1.close();
      p2.close();
    }
  });

  it("cleans room membership on leave_game_room and emits opponent_disconnected on socket disconnect", async () => {
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

      // leave_game_room only cleans up room membership (no opponent_disconnected)
      p1.emit("leave_game_room", { gameId: game.id });
      await new Promise((r) => setTimeout(r, 100));
      expect(gameRoomService.getPlayersInRoom(game.id)).toHaveLength(1);
    } finally {
      p1.close();
      p2.close();
    }
  });

  it("cleans room membership when socket disconnects during an in-progress game", async () => {
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

      expect(gameRoomService.getPlayersInRoom(game.id)).toHaveLength(2);

      // Simulate browser tab close
      p1.disconnect();
      await new Promise((r) => setTimeout(r, 200));

      // Room membership cleaned up by handleGameRoomDisconnect
      expect(gameRoomService.getPlayersInRoom(game.id)).toHaveLength(1);
      expect(
        gameRoomService.getPlayersInRoom(game.id).some((p) => p.userId === player2.id),
      ).toBe(true);
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

  it("creates only one rematch game when both players request concurrently", async () => {
    const sourceGame = await prisma.game.create({
      data: {
        player1Id: player1.id,
        player2Id: player2.id,
        status: "FINISHED",
        winnerId: player1.id,
        finishedAt: new Date(),
      },
    });

    const [fromPlayer1, fromPlayer2] = await Promise.all([
      createOrGetRematchInDb(player1.id, player2.id, sourceGame.id),
      createOrGetRematchInDb(player2.id, player1.id, sourceGame.id),
    ]);

    expect(fromPlayer1.id).toBe(fromPlayer2.id);

    const rematches = await prisma.game.findMany({
      where: {
        id: { not: sourceGame.id },
        status: { in: ["WAITING", "IN_PROGRESS"] },
        createdAt: {
          gte: sourceGame.finishedAt!,
        },
        OR: [
          { player1Id: player1.id, player2Id: player2.id },
          { player1Id: player2.id, player2Id: player1.id },
        ],
      },
    });

    expect(rematches).toHaveLength(1);
  });

  it("rejects rematch relay from non-participant sockets", async () => {
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
    const outsiderToken = jwt.sign(
      { id: outsider.id, username: outsider.username },
      JWT_SECRET,
    );

    const p1 = Client(`http://localhost:${port}`, {
      auth: { token: `Bearer ${p1Token}` },
    });
    const p2 = Client(`http://localhost:${port}`, {
      auth: { token: `Bearer ${p2Token}` },
    });
    const out = Client(`http://localhost:${port}`, {
      auth: { token: `Bearer ${outsiderToken}` },
    });

    try {
      await Promise.all([
        waitForEvent(p1, "connect"),
        waitForEvent(p2, "connect"),
        waitForEvent(out, "connect"),
      ]);

      p1.emit("join_game_room", { gameId: game.id });
      p2.emit("join_game_room", { gameId: game.id });
      await Promise.all([
        waitForEvent(p1, "room_joined"),
        waitForEvent(p2, "room_joined"),
      ]);

      const errorPromise = waitForEvent<{ message: string }>(out, "error");
      out.emit("send_rematch", { gameId: game.id, newGameId: game.id + 1000 });
      const errorPayload = await errorPromise;

      expect(errorPayload.message).toMatch(/Unauthorized|not a participant/i);
      await Promise.all([
        expectNoEvent(p1, "rematch_received"),
        expectNoEvent(p2, "rematch_received"),
      ]);
    } finally {
      p1.close();
      p2.close();
      out.close();
    }
  });

  it("relays rematch to opponent when newGameId belongs to the same participant pair", async () => {
    const sourceGame = await prisma.game.create({
      data: {
        player1Id: player1.id,
        player2Id: player2.id,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });
    const rematchGame = await prisma.game.create({
      data: {
        player1Id: player2.id,
        player2Id: player1.id,
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
      p1.emit("join_game_room", { gameId: sourceGame.id });
      p2.emit("join_game_room", { gameId: sourceGame.id });
      await Promise.all([
        waitForEvent(p1, "room_joined"),
        waitForEvent(p2, "room_joined"),
      ]);

      const relayPromise = waitForEvent<{ newGameId: number }>(p2, "rematch_received");
      p1.emit("send_rematch", { gameId: sourceGame.id, newGameId: rematchGame.id });
      const relayPayload = await relayPromise;

      expect(relayPayload.newGameId).toBe(rematchGame.id);
    } finally {
      p1.close();
      p2.close();
    }
  });

  it("rejects rematch relay when newGameId participants do not match source game", async () => {
    const sourceGame = await prisma.game.create({
      data: {
        player1Id: player1.id,
        player2Id: player2.id,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });
    const unrelatedGame = await prisma.game.create({
      data: {
        player1Id: player1.id,
        player2Id: outsider.id,
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
      p1.emit("join_game_room", { gameId: sourceGame.id });
      p2.emit("join_game_room", { gameId: sourceGame.id });
      await Promise.all([
        waitForEvent(p1, "room_joined"),
        waitForEvent(p2, "room_joined"),
      ]);

      const errorPromise = waitForEvent<{ message: string }>(p1, "error");
      p1.emit("send_rematch", { gameId: sourceGame.id, newGameId: unrelatedGame.id });
      const errorPayload = await errorPromise;

      expect(errorPayload.message).toBe("Invalid rematch target game");
      await Promise.all([
        expectNoEvent(p1, "rematch_received"),
        expectNoEvent(p2, "rematch_received"),
      ]);
    } finally {
      p1.close();
      p2.close();
    }
  });
});
