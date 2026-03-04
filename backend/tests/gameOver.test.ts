import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "@jest/globals";
import { Server as SocketIOServer } from "socket.io";
import { io as Client } from "socket.io-client";
import http from "http";
import jwt from "jsonwebtoken";
import { app } from "../src/index";
import prisma from "../src/lib/prisma";
import { registerGameHandlers } from "../src/socket/handlers/game.handlers";
import { disconnectionService } from "../src/services/disconnection.service";

const JWT_SECRET = process.env.JWT_SECRET || "test_secret";
const PORT = 3005;

describe("Game Over Logic - Complete Suite", () => {
  let io: SocketIOServer;
  let server: http.Server;
  let user1: any, user2: any;
  let user1Token: string, user2Token: string;
  let game: any;

  beforeAll(async () => {
    try {
      // Cleanup users & games
      await prisma.game.deleteMany({});
      await prisma.user.deleteMany({ where: { email: { in: ["x@test.com", "o@test.com"] } } });

      user1 = await prisma.user.create({ data: { email: "x@test.com", username: "player1", passwordHash: "h" } });
      user2 = await prisma.user.create({ data: { email: "o@test.com", username: "player2", passwordHash: "h" } });

      user1Token = jwt.sign({ id: user1.id, username: user1.username }, JWT_SECRET);
      user2Token = jwt.sign({ id: user2.id, username: user2.username }, JWT_SECRET);

      server = http.createServer(app);
      io = new SocketIOServer(server);

      io.use((socket, next) => {
        const token = socket.handshake.auth?.token?.split(" ")[1];
        try {
          socket.data.user = jwt.verify(token, JWT_SECRET);
          next();
        } catch (e) { next(new Error("Auth Error")); }
      });

      io.on("connection", (socket) => {
        registerGameHandlers(io, socket);
        socket.on("join_game_room", ({ gameId }) => socket.join(`game-${gameId}`));
      });

      await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));
    } catch (error) {
      console.error("❌ FAILED TO INITIALIZE TEST SETUP:", error);
      throw error; // Arrête tout si la DB n'est pas là
    }
  });

  afterAll(async () => {
  // On utilise l'optional chaining (?.) pour éviter le crash si io/server sont undefined
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
    // 1. On déconnecte tous les sockets serveurs pour éviter les fuites
    const sockets = await io.fetchSockets();
    sockets.forEach((s) => s.disconnect(true));

    // 2. On annule tous les timers de forfait qui auraient pu être lancés
    // (Important pour que le test suivant ne soit pas perturbé)
    disconnectionService.cancelAllTimersForGame(game.id);
  });

  // --- TEST 1: WIN SCENARIO ---
  it("Test 1: should trigger game_over with correct win data for both players", async () => {
    await prisma.game.update({
      where: { id: game.id },
      data: { boardState: ["X", "X", null, "O", "O", null, null, null, null] }
    });

    const clientX = Client(`http://localhost:${PORT}`, { auth: { token: `Bearer ${user1Token}` } });
    const clientO = Client(`http://localhost:${PORT}`, { auth: { token: `Bearer ${user2Token}` } });

    const results = await Promise.all([
      new Promise((res) => {
        clientX.on("connect", () => { clientX.emit("join_game_room", { gameId: game.id }); clientX.emit("make_move", { gameId: game.id, cellIndex: 2 }); });
        clientX.on("game_over", (data) => res(data));
      }),
      new Promise((res) => {
        clientO.on("connect", () => { clientO.emit("join_game_room", { gameId: game.id }); });
        clientO.on("game_over", (data) => res(data));
      })
    ]);

    const [dataX, dataO] = results as any[];
    expect(dataX.result).toBe("win");
    expect(dataO.result).toBe("win");
    expect(dataX.winner.id).toBe(user1.id);
    expect(dataX.loser.id).toBe(user2.id);
    expect(dataX.winningLine).toEqual([0, 1, 2]);

    const dbGame = await prisma.game.findUnique({ where: { id: game.id } });
    // On force le cast en "any[]" ou "string[]" pour accéder à l'index
    const board = dbGame?.boardState as any[];
    expect(board).toBeDefined();
    expect(board[2]).toBe("X");
    clientX.disconnect(); clientO.disconnect();
  });

  // --- TEST 2: DRAW SCENARIO ---
  it("Test 2: should trigger game_over with draw data for both players", async () => {
    const drawState = ["X", "O", "X", "X", "X", "O", "O", "X", null];
    await prisma.game.update({ where: { id: game.id }, data: { boardState: drawState, currentTurn: "O" } });

    const clientO = Client(`http://localhost:${PORT}`, { auth: { token: `Bearer ${user2Token}` } });

    const data: any = await new Promise((res) => {
      clientO.on("connect", () => { clientO.emit("join_game_room", { gameId: game.id }); clientO.emit("make_move", { gameId: game.id, cellIndex: 8 }); });
      clientO.on("game_over", (data) => res(data));
    });

    expect(data.result).toBe("draw");
    expect(data.winner).toBeNull();
    expect(data.loser).toBeNull();
    expect(data.winningLine).toBeNull();
    clientO.disconnect();
  });

  // --- TEST 3: DATA ACCURACY ---
  it("Test 3: should verify move count and duration accuracy", async () => {
    const startedAt = new Date();
    const finishedAt = new Date(startedAt.getTime() + 5000);

    await prisma.game.update({
      where: { id: game.id },
      data: {
        boardState: ["X", "X", "X", "O", "O", null, null, null, null],
        status: "FINISHED",
        finishedAt: finishedAt
      }
    });

    const dbGame = await prisma.game.findUnique({ where: { id: game.id } });
    const board = dbGame?.boardState as any[];

    // Vérification du nombre de coups
    const totalMoves = board.filter(c => c !== null).length;
    expect(totalMoves).toBe(5);

    // Vérification de la durée
    const duration = Math.floor((dbGame!.finishedAt!.getTime() - dbGame!.createdAt.getTime()) / 1000);
    expect(duration).toBeGreaterThanOrEqual(5);
  });

  // --- TEST 4: ISOLATION ---
  it("Test 4: should not leak events to other games", async () => {
    const gameB = await prisma.game.create({ data: { player1Id: user1.id, player2Id: user2.id, player1Symbol: "X", player2Symbol: "O", boardState: Array(9).fill(null), currentTurn: "X" } });

    const clientB = Client(`http://localhost:${PORT}`, { auth: { token: `Bearer ${user1Token}` } });
    let receivedOtherGameEvent = false;

    await new Promise<void>((resolve) => {
      clientB.on("connect", () => {
        clientB.emit("join_game_room", { gameId: gameB.id });
        clientB.on("game_over", () => { receivedOtherGameEvent = true; });

        // On finit le jeu A
        io.to(`game-${game.id}`).emit("game_over", { gameId: game.id });

        setTimeout(() => {
          expect(receivedOtherGameEvent).toBe(false);
          resolve();
        }, 500);
      });
    });
    clientB.disconnect();
  });

  // --- TEST 5: RECONNECTION ---
  it("Test 5: should allow viewing final state after reconnection", async () => {
    await prisma.game.update({ where: { id: game.id }, data: { status: "FINISHED", boardState: ["X", "X", "X", "O", "O", null, null, null, null] } });

    const client = Client(`http://localhost:${PORT}`, { auth: { token: `Bearer ${user1Token}` } });

    await new Promise<void>((res) => {
      client.on("connect", () => {
        client.emit("join_game_room", { gameId: game.id });
        // Ici on simule une requête pour obtenir l'état actuel (si tu as un handler "get_game_state")
        client.emit("get_game_state", { gameId: game.id }, (response: any) => {
          expect(response.status).toBe("FINISHED");
          expect(response.boardState).toContain("X");
          res();
        });
      });
    });
    client.disconnect();
  });

  it("Test 6: should deny access to a non-participant user", async () => {
      const randomId = Math.random().toString(36).substring(7); // Create a random string

      // 1. Create a "Hacker" user with a unique username
      const userC = await prisma.user.create({
        data: {
          email: `hacker_${randomId}@test.com`,
          username: `Charlie_${randomId}`, // Now unique!
          passwordHash: "h"
        }
      });

      const charlieToken = jwt.sign({ id: userC.id, username: userC.username }, JWT_SECRET);

      const charlieSocket = Client(`http://localhost:${PORT}`, {
        auth: { token: `Bearer ${charlieToken}` },
        transports: ['websocket']
      });

      await new Promise<void>((res) => charlieSocket.on("connect", () => res()));

      // 2. We expect the server to emit "unauthorized"
      const authErrorPromise = new Promise((resolve) => {
        charlieSocket.on("unauthorized", (data) => {
          resolve(data);
        });
      });

      // 3. Charlie tries to join
      charlieSocket.emit("join_game_room", { gameId: game.id });

      // 4. Wait for the error
      const errorData: any = await authErrorPromise;
      expect(errorData.error).toBe("You are not a participant in this game");

      charlieSocket.disconnect();
    }, 10000);

});
