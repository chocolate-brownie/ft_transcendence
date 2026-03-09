import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { app } from "../src/index";
import prisma from "../src/lib/prisma";
import { GameStatus, Difficulty } from "@prisma/client";
import { Board } from "../src/types/game";

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

describeDb("AI Game API Integration Tests", () => {
  const cleanDatabase = async () => {
    await prisma.game.deleteMany();
    await prisma.user.deleteMany();
  };

  let token: string;
  let userId: number;

  beforeAll(async () => {
    // Nettoyage et création d'un utilisateur de test
    await cleanDatabase();

    const userRes = await request(app)
      .post("/api/auth/signup")
      .send({ username: "player1", email: "p1@test.com", password: "password123" });

    userId = userRes.body.user.id;
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "p1@test.com", password: "password123" });

    token = loginRes.body.token;
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe("Tests 1 & 2: Game Creation", () => {
    test("Player goes first (X)", async () => {
      const res = await request(app)
        .post("/api/ai/games")
        .set("Authorization", `Bearer ${token}`)
        .send({ difficulty: "hard", playerSymbol: "X" });

      expect(res.status).toBe(201);
      expect(res.body.game.difficulty).toBe(Difficulty.HARD);
      expect(JSON.parse(res.body.game.boardState)).toEqual(Array(9).fill(null));
      expect(res.body.game.player1Id).toEqual(userId);
      expect(res.body.game.player2Id).toEqual(null);
      expect(res.body.game.currentTurn).toBe("X");
      expect(res.body.game.status).toBe(GameStatus.IN_PROGRESS);
    });

    test("AI goes first (X) - Player chooses O", async () => {
      const res = await request(app)
        .post("/api/ai/games")
        .set("Authorization", `Bearer ${token}`)
        .send({ difficulty: "hard", playerSymbol: "O" });

      const board = JSON.parse(res.body.game.boardState);
      expect(res.status).toBe(201);
      expect(board[4]).toEqual("X");
      expect(res.body.game.currentTurn).toBe("O");
    });
  });

  describe("Test 3 & 9: Move & Performance", () => {
    test("Player valid move and fast AI response", async () => {
      const setup = await request(app)
        .post("/api/ai/games")
        .set("Authorization", `Bearer ${token}`)
        .send({ difficulty: "hard", playerSymbol: "X" });

      const gameId = setup.body.game.id;
      const start = Date.now();

      const res = await request(app)
        .post(`/api/ai/games/${gameId}/move`)
        .set("Authorization", `Bearer ${token}`)
        .send({ moveIndex: 4 });

      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(150); // Performance check
      // console.log(`AI move response time: ${duration}ms`);
      // console.log("AI Move Details:", res.body.aiMove);
      // console.log("Board State after move:", res.body.game.boardState);
      // console.log("Game Status after move:", res.body.game.status);
      expect(res.body.aiMove).not.toBeNull();
      const board = res.body.game.boardState;
      expect(board[4]).toBe("X");
    });
  });

  describe("Tests 4, 5 & 6: Game Endings", () => {
    test("Player Wins - AI does not move", async () => {
      // Setup: X a déjà deux marques
      const game = await prisma.game.create({
        data: {
          player1Id: userId,
          boardState: JSON.stringify(["X", "X", null, "O", "O", null, null, null, null]),
          player1Symbol: "X",
          player2Symbol: "O",
          currentTurn: "X",
          difficulty: "EASY",
          gameType: "AI",
          status: "IN_PROGRESS"
        }
      });

      const res = await request(app)
        .post(`/api/ai/games/${game.id}/move`)
        .set("Authorization", `Bearer ${token}`)
        .send({ moveIndex: 2 });

      expect(res.body.game.status).toBe(GameStatus.FINISHED);
      expect(res.body.game.winner).toBe("X");
      expect(res.body.aiMove).toBeNull();
      expect(res.body.game.finishedAt).not.toBeNull();
    });

    test("AI Wins - Response includes winning move", async () => {
      const game = await prisma.game.create({
        data: {
          player1Id: userId,
          boardState: JSON.stringify(["O", "O", null, "X", "X", null, null, null, null]),
          player1Symbol: "X",
          player2Symbol: "O",
          currentTurn: "X",
          difficulty: "HARD",
          gameType: "AI",
          status: "IN_PROGRESS"
        }
      });

      const res = await request(app)
        .post(`/api/ai/games/${game.id}/move`)
        .set("Authorization", `Bearer ${token}`)
        .send({ moveIndex: 6 });

      //console.log("Board State after PlayerMove: ", res.body.game.boardState);

      expect(res.body.game.status).toBe(GameStatus.FINISHED);
      expect(res.body.game.winner).toBe("O");
      expect(res.body.aiMove.moveIndex).toBe(2);
    });

    test("Draw", async () => {
      // Setup: X a déjà deux marques
      const game = await prisma.game.create({
        data: {
          player1Id: userId,
          boardState: JSON.stringify(["X", "X", "O",
                                      "O", "X", "X",
                                      null, "O", "O"]),
          player1Symbol: "X",
          player2Symbol: "O",
          currentTurn: "X",
          difficulty: "EASY",
          gameType: "AI",
          status: "IN_PROGRESS"
        }
      });

      const res = await request(app)
        .post(`/api/ai/games/${game.id}/move`)
        .set("Authorization", `Bearer ${token}`)
        .send({ moveIndex: 6 });

      expect(res.body.game.status).toBe(GameStatus.DRAW);
      expect(res.body.game.winner).toBe(null);
      expect(res.body.aiMove).toBeNull();
      expect((res.body.game.boardState as Board).every(c => c !== null)).toBe(true);
      expect(res.body.game.finishedAt).not.toBeNull();
    });
  });

  describe("Test 7: Invalid Moves", () => {
    test("Error on occupied cell", async () => {
      const setup = await request(app)
        .post("/api/ai/games")
        .set("Authorization", `Bearer ${token}`)
        .send({ difficulty: "hard", playerSymbol: "X" });

      const gameId = setup.body.game.id;
      // console.log("Game created with ID:", gameId);
      // console.log("Initial Board State:", JSON.parse(setup.body.game.boardState));
      // Jouer au centre
      await request(app).post(`/api/ai/games/${gameId}/move`).set("Authorization", `Bearer ${token}`).send({ moveIndex: 4 });

      // const gameAfterPlayerMove = await request(app).get(`/api/ai/games/${gameId}`).set("Authorization", `Bearer ${token}`);
      // console.log("Board State after player move:", gameAfterPlayerMove.body.game.boardState);
      // Rejouer au centre
      const res = await request(app).post(`/api/ai/games/${gameId}/move`).set("Authorization", `Bearer ${token}`).send({ moveIndex: 4 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/occupied/i);
    });

    test("Invalid cell index", async () => {
      const setup = await request(app)
        .post("/api/ai/games")
        .set("Authorization", `Bearer ${token}`)
        .send({ difficulty: "hard", playerSymbol: "X" });

      const gameId = setup.body.game.id;

      const res = await request(app).post(`/api/ai/games/${gameId}/move`).set("Authorization", `Bearer ${token}`).send({ moveIndex: -1 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid/i);
    });

    test("Invalid cell index", async () => {
      const setup = await request(app)
        .post("/api/ai/games")
        .set("Authorization", `Bearer ${token}`)
        .send({ difficulty: "hard", playerSymbol: "X" });

      const gameId = setup.body.game.id;

      const res = await request(app).post(`/api/ai/games/${gameId}/move`).set("Authorization", `Bearer ${token}`).send({ moveIndex: 9 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid/i);
    });

    test("Invalid cell index", async () => {
      const setup = await request(app)
        .post("/api/ai/games")
        .set("Authorization", `Bearer ${token}`)
        .send({ difficulty: "hard", playerSymbol: "X" });

      const gameId = setup.body.game.id;

      const res = await request(app).post(`/api/ai/games/${gameId}/move`).set("Authorization", `Bearer ${token}`).send({ moveIndex: "6" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid/i);
    });

    test("Game Already Over", async () => {
      // Setup: X a déjà deux marques
      const game = await prisma.game.create({
        data: {
          player1Id: userId,
          boardState: JSON.stringify(["X", "X", "O",
                                      "O", "X", "X",
                                      null, "O", "O"]),
          player1Symbol: "X",
          player2Symbol: "O",
          currentTurn: "X",
          difficulty: "EASY",
          gameType: "AI",
          status: "IN_PROGRESS"
        }
      });

      const res = await request(app)
        .post(`/api/ai/games/${game.id}/move`)
        .set("Authorization", `Bearer ${token}`)
        .send({ moveIndex: 6 });

      const invalidRes = await request(app).post(`/api/ai/games/${game.id}/move`).set("Authorization", `Bearer ${token}`).send({ moveIndex: 6 });

      expect(invalidRes.status).toBe(409);
      expect(invalidRes.body.error).toMatch(/game already over/i);
    });

    test("Should return 400 when player tries to move out of turn", async () => {
      // 1. Créer une partie où c'est normalement au tour du joueur (X)
      const setup = await request(app)
        .post("/api/ai/games")
        .set("Authorization", `Bearer ${token}`)
        .send({ difficulty: "hard", playerSymbol: "X" });

      const gameId = setup.body.game.id;

      // 2. Modifier de force le tour en base de données pour que ce soit au tour de 'O' (l'IA)
      await prisma.game.update({
        where: { id: gameId },
        data: { currentTurn: "O" }
      });

      // 3. Tenter de jouer alors que currentTurn est "O"
      const res = await request(app)
        .post(`/api/ai/games/${gameId}/move`)
        .set("Authorization", `Bearer ${token}`)
        .send({ moveIndex: 0 });

      // 4. Vérification
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/not your turn/i);
    });
  });

  describe("Test 10: Database Integrity", () => {
    test("Verify record after game end", async () => {
      const game = await prisma.game.create({
        data: {
          player1Id: userId,
          boardState: JSON.stringify(["X", "X", null, "O", "O", null, "X", "O", null]),
          player1Symbol: "X",
          player2Symbol: "O",
          currentTurn: "X",
          difficulty: "EASY",
          gameType: "AI",
          status: "IN_PROGRESS"
        }
      });

      await request(app)
        .post(`/api/ai/games/${game.id}/move`)
        .set("Authorization", `Bearer ${token}`)
        .send({ moveIndex: 2 });

      const dbGame = await prisma.game.findUnique({ where: { id: game.id } });
      expect(dbGame?.status).toBe(GameStatus.FINISHED);
      expect(dbGame?.winnerId).toBe(userId);
      expect(dbGame?.finishedAt).not.toBeNull();
      expect(dbGame?.player2Id).toBeNull(); // AI identification
    });
  });
});
