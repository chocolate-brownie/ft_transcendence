import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

/**
 * Shows a persistent banner when the user has an active IN_PROGRESS game.
 * The activeGameId lives in SocketContext so it survives route changes.
 * Cleared when: user dismisses, rejoins, game ends (forfeit/over), or logout.
 */
export default function ActiveGameBanner() {
  const { activeGameId, clearActiveGame } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);

  // Hide if already on that game's page
  const isOnGamePage =
    activeGameId !== null && location.pathname === `/game/${activeGameId}`;

  if (!activeGameId || dismissed || isOnGamePage) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border border-pong-accent/30 bg-pong-surface/95 px-4 py-2.5 shadow-lg backdrop-blur-md">
      <span className="h-2 w-2 animate-pulse rounded-full bg-pong-accent" />
      <span className="text-sm text-pong-text/90">
        You have an active game in progress
      </span>
      <button
        type="button"
        className="rounded-md bg-pong-accent px-3 py-1 text-xs font-semibold text-pong-background hover:bg-pong-accentDark transition-colors"
        onClick={() => {
          void navigate(`/game/${activeGameId}`);
          setDismissed(true);
        }}
      >
        Rejoin
      </button>
      <button
        type="button"
        className="text-pong-text/40 hover:text-pong-text/70 transition-colors"
        onClick={() => {
          setDismissed(true);
          clearActiveGame();
        }}
        aria-label="Dismiss"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
