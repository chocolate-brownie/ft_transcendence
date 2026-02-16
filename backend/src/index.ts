// ─── ft_transcendence Backend ──────────────────────────────────────────────
// Express + HTTPS + Socket.io server
// This is the entry point — server setup and route mounting only.
// All business logic lives in services/, controllers handle HTTP, routes define URLs.

import express from "express";
import https from "https";
import fs from "fs";
import path from "path";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
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

// ─── HTTPS Server + Socket.io ──────────────────────────────────────────────

const certPath = path.join(__dirname, "..", "certs", "cert.pem");
const keyPath = path.join(__dirname, "..", "certs", "key.pem");

let server: https.Server;

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const httpsOptions = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
  };
  server = https.createServer(httpsOptions, app);
  console.log("HTTPS mode enabled");
} else {
  console.warn("No SSL certs found, falling back to HTTP");
  const http = require("http");
  server = http.createServer(app);
}

// Attach Socket.io to the HTTPS server
const io = new SocketIOServer(server, {
  cors: {
    origin: ["https://localhost:5173", "http://localhost:5173"],
    credentials: true,
  },
});

// Basic Socket.io connection handler
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// ─── Start ─────────────────────────────────────────────────────────────────

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\nBackend running on https://0.0.0.0:${PORT}`);
  console.log(`Health check: https://localhost:${PORT}/api/health\n`);
});

// Graceful shutdown
const shutdown = () => {
  console.log("\nShutting down...");
  prisma.$disconnect().catch(() => {});
  server.close(() => process.exit(0));
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
