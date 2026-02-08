// ─── ft_transcendence Backend ──────────────────────────────────────────────
// Express + HTTPS + Socket.io server
// Think of this like main() in C — everything starts here.

import express from "express";
import https from "https";
import fs from "fs";
import path from "path";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import { PrismaClient } from "@prisma/client";

// ─── Initialize ────────────────────────────────────────────────────────────

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT) || 3000;

// ─── Middleware ─────────────────────────────────────────────────────────────
// Middleware = functions that run on EVERY request before your route handler.
// Like a pipeline: Request → cors → json parser → your route handler → Response

app.use(
  cors({
    origin: ["https://localhost:5173", "http://localhost:5173"],
    credentials: true,
  }),
);
app.use(express.json()); // Parse JSON bodies (like scanf but for HTTP)

// ─── Routes ────────────────────────────────────────────────────────────────

// Health check — verifies the server + database are alive
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`; // Ping the database
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      database: "disconnected",
    });
  }
});

// Placeholder for future API routes
app.get("/api", (_req, res) => {
  res.json({
    message: "ft_transcendence API",
    version: "1.0.0",
    endpoints: ["/api/health"],
  });
});

// ─── HTTPS Server + Socket.io ──────────────────────────────────────────────

const certPath = path.join(__dirname, "..", "certs", "cert.pem");
const keyPath = path.join(__dirname, "..", "certs", "key.pem");

let server: https.Server;

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  // Production-like: HTTPS with self-signed cert
  const httpsOptions = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
  };
  server = https.createServer(httpsOptions, app);
  console.log("🔒 HTTPS mode enabled");
} else {
  // Fallback: HTTP (should not happen with entrypoint.sh)
  console.warn("⚠️  No SSL certs found, falling back to HTTP");
  // TypeScript trick: http.Server and https.Server are compatible for Socket.io
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
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ─── Start ─────────────────────────────────────────────────────────────────

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Backend running on https://0.0.0.0:${PORT}`);
  console.log(`   Health check: https://localhost:${PORT}/api/health\n`);
});

// Graceful shutdown (like signal handlers in C)
const shutdown = async () => {
  console.log("\n🛑 Shutting down...");
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
