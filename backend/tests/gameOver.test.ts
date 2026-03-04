import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { Server as SocketIOServer } from "socket.io";
import { io as Client } from "socket.io-client";
import http from "http";
import jwt from "jsonwebtoken";
import { app } from "../src/index";
import prisma from "../src/lib/prisma";
import { registerGameHandlers } from "../src/socket/handlers/game.handlers";

const JWT_SECRET = process.env.JWT_SECRET || "test_secret";

describe("Game Event - Game Over Logic", () => {
  let io: SocketIOServer;
  let server: http.Server;
  const port = 3003;
  let user1: any, user2: any;
  let game: any;
  let user1Token: string, user2Token: string;

  beforeAll(async () => {
    // Nettoyage global initial
    await prisma.game.deleteMany({ where: { player1: { email: { in: ["p1@test.com", "p2@test.com"] } } } });
    await prisma.user.deleteMany({ where: { email: { in: ["p1@test.com", "p2@test.com"] } } });

    user1 = await prisma.user.create({ data: { email: "p1@test.com", username: "Alice", passwordHash: "hash" } });
    user2 = await prisma.user.create({ data: { email: "p2@test.com", username: "Bob", passwordHash: "hash" } });

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
      // On rejoint la room dynamiquement (le gameId sera injecté dans les tests)
      socket.on("join_game_room", ({ gameId }) => {
      socket.join(`game-${gameId}`);
  });
    });

    await new Promise<void>((resolve) => server.listen(port, () => resolve()));
  });

  // CRUCIAL : Recréer un jeu à chaque test pour éviter le "Game already finished"
  beforeEach(async () => {
    if (game) await prisma.game.deleteMany({ where: { id: game.id } });
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

  afterAll(async () => {
    const sockets = await io.fetchSockets();
    sockets.forEach(s => s.disconnect(true));
    await new Promise(r => io.close(r));
    await new Promise(r => server.close(r));
    await prisma.game.deleteMany({ where: { id: game?.id } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [user1?.id, user2?.id].filter(Boolean) } } }).catch(() => {});
    await prisma.$disconnect();
  });

  // --- TEST 1: VICTOIRE ---
  it("should trigger game_over when a player wins", async () => {
    await prisma.game.update({
      where: { id: game.id },
      data: {
        boardState: ["X", "X", null, "O", "O", null, null, null, null],
        currentTurn: "X"
      }
    });

    return new Promise((resolve, reject) => {
      const client = Client(`http://localhost:${port}`, { auth: { token: `Bearer ${user1Token}` } });
      client.on("connect", () => {
        client.emit("join_game_room", { gameId: game.id }); // Assure-toi d'avoir ce handler ou rejoins la room
        setTimeout(() => {
            client.emit("make_move", { gameId: game.id, cellIndex: 2 });
          }, 50);
      });

      client.on("game_over", (data: any) => {
        try {
          expect(data.result).toBe("win");
          expect(data.winner.id).toBe(user1.id);
          client.disconnect();
          resolve(true);
        } catch (e) { client.disconnect(); reject(e); }
      });
      client.on("move_error", (err) => { client.disconnect(); reject(new Error(err.error)); });
    });
  });

  // --- TEST 2: MATCH NUL ---
  it("should trigger game_over with draw result when board is full", async () => {
    const drawBoard = ["X", "O", "X", "X", "X", "O", "O", "X", null];
    await prisma.game.update({
      where: { id: game.id },
      data: { boardState: drawBoard, currentTurn: "O" }
    });

    return new Promise((resolve, reject) => {
      const client = Client(`http://localhost:${port}`, { auth: { token: `Bearer ${user2Token}` } });
      client.on("connect", () => {
        client.emit("join_game_room", { gameId: game.id }); // Assure-toi d'avoir ce handler ou rejoins la room
        setTimeout(() => {
          client.emit("make_move", { gameId: game.id, cellIndex: 8 });
        }, 50);
      });

      // AJOUT : Si le move est rejeté, on fail le test tout de suite au lieu d'attendre le timeout
      client.on("move_error", (err: any) => {
        client.disconnect();
        reject(new Error(`Move rejected by server: ${err.error}`));
      });

      client.on("game_over", (data: any) => {
        try {
          expect(data.result).toBe("draw");
          // Si data.isDraw n'existe pas, on vérifie juste le résultat
          expect(data.winner).toBeFalsy();
          client.disconnect();
          resolve(true);
        } catch (e) { client.disconnect(); reject(e); }
      });
    });
  });
});
