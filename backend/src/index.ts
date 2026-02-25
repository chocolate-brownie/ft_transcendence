// ─── ft_transcendence Backend ──────────────────────────────────────────────
// Express + HTTPS + Socket.io server
// This is the entry point — server setup and route mounting only.
// All business logic lives in services/, controllers handle HTTP, routes define URLs.

import express from "express";
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "./lib/prisma";

// Route imports
import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/users.routes";
import friendsRoutes from "./routes/friends.routes";
import gamesRoutes from "./routes/games.routes";
import chatRoutes from "./routes/chat.routes";
import tournamentsRoutes from "./routes/tournaments.routes";

// ─── Initialize ────────────────────────────────────────────────────────────

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ─── Middleware ─────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: ["https://localhost:5173", "http://localhost:5173"],
    credentials: true,
  }),
);
app.use(express.json());

// Serve uploaded files (avatars, etc.) as static assets
// Example: GET /uploads/avatars/42-1709049600000.jpg
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ─── Routes ────────────────────────────────────────────────────────────────

// Health check — verifies the server + database are alive
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch {
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      database: "disconnected",
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/games", gamesRoutes);
app.use("/api/messages", chatRoutes);
app.use("/api/tournaments", tournamentsRoutes);

// ─── Global error handler ──────────────────────────────────────────────────
// Catches any error passed via next(err) or thrown synchronously in a route.
// Must have exactly 4 parameters so Express recognises it as an error handler.
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("[Global Error Handler]", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// Export app for testing (Supertest uses the Express app directly)
export { app };

// ─── HTTPS Server + Socket.io ──────────────────────────────────────────────

const certPath = path.join(__dirname, "..", "certs", "cert.pem");
const keyPath = path.join(__dirname, "..", "certs", "key.pem");

let server: https.Server | http.Server;

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const httpsOptions = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
  };
  server = https.createServer(httpsOptions, app);
  console.log("HTTPS mode enabled");
} else {
  console.warn("No SSL certs found, falling back to HTTP");
  server = http.createServer(app);
}

// Attach Socket.io to the HTTPS server
const io = new SocketIOServer(server, {
  cors: {
    origin: ["https://localhost:5173", "http://localhost:5173"],
    credentials: true,
  },
});

/** ref: https://socket.io/docs/v4/middlewares/
 * [x] Add JWT authentication to Socket.io connection handshake */
io.use((socket: Socket, next: (err?: Error) => void) => {
  /* if auth exists, get token. If auth is undefined, just return undefined instead of crashing. */
  const token = socket.handshake.auth?.token;

  if (!token || !token.startsWith("Bearer ")) {
    return next(new Error("No token provided"));
  }

  try {
    // veryify the validity of the jwt token
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET!);
    socket.data.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return next(new Error("Token expired"));
    }
    return next(new Error("Invalid token"));
  }
});

// Basic Socket.io connection handler

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  const userId = socket.data.user.id;

  // Each user joins a personal room so others can send them targeted events
  void socket.join(`user:${userId}`);

  // [x] On connect: set user `isOnline = true` in database
  prisma.user
    .update({ where: { id: userId }, data: { isOnline: true } })
    .catch((error) => console.error("Failed to set user online:", error));

  // [x] Broadcast online status to friends
  notifyFriends(userId, "user_online").catch(console.error);

  // [x] On disconnect: set user `isOnline = false` in database + notify friends
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);

    prisma.user
      .update({ where: { id: userId }, data: { isOnline: false } })
      .catch((error) => console.error("Failed to set user offline:", error));

    // [x] Broadcast online status to friends
    notifyFriends(userId, "user_offline").catch(console.error);
  });
});

// ─── Start ─────────────────────────────────────────────────────────────────
// Skip listening when imported by tests (Supertest binds its own ephemeral port)

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`\nBackend running on https://0.0.0.0:${PORT}`);
    console.log(`Health check: https://localhost:${PORT}/api/health\n`);
  });
}

// Graceful shutdown
const shutdown = () => {
  console.log("\nShutting down...");
  prisma.$disconnect().catch(() => {});
  server.close(() => process.exit(0));
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Catch unhandled promise rejections — prevents Node.js from crashing and
// logs the actual error so we can see what went wrong.
process.on("unhandledRejection", (reason) => {
  console.error("[Unhandled Rejection]", reason);
});

// ─── Utils functions ─────────────────────────────────────────────────────────────────
async function notifyFriends(userId: number, event: "user_online" | "user_offline") {
  const friends = await prisma.friend.findMany({
    where: {
      OR: [{ requesterId: userId }, { addresseeId: userId }],
      status: "ACCEPTED",
    },
  });

  friends.forEach((friend) => {
    const friendId =
      friend.requesterId === userId ? friend.addresseeId : friend.requesterId;
    io.to(`user:${friendId}`).emit(event, { userId });
  });
}
