import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { Server as SocketIOServer } from "socket.io";
import { io as Client } from "socket.io-client";
import http from "http";
import jwt from "jsonwebtoken";
import request from "supertest";
import { app } from "../src/index";
import prisma from "../src/lib/prisma";
import { saveMessage, getMessageWithSender } from "../src/services/chat.service";

const JWT_SECRET = process.env.JWT_SECRET || "test_secret";

describe("Chat Flow - Socket.io & History API", () => {
  let io: SocketIOServer;
  let server: http.Server;
  let clientSocket: any;
  const port = 3002;
  let user1: any;
  let user2: any;
  let user1Token: string;
  let user2Token: string;

  beforeAll(async () => {
    // 1. Création des utilisateurs
    user1 = await prisma.user.create({
      data: { email: "sender@test.com", username: "senderUser", passwordHash: "hash" },
    });
    user2 = await prisma.user.create({
      data: { email: "receiver@test.com", username: "receiverUser", passwordHash: "hash" },
    });

    user1Token = jwt.sign({ id: user1.id, email: user1.email }, JWT_SECRET);
    user2Token = jwt.sign({ id: user2.id, email: user2.email }, JWT_SECRET);

    // 2. Création de l'amitié
    await prisma.friend.create({
      data: { requesterId: user1.id, addresseeId: user2.id, status: "ACCEPTED" },
    });

    // 3. Setup du serveur Socket.io pour les tests
    server = http.createServer(app);
    io = new SocketIOServer(server);

    io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token"));
      try {
        const decoded = jwt.verify(token.split(" ")[1], JWT_SECRET) as any;
        socket.data.user = decoded;
        next();
      } catch (err) { next(new Error("Invalid token")); }
    });

    io.on("connection", (socket) => {
      socket.join(`user:${socket.data.user.id}`);
      socket.on("send_message", async (payload) => {
        const message = await saveMessage(socket.data.user.id, payload.receiverId, payload.content);
        const fullMsg = await getMessageWithSender(message.id);
        io.to(`user:${payload.receiverId}`).emit("receive_message", fullMsg);
        socket.emit("receive_message", fullMsg);
      });
    });

    await new Promise<void>((resolve) => server.listen(port, () => resolve()));
  });

  afterAll(async () => {
    // Nettoyage final
    await prisma.message.deleteMany({ where: { OR: [{ senderId: user1.id }, { receiverId: user1.id }, { senderId: user2.id }, { receiverId: user2.id }] } });
    await prisma.friend.deleteMany({ where: { OR: [{ requesterId: user1.id }, { addresseeId: user1.id }] } });
    await prisma.user.deleteMany({ where: { id: { in: [user1.id, user2.id] } } });

    if (clientSocket) clientSocket.close();
    io.close();
    server.close();
    await prisma.$disconnect();
  });

  // --- TEST 1: ENVOI ET RÉCEPTION SIMPLE ---
  it("Full Flow: Send via Socket -> Check History via GET API", (done) => {
    clientSocket = Client(`http://localhost:${port}`, {
      auth: { token: `Bearer ${user1Token}` },
    });

    clientSocket.on("connect", () => {
      clientSocket.emit("send_message", { receiverId: user2.id, content: "Hello from test!" });
    });

    clientSocket.on("receive_message", async (msg: any) => {
      try {
        expect(msg.content).toBe("Hello from test!");
        const response = await request(app)
          .get(`/api/messages/${user2.id}`)
          .set("Authorization", `Bearer ${user1Token}`);

        expect(response.status).toBe(200);
        expect(response.body.messages.length).toBeGreaterThan(0);
        done();
      } catch (error: any) { done(error); }
    });
  });

  // --- TEST 2: PAGINATION 200 MESSAGES ---
  it("should handle pagination correctly for 200 messages", async () => {
    // Nettoyage spécifique pour ce test
    await prisma.message.deleteMany({ where: { OR: [{ senderId: user1.id }, { receiverId: user1.id }] } });

    const totalMessages = 200;
    const limit = 50;

    // Création des 200 messages (Ordre chronologique pour tester le DESC)
    const messagesData = Array.from({ length: totalMessages }).map((_, i) => ({
      content: `Message ${i.toString().padStart(3, '0')}`,
      senderId: user1.id,
      receiverId: user2.id,
      createdAt: new Date(Date.now() + i * 1000),
    }));
    await prisma.message.createMany({ data: messagesData });

    // Requête Page 1 (Les 50 plus récents)
    const resPage1 = await request(app)
      .get(`/api/messages/${user2.id}?limit=${limit}`)
      .set("Authorization", `Bearer ${user1Token}`);

    expect(resPage1.status).toBe(200);
    expect(resPage1.body.messages).toHaveLength(limit);
    expect(resPage1.body.messages[0].content).toBe("Message 199");

    const cursor = resPage1.body.nextCursor;
    expect(cursor).toBeDefined();
    expect(resPage1.body.hasMore).toBe(true);

    // Requête Page 2 avec le curseur
    const resPage2 = await request(app)
      .get(`/api/messages/${user2.id}?limit=${limit}&before=${cursor}`)
      .set("Authorization", `Bearer ${user1Token}`);

    expect(resPage2.status).toBe(200);
    expect(resPage2.body.messages).toHaveLength(limit);
    // Le premier de la page 2 doit être le message 149 (car skip: 1 ignore le 150)
    expect(resPage2.body.messages[0].content).toBe("Message 149");
    expect(resPage2.body.hasMore).toBe(true);
  });

  // --- TEST 3: MARQUAGE "READ" ---
  it("should mark messages as read only when receiver fetches history", async () => {
    // On vide pour être précis
    await prisma.message.deleteMany({});

    // User 1 envoie un message à User 2
    const msg = await prisma.message.create({
      data: { content: "Unread msg", senderId: user1.id, receiverId: user2.id, read: false }
    });

    // User 2 (le destinataire) appelle l'API pour voir ses messages avec User 1
    const res = await request(app)
      .get(`/api/messages/${user1.id}`)
      .set("Authorization", `Bearer ${user2Token}`);

    expect(res.status).toBe(200);

    // On vérifie en base de données
    const updatedMsg = await prisma.message.findUnique({ where: { id: msg.id } });
    expect(updatedMsg?.read).toBe(true);
  });

  // --- TEST 4: FIN DE PAGINATION ---
  it("should return hasMore: false and empty data when reaching the end", async () => {
    // On récupère l'ID du tout premier message (le plus vieux)
    const firstMessage = await prisma.message.findFirst({
      orderBy: { createdAt: 'asc' }
    });

    // On demande ce qu'il y a AVANT le premier message
    const resLastPage = await request(app)
      .get(`/api/messages/${user2.id}?limit=50&before=${firstMessage?.id}`)
      .set("Authorization", `Bearer ${user1Token}`);

    expect(resLastPage.status).toBe(200);
    expect(resLastPage.body.messages).toHaveLength(0);
    expect(resLastPage.body.hasMore).toBe(false);
    expect(resLastPage.body.nextCursor).toBeNull();
  });
});
