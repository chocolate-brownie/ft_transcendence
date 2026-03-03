import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useSocket } from "../context/SocketContext";
import Card from "../components/Card";
import Button from "../components/Button";
import SearchingScreen from "../components/Matchmaking/SearchingScreen";

type MatchmakingStatus = "idle" | "searching" | "found";
type PlayerSymbol = "X" | "O";
type Opponent = {
  id: number;
  username: string;
  avatarUrl: string | null;
};

type MatchFound = {
  gameId: number;
  opponent: Opponent;
  yourSymbol: PlayerSymbol;
  room?: string;
};

export default function Matchmaking() {
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [status, setStatus] = useState<MatchmakingStatus>("idle");
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [matchData, setMatchData] = useState<MatchFound | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isCancelling, setIsCancelling] = useState(false);

  const startedRef = useRef(false);

  useEffect(() => {
    if (!socket) return;

    function onSearching(payload: { position?: number }) {
      setStatus("searching");
      if (typeof payload.position === "number") setQueuePosition(payload.position);
    }

    function onMatchFound(payload: MatchFound) {
      setStatus("found");
      setMatchData(payload);
      setIsCancelling(false);

      window.setTimeout(() => {
        void navigate(`/game/${payload.gameId}`);
      }, 1500);
    }

    function onSearchCancelled() {
      setIsCancelling(false);
      void navigate("/lobby");
    }

    function onError(payload: { message?: string }) {
      setError(payload?.message ?? "Something went wrong.");
      setStatus("idle");
      setIsCancelling(false);
    }

    socket.on("searching", onSearching);
    socket.on("match_found", onMatchFound);
    socket.on("search_cancelled", onSearchCancelled);
    socket.on("error", onError);

    if (!startedRef.current) {
      startedRef.current = true;
      setQueuePosition(null);
      setMatchData(null);
      setError(null);
      setIsCancelling(false);
      setStatus("searching");
      socket.emit("find_game");
    }

    return () => {
      socket.off("searching", onSearching);
      socket.off("match_found", onMatchFound);
      socket.off("search_cancelled", onSearchCancelled);
      socket.off("error", onError);
    };
  }, [socket, navigate]);

  useEffect(() => {
    return () => {
      if (socket && status === "searching") socket.emit("cancel_search");
    };
  }, [socket, status]);

  function handleCancel() {
    if (!socket) return;
    if (status !== "searching") return;

    setIsCancelling(true);
    socket.emit("cancel_search");
  }

  function handleBackToLobby() {
    if (socket && status === "searching") socket.emit("cancel_search");
    void navigate("/lobby");
  }

  function handleRetry() {
    if (!socket) {
      setError("Not connected. Please refresh the page.");
      return;
    }
    setQueuePosition(null);
    setMatchData(null);
    setError(null);  
    setIsCancelling(false);
    startedRef.current = false;
    setStatus("searching");
    socket.emit("find_game");
  }

  const backButtonClass =
    "relative flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md " +
    "transition-colors bg-pong-surface text-pong-text/70 " +
    "hover:bg-pong-accent/10 hover:text-pong-accent focus:outline-none";

    return (
    <div className="w-full max-w-lg space-y-6">
      <button type="button" className={backButtonClass} onClick={handleBackToLobby}>
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
        <SearchingScreen queuePosition={queuePosition} onCancel={handleCancel} isCancelling={isCancelling} />
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