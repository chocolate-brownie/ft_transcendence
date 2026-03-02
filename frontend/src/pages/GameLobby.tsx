import { useNavigate } from "react-router-dom";
import GameModeCard from "../components/Lobby/GameModeCard";
import Button from "../components/Button";
import { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";

type AiDifficulty = "easy" | "medium" | "hard";

export default function GameLobby() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty>("medium");

  useEffect(() => {
    if (!socket) return;

    function onMatchFound(payload: { gameId: number }) {
      setIsSearching(false);
      void navigate(`/game/${payload.gameId}`);
    }

    function onSearchCancelled() {
      setIsSearching(false);
    }

    function onError(payload: { message: string }) {
      setIsSearching(false);
      setSearchError(payload.message);
    }

    socket.on("match_found", onMatchFound);
    socket.on("search_cancelled", onSearchCancelled);
    socket.on("error", onError);

    return () => {
      socket.off("match_found", onMatchFound);
      socket.off("search_cancelled", onSearchCancelled);
      socket.off("error", onError);
    };
  }, [socket, navigate]);

  function handleFindGame() {
    if (!socket) {
      setSearchError("Not connected. Please refresh the page.");
      return;
    }
    setSearchError(null);
    setIsSearching(true);
    socket.emit("find_game");
  }

  function handleCancelSearch() {
    if (!socket) return;
    socket.emit("cancel_search");
  }

  return (
    <div className="w-full max-w-6xl space-y-10 py-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-pong-accent">Choose Game Mode</h1>
        <p className="mt-2 text-pong-text/70">
          Pick your battlefield and enter the arena.
        </p>
        <div className="mt-3 flex items-center justify-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-pong-accent" />
          <span className="h-1.5 w-1.5 rounded-full bg-pong-secondary" />
          <span className="h-1.5 w-1.5 rounded-full bg-shadow-grey-300" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <GameModeCard
          imageSrc="/playlocal.png"
          imageAlt="Play local mode"
          title="Play Local"
          description="Play with a friend on the same device"
          buttonText="Start Local Game"
          onClick={() => void navigate("/game/local")}
          color="blue"
        />

        <GameModeCard
          imageSrc="/playonline.png"
          imageAlt="Play online mode"
          title="Play Online"
          description="Play against a friend or find a match"
          buttonText={isSearching ? "Searching..." : "Find Match"}
          onClick={isSearching ? handleCancelSearch : handleFindGame}
          color="green"
          loading={isSearching}
        />

        <GameModeCard
          imageSrc="/playvsai.png"
          imageAlt="Play versus AI mode"
          title="Play vs AI"
          description="Challenge the computer"
          buttonText="Start AI Game"
          onClick={() => {}}
          color="neutral"
          disabled
          badgeText="Coming Soon"
        >
          <div className="w-full">
            <label
              htmlFor="ai-difficulty"
              className="mb-1 block text-xs font-medium text-pong-text/50"
            >
              Difficulty
            </label>
            <select
              id="ai-difficulty"
              value={aiDifficulty}
              onChange={(e) => setAiDifficulty(e.target.value as AiDifficulty)}
              className="w-full rounded-lg border border-black/10 bg-black/5 px-3 py-2 text-sm text-pong-text/60 focus:outline-none"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </GameModeCard>
      </div>

      {searchError ? (
        <p className="text-center text-sm text-red-500">{searchError}</p>
      ) : null}

      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-pong-text/40">or</span>
        <Button variant="secondary" onClick={() => void navigate("/")}>
          Back to Home
        </Button>
      </div>
    </div>
  );
}
