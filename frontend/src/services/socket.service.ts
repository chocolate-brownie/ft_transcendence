import { io, Socket } from "socket.io-client";

// - One socket instance app-wide (socket variable).
// - connectSocket creates it once and reuses it.
// - disconnectSocket safely closes and resets it.
// - getSocket lets Context/components read current instance.
let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket) return socket;

  const authToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

  socket = io(import.meta.env.VITE_SOCKET_URL || "https://localhost:3000", {
    auth: { token: authToken },
    reconnection: true,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connect_error:", error.message);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
