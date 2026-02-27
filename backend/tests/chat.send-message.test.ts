// Chat - Send Message Test
// Tests the send_message Socket.io event with real DB operations

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";

// Dynamic imports
const { io: Client } = await import("socket.io-client");
const { Server } = await import("socket.io");
const http = await import("http");
const jwt = (await import("jsonwebtoken")).default;
// const prisma = (await import("../src/lib/prisma")).default;
let prisma: any;
const {
  validateMessageContent,
  userExists,
  areFriends,
  saveMessage,
  getMessageWithSender,
} = await import("../src/services/chat.service");

const JWT_SECRET = "test_secret";

type User = {
  id: number;
  email: string;
  username: string;
  passwordHash: string;
};

describe("Chat - Send Message", () => {
  let io: any;
  let server: any;
  let clientSocket: any;
  const port = 3001;
  let user1: User;
  let user2: User;

  beforeAll(async () => {
    const prismaModule = await import("../src/lib/prisma");
    prisma = prismaModule.default;
    try {
      await prisma.$queryRaw`SELECT 1`; // Test DB connection
    } catch (err) {
      console.error("Database connection failed:", err);
      throw err;
    }
    // Create temporary users
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    user1 = await prisma.user.create({
      data: {
        email: "testuser1@example.com",
        username: "testuser1",
        passwordHash: "hash",
      },
    });
    user2 = await prisma.user.create({
      data: {
        email: "testuser2@example.com",
        username: "testuser2",
        passwordHash: "hash",
      },
    });

    // Create friendship
    await prisma.friend.create({
      data: {
        requesterId: user1.id,
        addresseeId: user2.id,
        status: "ACCEPTED",
      },
    });

    // Create HTTP server
    server = http.createServer();

    // Attach Socket.io with auth middleware
    io = new Server(server, { cors: { origin: "*" } });

    // Auth middleware
    io.use((socket: any, next: (err?: Error) => void) => {
      const token = socket.handshake.auth?.token;
      if (!token || !token.startsWith("Bearer ")) {
        return next(new Error("No token provided"));
      }
      try {
        const decoded = jwt.verify(token.split(" ")[1], JWT_SECRET);
        socket.data.user = decoded;
        next();
      } catch (err: any) {
        next(new Error("Invalid token"));
      }
    });

    // Connection handler
    io.on("connection", (socket: any) => {
      const userId = socket.data.user.id;
      socket.join(`user:${userId}`);

      socket.on("send_message", async (payload: { receiverId: number; content: string }) => {
        try {
          const senderId = socket.data.user.id;

          if (!payload.receiverId || typeof payload.receiverId !== "number") {
            return socket.emit("message_error", { message: "Invalid receiverId" });
          }
          if (!payload.content || typeof payload.content !== "string") {
            return socket.emit("message_error", { message: "Invalid content" });
          }

          if (!validateMessageContent(payload.content)) {
            return socket.emit("message_error", { message: "Content must be 1-2000 characters" });
          }

          const receiverExists = await userExists(payload.receiverId);
          if (!receiverExists) {
            return socket.emit("message_error", { message: "Receiver does not exist" });
          }

          const friends = await areFriends(senderId, payload.receiverId);
          if (!friends) {
            return socket.emit("message_error", { message: "You can only send messages to friends" });
          }

          const message = await saveMessage(senderId, payload.receiverId, payload.content);

          const messageWithSender = await getMessageWithSender(message.id);
          if (!messageWithSender) {
            return socket.emit("message_error", { message: "Failed to retrieve message" });
          }

          io.to(`user:${payload.receiverId}`).emit("receive_message", messageWithSender);
          socket.emit("receive_message", messageWithSender);

        } catch (error) {
          console.error("Error in send_message:", error);
          socket.emit("message_error", { message: "Internal server error" });
        }
      });
    });

    // Start server
    await new Promise<void>((resolve) => {
      server.listen(port, () => resolve());
    });
  });

  afterAll(async () => {
    clientSocket?.close();
    if (io) io.close();
    if (server) server.close();

    // Clean up only if users were created
    if (user1 && user2) {
      await prisma.message.deleteMany({
        where: {
          OR: [
            { senderId: user1.id },
            { receiverId: user1.id },
            { senderId: user2.id },
            { receiverId: user2.id },
          ],
        },
      });
      await prisma.friend.deleteMany({
        where: {
          OR: [
            { requesterId: user1.id, addresseeId: user2.id },
            { requesterId: user2.id, addresseeId: user1.id },
          ],
        },
      });
      await prisma.user.deleteMany({
        where: {
          id: { in: [user1.id, user2.id] },
        },
      });
    }

    await prisma.$disconnect();
  });

  it("should send a message successfully", (done) => {
    const token = jwt.sign({ id: user1.id, email: "testuser1@example.com" }, JWT_SECRET);
    clientSocket = Client(`http://localhost:${port}`, {
      auth: { token: `Bearer ${token}` },
    });

    clientSocket.on("connect", () => {
      clientSocket.emit("send_message", { receiverId: user2.id, content: "Test message" });
    });

    clientSocket.on("receive_message", (data: any) => {
      expect(data.senderId).toBe(user1.id);
      expect(data.senderUsername).toBe("testuser1");
      expect(data.senderAvatar).toBeNull();
      expect(data.receiverId).toBeUndefined(); // Not in payload
      expect(data.content).toBe("Test message");
      expect(data.timestamp).toBeDefined();
      done();
    });

    clientSocket.on("message_error", (error: any) => {
      done(new Error(`Erreur reçue: ${error.message}`));
    });
  }, 10000);
});
