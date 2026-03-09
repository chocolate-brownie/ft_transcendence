/* Issue #159 — Tournament socket event listeners
   Listens for tournament Socket.io events and shows toast notifications.
   Optionally calls onUpdate when data changes so the page can refetch.

   Players navigate to games via the bracket "Play Now" buttons — no toast
   notification is needed for tournament_your_turn (bracket UI is cleaner).

   Uses refs for callbacks so the effect only re-runs when socket changes,
   preventing listener churn that can drop events. */

import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import { showToast } from "../components/Toast";

interface UseTournamentSocketOptions {
  socket: Socket | null;
  onUpdate?: () => void;
}

export function useTournamentSocket({ socket, onUpdate }: UseTournamentSocketOptions) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!socket) return;

    function onCreated(data: { tournamentName: string; creator: { username: string } }) {
      showToast(`${data.creator.username} created "${data.tournamentName}"`);
      onUpdateRef.current?.();
    }

    function onPlayerJoined(data: {
      tournamentName: string;
      player: { username: string };
      currentParticipants: number;
      maxPlayers: number;
    }) {
      showToast(
        `${data.player.username} joined ${data.tournamentName} (${data.currentParticipants}/${data.maxPlayers})`,
      );
      onUpdateRef.current?.();
    }

    function onStarted(data: { tournamentName: string }) {
      showToast(`${data.tournamentName} has started!`, "success");
      onUpdateRef.current?.();
    }

    function onYourTurn() {
      // Bracket "Play Now" buttons handle navigation — just refetch data
      onUpdateRef.current?.();
    }

    function onMatchCompleted(data: {
      winner: { username: string };
      loser: { username: string } | null;
      round: number;
    }) {
      const loserName = data.loser?.username ?? "opponent";
      showToast(`${data.winner.username} defeated ${loserName} in Round ${data.round}`);
      onUpdateRef.current?.();
    }

    function onEliminated(data: { tournamentName: string; roundName: string }) {
      showToast(
        `You were eliminated in the ${data.roundName}. Better luck next time!`,
        "error",
      );
      onUpdateRef.current?.();
    }

    function onCompleted(data: {
      tournamentName: string;
      champion: { username: string };
    }) {
      showToast(
        `${data.champion.username} is the champion of ${data.tournamentName}!`,
        "success",
      );
      onUpdateRef.current?.();
    }

    socket.on("tournament_created", onCreated);
    socket.on("tournament_player_joined", onPlayerJoined);
    socket.on("tournament_started", onStarted);
    socket.on("tournament_your_turn", onYourTurn);
    socket.on("tournament_match_completed", onMatchCompleted);
    socket.on("tournament_eliminated", onEliminated);
    socket.on("tournament_completed", onCompleted);

    return () => {
      socket.off("tournament_created", onCreated);
      socket.off("tournament_player_joined", onPlayerJoined);
      socket.off("tournament_started", onStarted);
      socket.off("tournament_your_turn", onYourTurn);
      socket.off("tournament_match_completed", onMatchCompleted);
      socket.off("tournament_eliminated", onEliminated);
      socket.off("tournament_completed", onCompleted);
    };
  }, [socket]);
}
