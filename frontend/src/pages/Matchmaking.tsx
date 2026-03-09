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

const backButtonClass =
  "relative flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md " +
  "transition-colors bg-pong-surface text-pong-text/70 " +
  "hover:bg-pong-accent/10 hover:text-pong-accent focus:outline-none";

export default function Matchmaking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { socket } = useSocket();

  const boardSize = parseBoardSize(searchParams.get("boardSize"));

  /* Issue #209 — customization before searching */
  const { customization, setTheme, setSymbols } = useGameCustomization();

  const [status, setStatus] = useState<
    "setup" | "idle" | "connecting" | "searching" | "found" | "cancelled"
  >("setup");
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

  /** Transition from setup to searching. */
  function handleStartSearch() {
    if (!navigator.onLine) {
      setError("You are offline. Reconnect to the internet then try again.");
      return;
    }
    if (!socket) {
      setStatus("connecting");
      return;
    }
    if (!socket.connected) {
      setStatus("connecting");
      socket.connect();
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

  /* No longer auto-start searching — wait for user to click "Find Opponent" */

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

  /* ── Setup phase — pick theme & symbols before queuing ─────────────── */
  if (status === "setup") {
    return (
      <div className="min-h-screen w-full px-4 pt-4">
        <div className="flex w-full justify-start">
          <button
            type="button"
            onClick={() => void navigate("/lobby")}
            className={backButtonClass}
          >
            <span className="text-base leading-none">&larr;</span>
            <span>Back to Lobby</span>
          </button>
        </div>

        <div className="mx-auto flex max-w-lg flex-col items-center gap-6 pt-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-pong-accent">Play Online</h1>
            <p className="mt-1 text-sm text-pong-text/60">
              Customize your game, then find an opponent.
            </p>
          </div>

          {/* Theme picker */}
          <section className="w-full">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-pong-text/50">
              Theme
            </h2>
            <ThemeSelector selected={customization.theme} onSelect={setTheme} />
          </section>

          {/* Symbol picker */}
          <section className="w-full">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-pong-text/50">
              Symbols
            </h2>
            <CustomSymbolSelector
              symbols={customization.symbols}
              onSelect={setSymbols}
            />
          </section>

          {error && <p className="text-center text-sm text-red-400">{error}</p>}

          <Button
            variant="primary"
            onClick={handleStartSearch}
            className="mt-2 px-8 py-3 text-lg"
          >
            Find Opponent
          </Button>
        </div>
      </div>
    );
  }

  /* ── Searching / found / error phases ──────────────────────────────── */
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
        <SearchingScreen queuePosition={queuePosition} onCancel={leaveMatchmaking} />
      ) : status === "found" ? (
        <Card variant="elevated" className="text-center">
          <div className="space-y-3" role="status" aria-live="polite">
            <div className="text-5xl">&#x2713;</div>
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
