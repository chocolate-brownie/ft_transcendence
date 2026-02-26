import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";

type HealthStatus = {
  status: string;
  timestamp: string;
  database: string;
} | null;

/**
 * Render the Grid Wars home page with hero content, call-to-action buttons, feature pills, and a development-only system status panel.
 *
 * The component adapts its hero copy and CTAs based on authentication state, performs a one-time fetch to the `/api/health`
 * endpoint, and opens a Socket.IO connection to track WebSocket status for the DEV-only status panel.
 *
 * @returns The Home page JSX element
 */
export default function Home() {
  const [health, setHealth] = useState<HealthStatus>(null);
  const [error, setError] = useState<string | null>(null);
  const [socketStatus, setSocketStatus] = useState<"ok" | "error" | "loading">("loading");
  const { user } = useAuth();

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    const socket = io({ path: "/socket.io" });
    socket.on("connect", () => setSocketStatus("ok"));
    socket.on("connect_error", () => setSocketStatus("error"));
    return () => {
      socket.disconnect();
    };
  }, []);

  const statusItems: { label: string; status: "ok" | "error" | "loading" }[] = [
    { label: "Frontend", status: "ok" },
    {
      label: "Backend",
      status: health ? "ok" : error ? "error" : "loading",
    },
    {
      label: "Database",
      status: health?.database === "connected" ? "ok" : error ? "error" : "loading",
    },
    { label: "WebSocket", status: socketStatus },
  ];

  const dotColor = {
    ok: "bg-green-500",
    error: "bg-red-500",
    loading: "bg-yellow-500 animate-pulse",
    pending: "bg-gray-400",
  };

  return (
    <div className="flex flex-col items-center text-center">
      {/* Hero — logo + buttons share the same width */}
      <div className="flex flex-col items-stretch gap-5 w-full max-w-3xl mb-10 px-4">
        <img src="/grid-wars-hero.png" alt="GridWars" className="w-80 md:w-96 mx-auto" />
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-pong-text/95">
          Grid Wars
        </h1>
        {user ? (
          <p className="text-sm md:text-base text-pong-text/70 max-w-2xl mx-auto">
            Welcome back, <span className="font-semibold text-pong-text/90">{user.username}</span>. Ready for another match?
          </p>
        ) : (
          <p className="text-sm md:text-base text-pong-text/70 max-w-2xl mx-auto">
            Experience the classic game of Tic-Tac-Toe reimagined with real-time multiplayer,
            global leaderboards, and advanced AI opponents.
          </p>
        )}

        {user ? (
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/game" className="flex-1">
              <Button
                variant="primary"
                className="w-full py-3.5 text-lg transition transform hover:scale-[1.02]"
              >
                Enter the Arena
              </Button>
            </Link>
            <Link to="/profile" className="flex-1">
              <Button
                variant="secondary"
                className="w-full py-3.5 text-lg transition transform hover:scale-[1.02]"
              >
                View Profile
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/signup" className="flex-1">
              <Button
                variant="primary"
                className="w-full py-3.5 text-lg transition transform hover:scale-[1.02]"
              >
                Join the Arena
              </Button>
            </Link>
            <Link to="/login" className="flex-1">
              <Button
                variant="secondary"
                className="w-full py-3.5 text-lg transition transform hover:scale-[1.02]"
              >
                Member Login
              </Button>
            </Link>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {[
            { label: "Real-Time", icon: "/realtime.svg", to: "/game" },
            { label: "Minimax AI", icon: "/aibot.svg", to: null },
            { label: "Tournaments", icon: "/tournement.svg", to: "/tournaments" },
            { label: "Social Chat", icon: "/chat.svg", to: null },
          ].map(({ label, icon, to }) =>
            to ? (
              <Link
                key={label}
                to={to}
                className="flex items-center gap-3 rounded-full border border-pong-text/20 bg-white/5 px-3.5 py-1.5 text-sm font-semibold uppercase tracking-wide text-pong-text/70 transition hover:border-pong-secondary hover:bg-pong-secondary hover:text-white"
              >
                <img src={icon} alt="" className="h-5 w-5" />
                {label}
              </Link>
            ) : (
              <span
                key={label}
                title="Coming soon"
                className="flex items-center gap-3 rounded-full border border-pong-text/10 bg-white/5 px-3.5 py-1.5 text-sm font-semibold uppercase tracking-wide text-pong-text/30 cursor-not-allowed select-none"
              >
                <img src={icon} alt="" className="h-5 w-5 opacity-40" />
                {label}
              </span>
            ),
          )}
        </div>
      </div>

      {/* System Status — dev only */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-16 left-4 bg-white/30 backdrop-blur-md border border-black/10 rounded-lg px-3 py-2 shadow-sm">
          <p className="text-pong-text/40 text-xs font-medium mb-1.5 uppercase tracking-wide">
            Status
          </p>
          <div className="space-y-1">
            {statusItems.map(({ label, status }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${dotColor[status]}`} />
                <span className="text-xs text-pong-text/60">{label}</span>
              </div>
            ))}
          </div>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
