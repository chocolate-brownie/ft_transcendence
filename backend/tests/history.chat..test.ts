import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { Server as SocketIOServer } from "socket.io";
import { io as Client } from "socket.io-client";
import http from "http";
import jwt from "jsonwebtoken";
import request from "supertest"; // Pour tester l'API GET
import { app } from "../src/index"; // Ton app express
import prisma from "../src/lib/prisma";
import {
  validateMessageContent,
  userExists,
  areFriends,
  saveMessage,
  getMessageWithSender,
} from "../src/services/chat.service";

const JWT_SECRET = process.env.JWT_SECRET || "test_secret";

describe("Chat Flow - Socket.io & History API", () => {
  let io: SocketIOServer;
  let server: http.Server;
  let clientSocket: any;
  const port = 3002;
  let user1: any;
  let user2: any;
  let user1Token: string;

  beforeAll(async () => {
    // 1. Création des utilisateurs de test
    user1 = await prisma.user.create({
      data: {
        email: "sender@test.com",
        username: "senderUser",
        passwordHash: "hash",
      },
    });
    user2 = await prisma.user.create({
      data: {
        email: "receiver@test.com",
        username: "receiverUser",
        passwordHash: "hash",
      },
    });

    user1Token = jwt.sign({ id: user1.id, email: user1.email }, JWT_SECRET);

    // 2. Création de l'amitié (obligatoire selon ton chat.service)
    await prisma.friend.create({
      data: {
        requesterId: user1.id,
        addresseeId: user2.id,
        status: "ACCEPTED",
      },
    });

    // 3. Setup du serveur Socket.io de test
    server = http.createServer(app);
    io = new SocketIOServer(server);

    // Middleware Auth (copié de ton index.ts)
    io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token"));
      try {
        const decoded = jwt.verify(token.split(" ")[1], JWT_SECRET);
        socket.data.user = decoded;
        next();
      } catch (err) {
        next(new Error("Invalid token"));
      }
    });

    io.on("connection", (socket) => {
      socket.join(`user:${socket.data.user.id}`);

      socket.on("send_message", async (payload) => {
        const senderId = socket.data.user.id;
        // Logique simplifiée du socket pour le test
        const message = await saveMessage(senderId, payload.receiverId, payload.content);
        const fullMsg = await getMessageWithSender(message.id);
        io.to(`user:${payload.receiverId}`).emit("receive_message", fullMsg);
        socket.emit("receive_message", fullMsg);
      });
    });

    await new Promise<void>((resolve) => server.listen(port, () => resolve()));
  });

  afterAll(async () => {
    // Nettoyage complet
    await prisma.message.deleteMany({ where: { OR: [{ senderId: user1.id }, { receiverId: user1.id }] } });
    await prisma.friend.deleteMany({ where: { OR: [{ requesterId: user1.id }, { addresseeId: user1.id }] } });
    await prisma.user.deleteMany({ where: { id: { in: [user1.id, user2.id] } } });

    clientSocket?.close();
    io.close();
    server.close();
    await prisma.$disconnect();
  });

  it("Full Flow: Send via Socket -> Check History via GET API", (done) => {
    clientSocket = Client(`http://localhost:${port}`, {
      auth: { token: `Bearer ${user1Token}` },
    });

    clientSocket.on("connect", () => {
      // Étape 1: Envoyer le message via Socket
      clientSocket.emit("send_message", {
        receiverId: user2.id,
        content: "Hello from test!",
      });
    });

    clientSocket.on("receive_message", async (msg: any) => {
      try {
        expect(msg.content).toBe("Hello from test!");

        // Étape 2: Tester l'historique via l'API Express (GET)
        // On utilise Supertest sur l'app exportée
        const response = await request(app)
          .get(`/api/messages/${user2.id}`)
          .set("Authorization", `Bearer ${user1Token}`);

        expect(response.status).toBe(200);
        expect(response.body.messages.length).toBeGreaterThan(0);
        expect(response.body.messages[0].content).toBe("Hello from test!");

        // Vérification de ton nouveau champ "read"
        // Note: Dans ton service, le message devient 'read: true' quand le RECEVEUR appelle l'historique.
        // Si c'est l'envoyeur (user1) qui appelle, il reste peut-être à false.
        expect(response.body.messages[0]).toHaveProperty("read");

        done();
      } catch (error: any) {
        done(new Error(`Erreur reçue: ${error.message}`));
      }
    });
  });
});
