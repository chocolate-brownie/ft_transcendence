/* Issue #159 — Tournament socket event listeners
   Listens for all 6 tournament Socket.io events and shows toast notifications.
   Optionally calls onUpdate when data changes so the page can refetch. */

import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import { showToast } from "../components/Toast";

interface UseTournamentSocketOptions {
  socket: Socket | null;
  onUpdate?: () => void;
}

export function useTournamentSocket({ socket, onUpdate }: UseTournamentSocketOptions) {
  useEffect(() => {
    if (!socket) return;

    function onPlayerJoined(data: { tournamentName: string; player: { username: string }; currentParticipants: number; maxPlayers: number }) {
      showToast(`${data.player.username} joined ${data.tournamentName} (${data.currentParticipants}/${data.maxPlayers})`);
      onUpdate?.();
    }

    function onStarted(data: { tournamentName: string }) {
      showToast(`${data.tournamentName} has started!`, "success");
      onUpdate?.();
    }

    function onYourTurn(data: { tournamentName: string; roundName: string; opponent: { username: string } }) {
      showToast(`Your ${data.roundName} match is ready! vs ${data.opponent.username}`, "warning");
      onUpdate?.();
    }

    function onMatchCompleted(data: { winner: { username: string }; loser: { username: string } | null; round: number }) {
      const loserName = data.loser?.username ?? "opponent";
      showToast(`${data.winner.username} defeated ${loserName} in Round ${data.round}`);
      onUpdate?.();
    }

    function onEliminated(data: { tournamentName: string; roundName: string }) {
      showToast(`You were eliminated in the ${data.roundName}. Better luck next time!`, "error");
      onUpdate?.();
    }

    function onCompleted(data: { tournamentName: string; champion: { username: string } }) {
      showToast(`${data.champion.username} is the champion of ${data.tournamentName}!`, "success");
      onUpdate?.();
    }

    socket.on("tournament_player_joined", onPlayerJoined);
    socket.on("tournament_started", onStarted);
    socket.on("tournament_your_turn", onYourTurn);
    socket.on("tournament_match_completed", onMatchCompleted);
    socket.on("tournament_eliminated", onEliminated);
    socket.on("tournament_completed", onCompleted);

    return () => {
      socket.off("tournament_player_joined", onPlayerJoined);
      socket.off("tournament_started", onStarted);
      socket.off("tournament_your_turn", onYourTurn);
      socket.off("tournament_match_completed", onMatchCompleted);
      socket.off("tournament_eliminated", onEliminated);
      socket.off("tournament_completed", onCompleted);
    };
  }, [socket, onUpdate]);
}
