import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import type { BoardSize } from "../types/game";
import { useSocket } from "../context/SocketContext";
import Card from "../components/Card";
import Button from "../components/Button";
import SearchingScreen from "../components/Matchmaking/SearchingScreen";
import ThemeSelector from "../components/Customization/ThemeSelector";
import CustomSymbolSelector from "../components/Customization/SymbolSelector";
import { useGameCustomization } from "../hooks/useGameCustomization";

type MatchFound = {
  gameId: number;
  opponent: { username: string };
  yourSymbol: "X" | "O";
};

function parseBoardSize(value: string | null): BoardSize {
  if (value === "4") return 4;
  if (value === "5") return 5;
  return 3;
}

export default function Matchmaking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { socket } = useSocket();

  const boardSize = parseBoardSize(searchParams.get("boardSize"));

  /* Issue #209 — customization while searching */
  const { customization, setTheme, setSymbols } = useGameCustomization();

  const [status, setStatus] = useState<
    "idle" | "connecting" | "searching" | "found" | "cancelled"
  >("idle");
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<MatchFound | null>(null);

  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);
  const cancelledRef = useRef(false);

  function clearRedirectTimer() {
    if (!redirectTimerRef.current) return;
    clearTimeout(redirectTimerRef.current);
    redirectTimerRef.current = null;
  }

  function emitFindGame() {
    if (!socket) return;
    socket.emit("find_game", { boardSize });
  }

  function handleRetry() {
    if (!navigator.onLine) {
      setError("You are offline. Reconnect to the internet then try again.");
      return;
    }
    if (!socket) {
      setStatus("connecting");
      setError("Still connecting to server. Please try again in a moment.");
      return;
    }
    if (!socket.connected) {
      socket.connect();
      setStatus("connecting");
      setError("Reconnecting to server. Please try again in a moment.");
      return;
    }
    startedRef.current = true;
    setQueuePosition(null);
    setMatchData(null);
    setError(null);
    clearRedirectTimer();
    setStatus("searching");
    emitFindGame();
  }

  function leaveMatchmaking() {
    if (status === "found") return;
    clearRedirectTimer();
    if (socket) {
      cancelledRef.current = true;
      socket.emit("cancel_search");
    }
    void navigate("/lobby");
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
      setStatus("cancelled");
      void navigate("/lobby");
    }

    function onError({ message }: { message?: string }) {
      clearRedirectTimer();
      setError(message || "Something went wrong.");
      setStatus("idle");
      startedRef.current = false;
    }

    function onDisconnect() {
      clearRedirectTimer();
      setError("Connection lost. Please check your network and try again.");
      setStatus("idle");
      startedRef.current = false;
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

  useEffect(() => {
    function startSearch() {
      if (!socket || startedRef.current) return;

      startedRef.current = true;
      setQueuePosition(null);
      setMatchData(null);
      setError(null);
      setStatus("searching");
      socket.emit("find_game", { boardSize });
    }

    if (startedRef.current) return;

    if (!socket) {
      setStatus("connecting");
      return;
    }

    if (!socket.connected) {
      setStatus("connecting");
      socket.once("connect", startSearch);
      socket.connect();

      return () => {
        socket.off("connect", startSearch);
      };
    }

    startSearch();
  }, [socket, boardSize]);

  useEffect(() => {
    return () => {
      clearRedirectTimer();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (socket && status === "searching" && !cancelledRef.current) {
        socket.emit("cancel_search");
      }
    };
  }, [socket, status]);

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-4">
      {error ? (
        <Card variant="elevated">
          <p className="text-sm font-semibold text-red-400">Matchmaking error</p>
          <p className="mt-2 text-sm text-pong-text/70">{error}</p>
          <Button
            variant="primary"
            className="mt-4 w-full py-3 text-base"
            onClick={handleRetry}
          >
            Try again
          </Button>
        </Card>
      ) : status === "connecting" ? (
        <Card variant="elevated" className="text-center">
          <div className="space-y-4">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-pong-secondary border-t-transparent" />
            <h1 className="text-2xl font-bold text-pong-text">
              Connecting to matchmaking…
            </h1>
            <p className="text-sm text-pong-text/60">
              We are establishing a live connection before joining the queue.
            </p>
            <Button
              variant="secondary"
              className="w-full py-3 text-base"
              onClick={handleRetry}
            >
              Retry Connection
            </Button>
          </div>
        </Card>
      ) : status === "searching" ? (
        <div className="w-full max-w-lg space-y-4">
          <SearchingScreen queuePosition={queuePosition} onCancel={leaveMatchmaking} />

          {/* Issue #209 — customize while searching */}
          <div className="rounded-lg border border-pong-accent/20 bg-pong-surface px-6 py-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-pong-text/50">
              Customize while you wait
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-xs font-medium text-pong-text/40">Theme</h3>
                <ThemeSelector selected={customization.theme} onSelect={setTheme} />
              </div>
              <div>
                <h3 className="mb-2 text-xs font-medium text-pong-text/40">Symbols</h3>
                <CustomSymbolSelector
                  symbols={customization.symbols}
                  onSelect={setSymbols}
                />
              </div>
            </div>
          </div>
        </div>
      ) : status === "found" ? (
        <Card variant="elevated" className="text-center">
          <div className="space-y-3" role="status" aria-live="polite">
            <div className="text-5xl">✓</div>
            <h1 className="text-3xl font-bold text-pong-text">Match Found!</h1>
            <p className="text-sm text-pong-text/60">Joining game…</p>
            {matchData ? (
              <p className="text-xs text-pong-text/40">
                vs <span className="font-semibold">{matchData.opponent.username}</span> —{" "}
                you are <span className="font-semibold">{matchData.yourSymbol}</span>
              </p>
            ) : null}
          </div>
        </Card>
      ) : (
        <Card variant="elevated" className="text-center">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-pong-text">Ready to search</h1>
            <p className="text-sm text-pong-text/60">
              Start matchmaking when your connection is available.
            </p>
            <Button
              variant="primary"
              className="w-full py-3 text-base"
              onClick={handleRetry}
            >
              Start Matchmaking
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
