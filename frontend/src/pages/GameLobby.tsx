import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

export default function GameLobby() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold text-pong-text">Game Lobby</h1>
      <p className="text-sm text-pong-text/60">
        Later here: matchmaking, invites...
      </p>
      <Link to="/game/demo">
        <Button variant="primary" className="mt-2">
          Preview game board
        </Button>
      </Link>
      <div className="mt-6 w-full max-w-5xl">
        <h2 className="mb-3 text-lg font-semibold text-pong-text text-center">Game Modes</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Local Game (enabled) */}
          <button
            type="button"
            onClick={() => navigate("/game/local")}
            className={
              "w-full rounded-2xl border border-white/10 bg-pong-surface p-4 text-left " +
              "transition-colors hover:bg-pong-accent/10"
            }
          >
            <div className="text-base font-semibold text-pong-text">Local Game</div>
            <div className="mt-1 text-sm text-pong-text/70">Play offline (hot-seat)</div>
          </button>

          {/* Online (disabled) */}
          <button
            type="button"
            disabled
            className={
              "w-full rounded-2xl border border-white/10 bg-pong-surface p-4 text-left " +
              "opacity-50 cursor-not-allowed"
            }
          >
            <div className="text-base font-semibold text-pong-text">Online</div>
            <div className="mt-1 text-sm text-pong-text/70">Play with friends</div>
          </button>

          {/* AI (disabled) */}
          <button
            type="button"
            disabled
            className={
              "w-full rounded-2xl border border-white/10 bg-pong-surface p-4 text-left " +
              "opacity-50 cursor-not-allowed"
            }
          >
            <div className="text-base font-semibold text-pong-text">AI</div>
            <div className="mt-1 text-sm text-pong-text/70">Coming soon</div>
          </button>

          {/* Tournaments (disabled) */}
          <button
            type="button"
            disabled
            className={
              "w-full rounded-2xl border border-white/10 bg-pong-surface p-4 text-left " +
              "opacity-50 cursor-not-allowed"
            }
          >
            <div className="text-base font-semibold text-pong-text">Tournaments</div>
            <div className="mt-1 text-sm text-pong-text/70">Coming soon</div>
          </button>
        </div>
      </div>
    </div>
  );
}
