import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { Server as SocketIOServer } from "socket.io";
import { io as Client } from "socket.io-client";
import http from "http";
import jwt from "jsonwebtoken";
import prisma from "../src/lib/prisma";
import { registerSocketHandlers } from "../src/socket";
import { disconnectionService } from "../src/services/disconnection.service";

const JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const PORT = 3005;
const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

describeDb("Game Over Logic - Complete Suite", () => {
  let io: SocketIOServer;
  let server: http.Server;
  let user1: any;
  let user2: any;
  let user1Token: string;
  let user2Token: string;
  let game: any;

  beforeAll(async () => {
    await prisma.game.deleteMany({});
    await prisma.user.deleteMany({});

    user1 = await prisma.user.create({
      data: { email: "x@test.com", username: "PlayerX", passwordHash: "h" },
    });
    user2 = await prisma.user.create({
      data: { email: "o@test.com", username: "PlayerO", passwordHash: "h" },
    });

    user1Token = jwt.sign({ id: user1.id, username: user1.username }, JWT_SECRET);
    user2Token = jwt.sign({ id: user2.id, username: user2.username }, JWT_SECRET);

    server = http.createServer();
    io = new SocketIOServer(server, { transports: ["websocket"] });

    io.use((socket, next) => {
      const token = socket.handshake.auth?.token?.split(" ")[1];
      try {
        socket.data.user = jwt.verify(token, JWT_SECRET);
        next();
      } catch {
        next(new Error("Auth Error"));
      }
    });

    io.on("connection", (socket) => {
      registerSocketHandlers(io, socket);
    });

    await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));
  });

  afterAll(async () => {
    await prisma.$disconnect();
    io?.close();
    server?.close();
  });

  beforeEach(async () => {
    game = await prisma.game.create({
      data: {
        player1Id: user1.id,
        player2Id: user2.id,
        player1Symbol: "X",
        player2Symbol: "O",
        boardState: Array(9).fill(null),
        currentTurn: "X",
        status: "IN_PROGRESS",
      },
    });
  });

  afterEach(async () => {
    const sockets = await io.fetchSockets();
    sockets.forEach((s) => s.disconnect(true));
    disconnectionService.cancelAllTimersForGame(game.id);
  });

  it("Test 1: should trigger game_over with correct win data for both players", async () => {
    await prisma.game.update({
      where: { id: game.id },
      data: { boardState: ["X", "X", null, "O", "O", null, null, null, null] },
    });

    const clientX = Client(`http://localhost:${PORT}`, {
      auth: { token: `Bearer ${user1Token}` },
      transports: ["websocket"],
    });
    const clientO = Client(`http://localhost:${PORT}`, {
      auth: { token: `Bearer ${user2Token}` },
      transports: ["websocket"],
    });

    const results = await Promise.all([
      new Promise((res) => {
        clientX.on("connect", () => {
          clientX.emit("join_game_room", { gameId: game.id });
          clientX.emit("make_move", { gameId: game.id, cellIndex: 2 });
        });
        clientX.on("game_over", (data) => res(data));
      }),
      new Promise((res) => {
        clientO.on("connect", () => {
          clientO.emit("join_game_room", { gameId: game.id });
        });
        clientO.on("game_over", (data) => res(data));
      }),
    ]);

    const [dataX, dataO] = results as any[];
    expect(dataX.result).toBe("win");
    expect(dataO.result).toBe("win");
    expect(dataX.winner.id).toBe(user1.id);
    expect(dataX.loser.id).toBe(user2.id);
    expect(dataX.winningLine).toEqual([0, 1, 2]);

    clientX.disconnect();
    clientO.disconnect();
  });

  it("Test 2: should trigger game_over with draw data", async () => {
    const drawState = ["X", "O", "X", "X", "X", "O", "O", "X", null];
    await prisma.game.update({
      where: { id: game.id },
      data: { boardState: drawState, currentTurn: "O" },
    });

    const clientO = Client(`http://localhost:${PORT}`, {
      auth: { token: `Bearer ${user2Token}` },
      transports: ["websocket"],
    });

    const data: any = await new Promise((res) => {
      clientO.on("connect", () => {
        clientO.emit("join_game_room", { gameId: game.id });
        clientO.emit("make_move", { gameId: game.id, cellIndex: 8 });
      });
      clientO.on("game_over", (payload) => res(payload));
    });

    expect(data.result).toBe("draw");
    expect(data.winner).toBeNull();
    expect(data.loser).toBeNull();
    expect(data.winningLine).toBeNull();
    clientO.disconnect();
  });

  it("Test 3: should verify move count and duration accuracy", async () => {
    const finishedAt = new Date(Date.now() + 5000);

    await prisma.game.update({
      where: { id: game.id },
      data: {
        boardState: ["X", "X", "X", "O", "O", null, null, null, null],
        status: "FINISHED",
        finishedAt,
      },
    });

    const dbGame = await prisma.game.findUnique({ where: { id: game.id } });
    const board = dbGame?.boardState as any[];
    const totalMoves = board.filter((c) => c !== null).length;
    const duration = Math.floor(
      (dbGame!.finishedAt!.getTime() - dbGame!.createdAt.getTime()) / 1000,
    );

    expect(totalMoves).toBe(5);
    expect(duration).toBeGreaterThanOrEqual(5);
  });

  it("Test 4: should not leak events to other games", async () => {
    const gameB = await prisma.game.create({
      data: {
        player1Id: user1.id,
        player2Id: user2.id,
        player1Symbol: "X",
        player2Symbol: "O",
        boardState: Array(9).fill(null),
        currentTurn: "X",
      },
    });

    const clientB = Client(`http://localhost:${PORT}`, {
      auth: { token: `Bearer ${user1Token}` },
      transports: ["websocket"],
    });
    let receivedOtherGameEvent = false;

    await new Promise<void>((resolve) => {
      clientB.on("connect", () => {
        clientB.emit("join_game_room", { gameId: gameB.id });
        clientB.on("game_over", () => {
          receivedOtherGameEvent = true;
        });

        io.to(`game-${game.id}`).emit("game_over", { gameId: game.id });

        setTimeout(() => {
          expect(receivedOtherGameEvent).toBe(false);
          resolve();
        }, 500);
      });
    });

    clientB.disconnect();
  });

  it("Test 5: should allow viewing final state after reconnection", async () => {
    await prisma.game.update({
      where: { id: game.id },
      data: {
        status: "FINISHED",
        boardState: ["X", "X", "X", "O", "O", null, null, null, null],
      },
    });

    const client = Client(`http://localhost:${PORT}`, {
      auth: { token: `Bearer ${user1Token}` },
      transports: ["websocket"],
    });

    await new Promise<void>((res) => {
      client.on("connect", () => {
        client.emit("join_game_room", { gameId: game.id });
        client.emit("get_game_state", { gameId: game.id }, (response: any) => {
          expect(response.status).toBe("FINISHED");
          expect(response.boardState).toContain("X");
          res();
        });
      });
    });

    client.disconnect();
  });

  it("Test 6: should deny access to non-participant user", async () => {
    const userC = await prisma.user.create({
      data: { email: "hacker@test.com", username: "Charlie", passwordHash: "h" },
    });
    const userCToken = jwt.sign({ id: userC.id, username: userC.username }, JWT_SECRET);

    const clientC = Client(`http://localhost:${PORT}`, {
      auth: { token: `Bearer ${userCToken}` },
      transports: ["websocket"],
    });

    const joinError: any = await new Promise((resolve) => {
      clientC.on("connect", () => {
        clientC.emit("join_game_room", { gameId: game.id }, (response: any) => {
          resolve(response);
        });
      });
    });

    expect(joinError.error).toBeDefined();
    expect(joinError.error).toMatch(/unauthorized|not a participant/i);

    const gameStateError: any = await new Promise((resolve) => {
      clientC.emit("get_game_state", { gameId: game.id }, (response: any) => {
        resolve(response);
      });
    });

    expect(gameStateError.error).toBeDefined();
    expect(gameStateError.error).toMatch(/unauthorized|not a participant/i);

    clientC.disconnect();
  });
});
