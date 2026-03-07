// The bridge between React world and socket services
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type { Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { connectSocket, disconnectSocket } from "../services/socket.service";

type SocketContextType = {
  socket: Socket | null;
  activeGameId: number | null;
  clearActiveGame: () => void;
};

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeGameId, setActiveGameId] = useState<number | null>(null);

  const clearActiveGame = useCallback(() => setActiveGameId(null), []);

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
      setActiveGameId(null);
    }

    return () => {
      disconnectSocket();
      setSocket(null);
      setActiveGameId(null);
    };
  }, [userId]);

  // Listen for active_game / game end events at the context level so the
  // state survives route changes. Use functional updater in onGameEnd so
  // the callback only clears when the event's gameId matches the current
  // activeGameId (avoids stale closures and unrelated events).
  useEffect(() => {
    if (!socket) return;

    function onActiveGame({ gameId }: { gameId: number }) {
      setActiveGameId(gameId);
    }
    function onGameEnd({ gameId }: { gameId?: number }) {
      setActiveGameId((current) => {
        if (gameId !== undefined && gameId !== current) return current;
        return null;
      });
    }

    socket.on("active_game", onActiveGame);
    socket.on("game_over", onGameEnd);
    socket.on("game_forfeited", onGameEnd);
    socket.on("game_already_ended", onGameEnd);

    return () => {
      socket.off("active_game", onActiveGame);
      socket.off("game_over", onGameEnd);
      socket.off("game_forfeited", onGameEnd);
      socket.off("game_already_ended", onGameEnd);
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, activeGameId, clearActiveGame }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used inside <SocketProvider>");
  return ctx;
}
