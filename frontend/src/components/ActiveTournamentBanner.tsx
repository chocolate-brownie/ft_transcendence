import { useLocation, useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

/**
 * Shows a persistent banner when the user has an active tournament.
 * The activeTournamentId lives in SocketContext so it survives route changes.
 */
export default function ActiveTournamentBanner() {
  const { activeTournamentId } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const isOnTournamentPage =
    activeTournamentId !== null &&
    location.pathname === `/tournaments/${activeTournamentId}`;

  if (!activeTournamentId || isOnTournamentPage) return null;

  return (
    <div className="fixed bottom-16 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-blue-300/50 bg-pong-surface/95 px-4 py-2.5 shadow-lg backdrop-blur-md">
      <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
      <span className="text-sm text-pong-text/90">
        You are registered in an active tournament
      </span>
      <button
        type="button"
        className="rounded-md bg-blue-500 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-600"
        onClick={() => {
          void navigate(`/tournaments/${activeTournamentId}`);
        }}
      >
        Rejoin
      </button>
    </div>
  );
}