// The bridge between React world and socket services
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { connectSocket, disconnectSocket } from "../services/socket.service";

type SocketContextType = {
  socket: Socket | null;
};

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  // Depend on the user's id (stable primitive) rather than the user object reference
  // to avoid spurious disconnect/reconnect cycles on re-renders.
  const userId = user?.id ?? null;

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (userId !== null && token) {
      const s = connectSocket(token);
      setSocket(s);
    } else {
      disconnectSocket();
      setSocket(null);
    }

    return () => {
      disconnectSocket();
      setSocket(null);
    };
  }, [userId]);

  return <SocketContext.Provider value={{ socket }}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used inside <SocketProvider>");
  return ctx;
}
