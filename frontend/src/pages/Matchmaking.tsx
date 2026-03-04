import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useSocket } from "../context/SocketContext";
import Card from "../components/Card";
import Button from "../components/Button";
import SearchingScreen from "../components/Matchmaking/SearchingScreen";

type MatchFound = {
  gameId: number;
  opponent: { username: string };
  yourSymbol: "X" | "O";
};

export default function Matchmaking() {
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [status, setStatus] = useState<'idle' | 'searching' | 'found' | 'cancelled'>('idle');
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<MatchFound | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearRedirectTimer() {
    if (!redirectTimerRef.current) return;
    clearTimeout(redirectTimerRef.current);
    redirectTimerRef.current = null;
  }

  useEffect(() => {
    if (!socket) return;

    function onSearching({ position }: { position?: number }) {
      setStatus("searching");
      if (position != null) setQueuePosition(position);
    }

    function onMatchFound({ gameId, opponent, yourSymbol }: MatchFound) {
      clearRedirectTimer();
      setStatus("found");
      setMatchData({ gameId, opponent, yourSymbol });
      redirectTimerRef.current = setTimeout(() => {
        void navigate(`/game/${gameId}`);
      }, 1500);
    }

    function onSearchCancelled() {
      clearRedirectTimer();
      setStatus('cancelled');
      void navigate("/lobby");
    }

    function onError({ message }: { message?: string }) {
      clearRedirectTimer();
      setError(message || "Something went wrong.");
      setStatus("idle");
    }

    function onDisconnect() {
      clearRedirectTimer();
      setError("Connection lost. Please check your network and try again.");
      setStatus("idle");
    }

    socket.on("searching", onSearching);
    socket.on("match_found", onMatchFound);
    socket.on("search_cancelled", onSearchCancelled);
    socket.on("error", onError);

    socket.on("disconnect", onDisconnect);

    return () => {
      clearRedirectTimer();
      socket.off("searching", onSearching);
      socket.off("match_found", onMatchFound);
      socket.off("search_cancelled", onSearchCancelled);
      socket.off("error", onError);

      socket.off("disconnect", onDisconnect);
    };
  }, [socket, navigate]);

  const startedRef = useRef(false);
  useEffect(() => {
    if (!socket) return;
    if (startedRef.current) return;

    startedRef.current = true;
    setQueuePosition(null);
    setMatchData(null);
    setError(null);
    setStatus("searching");
    socket.emit("find_game");
  }, [socket]);

  useEffect(() => {
    return () => {
      if (socket && status === "searching") socket.emit("cancel_search");
    };
  }, [socket, status]);

  function leaveMatchmaking() {
    if (status === "found") return;
    clearRedirectTimer();
    if (socket) socket.emit("cancel_search");
    void navigate("/lobby");
  }

  function handleRetry() {
    if (!navigator.onLine) {
      setError("You are offline. Reconnect to the internet then try again.");
      return;
    }
    if (!socket) {
      setError("Not connected. Please refresh the page.");
      return;
    }
    setQueuePosition(null);
    setMatchData(null);
    setError(null);
    clearRedirectTimer();
    setStatus("searching");
    socket.emit("find_game");
  }

  const backButtonClass =
    "relative flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md " +
    "transition-colors bg-pong-surface text-pong-text/70 " +
    "hover:bg-pong-accent/10 hover:text-pong-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="w-full max-w-lg space-y-6">
      <button
        type="button"
        className={backButtonClass}
        onClick={leaveMatchmaking}
        disabled={status === "found"}
      >
        ← Back to Lobby
      </button>

      {error ? (
        <Card variant="elevated">
          <p className="text-sm font-semibold text-red-400">Matchmaking error</p>
          <p className="mt-2 text-sm text-pong-text/70">{error}</p>
          <Button variant="primary" className="w-full mt-4 py-3 text-base" onClick={handleRetry}>
            Try again
          </Button>
        </Card>
      ) : status === "searching" ? (
        <SearchingScreen queuePosition={queuePosition} onCancel={leaveMatchmaking} />
      ) : status === "found" ? (
        <Card variant="elevated" className="text-center">
          <div className="space-y-3" role="status" aria-live="polite">
            <div className="text-5xl">✓</div>
            <h1 className="text-3xl font-bold text-pong-text">Match Found!</h1>
            <p className="text-sm text-pong-text/60">Joining game…</p>

            {matchData ? (
              <p className="text-xs text-pong-text/40">
                vs <span className="font-semibold">{matchData.opponent.username}</span> — you are{" "}
                <span className="font-semibold">{matchData.yourSymbol}</span>
              </p>
            ) : null}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
