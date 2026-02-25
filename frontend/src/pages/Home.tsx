import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import Button from "../components/Button";

type HealthStatus = {
  status: string;
  timestamp: string;
  database: string;
} | null;

export default function Home() {
  const [health, setHealth] = useState<HealthStatus>(null);
  const [error, setError] = useState<string | null>(null);
  const [socketStatus, setSocketStatus] = useState<"ok" | "error" | "loading">("loading");

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
      <div className="flex flex-col items-stretch gap-4 w-96 mb-6">
        <img src="/logo.png" alt="GridWars" className="w-full" />
        <p className="text-pong-text/60 text-sm text-center -mt-2">
          The Ultimate Multiplayer Tic-Tac-Toe Experience
        </p>
        <div className="flex flex-col gap-3">
          <Link to="/game">
            <Button variant="primary" className="w-full py-3 text-base">
              Play Now
            </Button>
          </Link>
          <Link to="/signup">
            <Button variant="secondary" className="w-full py-3 text-base">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>

      {/* Login link */}
      <p className="text-sm text-pong-text/40">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-pong-accent hover:text-pong-accentDark transition-colors"
        >
          Log in
        </Link>
      </p>

      {/* System Status — fixed bottom-left, compact */}
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
    </div>
  );
}
