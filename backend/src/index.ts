// ─── ft_transcendence Backend ──────────────────────────────────────────────
// Express + HTTPS + Socket.io server entrypoint.
// App/route wiring lives here; socket behavior is delegated to socket/* modules.

import express from "express";
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import prisma from "./lib/prisma";
import { socketAuthMiddleware } from "./socket/auth";
import { registerSocketHandlers } from "./socket";

// Route imports
import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/users.routes";
import friendsRoutes from "./routes/friends.routes";
import gamesRoutes from "./routes/games.routes";
import chatRoutes from "./routes/chat.routes";
import tournamentsRoutes from "./routes/tournaments.routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ─── Routes ────────────────────────────────────────────────────────────────

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
if (
  process.env.NODE_ENV !== "test" &&
  fs.existsSync(certPath) &&
  fs.existsSync(keyPath)
) {
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

const io = new SocketIOServer(server, {
  cors: {
    origin: ["https://localhost:5173", "http://localhost:5173"],
    credentials: true,
  },
});

app.set("io", io);

io.use(socketAuthMiddleware);

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);
  registerSocketHandlers(io, socket);
});

// ─── Start ─────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`\nBackend running on https://0.0.0.0:${PORT}`);
    console.log(`Health check: https://localhost:${PORT}/api/health\n`);
  });
}

const shutdown = () => {
  console.log("\nShutting down...");
  prisma.$disconnect().catch(() => {});
  server.close(() => process.exit(0));
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

process.on("unhandledRejection", (reason) => {
  console.error("[Unhandled Rejection]", reason);
});
