import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { Server } from "socket.io";
import { io as Client, Socket as ClientSocket } from "socket.io-client";
import { createServer } from "http";
import { registerSocketHandlers } from "../src/socket";
import { disconnectionService } from "../src/services/disconnection.service";
import prisma from "../src/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

describeDb("Disconnection & Forfeit System", () => {
  let io: Server;
  let server: any;
  let port: number;
  let aliceSocket: ClientSocket;
  let bobSocket: ClientSocket;
  let alice: any;
  let bob: any;
  let game: any;
  let aliceToken: string;
  let bobToken: string;

  beforeAll(async () => {
    server = createServer();
    io = new Server(server, {
      transports: ["websocket"],
      pingInterval: 100,
      pingTimeout: 100,
    });

    io.use((socket, next) => {
      const token = socket.handshake.auth.token?.split(" ")[1];
      try {
        socket.data.user = jwt.verify(token!, JWT_SECRET);
        next();
      } catch {
        next(new Error("Unauthorized"));
      }
    });

    io.on("connection", (s) => registerSocketHandlers(io, s));

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = (server.address() as any).port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    io.close();
    await prisma.$disconnect();
    await new Promise<void>((res) => server.close(() => res()));
  });

  beforeEach(async () => {
    await prisma.game.deleteMany();
    await prisma.user.deleteMany();

    const s = Math.random().toString(36).substring(7);
    alice = await prisma.user.create({
      data: { email: `a${s}@t.com`, username: "Alice", passwordHash: "h" },
    });
    bob = await prisma.user.create({
      data: { email: `b${s}@t.com`, username: "Bob", passwordHash: "h" },
    });

    aliceToken = jwt.sign({ id: alice.id, username: "Alice" }, JWT_SECRET);
    bobToken = jwt.sign({ id: bob.id, username: "Bob" }, JWT_SECRET);

    game = await prisma.game.create({
      data: {
        player1Id: alice.id,
        player2Id: bob.id,
        status: "IN_PROGRESS",
        boardState: Array(9).fill(null),
      },
    });

    const options = { transports: ["websocket"], forceNew: true };
    aliceSocket = Client(`http://localhost:${port}`, {
      ...options,
      auth: { token: `Bearer ${aliceToken}` },
    });
    bobSocket = Client(`http://localhost:${port}`, {
      ...options,
      auth: { token: `Bearer ${bobToken}` },
    });

    await Promise.all([
      new Promise<void>((res) => aliceSocket.on("connect", () => res())),
      new Promise<void>((res) => bobSocket.on("connect", () => res())),
    ]);

    aliceSocket.emit("join_game_room", { gameId: game.id });
    bobSocket.emit("join_game_room", { gameId: game.id });
    await new Promise<void>((r) => setTimeout(r, 400));
  });

  afterEach(() => {
    if (aliceSocket.connected) aliceSocket.disconnect();
    if (bobSocket.connected) bobSocket.disconnect();
    disconnectionService.cancelAllTimersForGame(game.id);
    jest.restoreAllMocks();
  });

  it("Should notify Bob when Alice disconnects", (done) => {
    bobSocket.on("opponent_disconnected", (data: any) => {
      try {
        expect(data.username).toBe("Alice");
        done();
      } catch (e: any) {
        done(e);
      }
    });

    process.nextTick(() => aliceSocket.disconnect());
  }, 10000);

  it("Should forfeit the game if Bob stays away", async () => {
    const forfeitPromise = new Promise((res) => {
      aliceSocket.on("game_forfeited", (data) => res(data));
    });

    bobSocket.disconnect();
    await new Promise<void>((r) => setTimeout(r, 200));

    const serverAliceSocket = (await io.fetchSockets()).find(
      (s) => s.data.user.id === alice.id,
    );

    const actualRoom =
      Array.from(serverAliceSocket?.rooms || []).find((r) => r.startsWith("game")) ||
      `game-${game.id}`;

    const service = disconnectionService as any;

    await service.handleForfeit(
      io,
      game.id,
      { id: bob.id, username: "Bob" },
      { id: alice.id, username: "Alice", symbol: "X" },
      actualRoom,
    );

    const data: any = await forfeitPromise;
    expect(data.winner.id).toBe(alice.id);

    const dbGame = await prisma.game.findUnique({ where: { id: game.id } });
    expect(dbGame?.status).toBe("FINISHED");
  }, 15000);

  it("Should not start timer if game is already FINISHED", async () => {
    await prisma.game.update({ where: { id: game.id }, data: { status: "FINISHED" } });
    const spy = jest.spyOn(disconnectionService, "startForfeitTimer");

    aliceSocket.disconnect();
    await new Promise<void>((r) => setTimeout(r, 300));

    expect(spy).not.toHaveBeenCalled();
  });
});
