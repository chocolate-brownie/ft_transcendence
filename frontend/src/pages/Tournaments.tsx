import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";
import TournamentList from "../components/Tournament/TournamentList";
import CreateTournamentModal from "../components/Tournament/CreateTournamentModal";
import {
  tournamentService,
  type TournamentListItem,
  type TournamentStatus,
} from "../services/tournament.service";
import Button from "../components/Button";

type TabKey = "available" | "in_progress" | "completed";

const tabStatusMap: Record<TabKey, TournamentStatus> = {
  available: "REGISTERING",
  in_progress: "IN_PROGRESS",
  completed: "FINISHED",
};

export default function Tournaments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("available");
  const [tournaments, setTournaments] = useState<TournamentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningTournamentId, setJoiningTournamentId] = useState<number | null>(null);
  const [joinedTournamentIds, setJoinedTournamentIds] = useState<number[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const tabLabelMap: Record<TabKey, string> = useMemo(
    () => ({
      available: "Available",
      in_progress: "In Progress",
      completed: "Completed",
    }),
    [],
  );

  const loadTournaments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await tournamentService.getTournaments(tabStatusMap[activeTab]);
      setTournaments(response.tournaments);

      if (!user || response.tournaments.length === 0) {
        setJoinedTournamentIds([]);
        return;
      }

      const ids = await Promise.all(
        response.tournaments.map(async (tournament) => {
          try {
            const details = await tournamentService.getTournament(tournament.id);
            const joined = details.participants.some(
              (participant) => participant.userId === user.id,
            );
            return joined ? tournament.id : null;
          } catch {
            return null;
          }
        }),
      );

      setJoinedTournamentIds(ids.filter((id): id is number => id !== null));
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to load tournaments.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, user]);

  useEffect(() => {
    void loadTournaments();
  }, [loadTournaments]);

  const isUserParticipant = (tournament: TournamentListItem): boolean => {
    if (!user) return false;
    return (
      tournament.creator.id === user.id || joinedTournamentIds.includes(tournament.id)
    );
  };

  const handleJoin = async (tournamentId: number) => {
    setJoiningTournamentId(tournamentId);
    setError(null);

    try {
      await tournamentService.joinTournament(tournamentId);
      setJoinedTournamentIds((prev) =>
        prev.includes(tournamentId) ? prev : [...prev, tournamentId],
      );
      await loadTournaments();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to join tournament.";
      setError(message);
    } finally {
      setJoiningTournamentId(null);
    }
  };

  const handleCreate = async (name: string, maxPlayers: 4 | 8) => {
    setIsCreating(true);
    setCreateError(null);

    try {
      await tournamentService.createTournament(name, maxPlayers);
      setShowCreateModal(false);
      setActiveTab("available");
      await loadTournaments();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to create tournament.";
      setCreateError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleView = (tournamentId: number) => {
    void navigate(`/tournaments/${tournamentId}`);
  };

  return (
    <div className="w-full max-w-6xl py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-bold text-pong-text">Tournaments</h1>
        <Button onClick={() => setShowCreateModal(true)}>+ Create Tournament</Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-black/10 pb-3">
        {(Object.keys(tabStatusMap) as TabKey[]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab
                ? "bg-pong-accent text-white"
                : "bg-black/5 text-pong-text/70 hover:bg-black/10"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tabLabelMap[tab]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-12 text-center text-pong-text/70">Loading tournaments...</p>
      ) : null}

      {!loading && error ? (
        <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      {!loading && tournaments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/15 bg-white/30 p-12 text-center">
          <p className="text-lg font-semibold text-pong-text">No tournaments found</p>
          <p className="mt-1 text-sm text-pong-text/60">
            Switch tabs or create a new tournament to get started.
          </p>
        </div>
      ) : null}

      {!loading && tournaments.length > 0 ? (
        <TournamentList
          tournaments={tournaments}
          joiningTournamentId={joiningTournamentId}
          onJoin={handleJoin}
          onView={handleView}
          isUserParticipant={isUserParticipant}
        />
      ) : null}

      {showCreateModal ? (
        <CreateTournamentModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
          isCreating={isCreating}
          error={createError}
        />
      ) : null}
    </div>
  );
}
