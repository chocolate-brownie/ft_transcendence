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
    return joinedTournamentIds.includes(tournament.id);
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
      const created = await tournamentService.createTournament(name, maxPlayers);
      setShowCreateModal(false);
      await loadTournaments();
      void navigate(`/tournaments/${created.id}`);
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
      {/* ── Hero card ──────────────────────────────────────────── */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-black/10 bg-white/50 shadow-sm backdrop-blur-xl">
        {/* Orange → lime gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-pong-accent to-pong-secondary" />

        <div className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center">
          {/* Illustration */}
          <div className="flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-carrot-orange-50/60">
            <img
              src="/tourn.png"
              alt="Tournaments"
              className="h-full w-full object-contain p-2"
            />
          </div>

          {/* Title + description + tags */}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 className="text-4xl font-extrabold text-pong-accent sm:text-5xl">
              Tournaments
            </h1>
            <p className="mt-2 text-sm text-pong-text/60 sm:text-base">
              Compete in single-elimination brackets. Climb the ranks. Be crowned
              champion.
            </p>
            {/* Feature tags — each coloured by its theme */}
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="rounded-full border border-pong-accent/25 bg-carrot-orange-50/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-pong-accent">
                4–8 Players
              </span>
              <span className="rounded-full border border-pong-secondary/25 bg-lime-moss-50/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-pong-secondary">
                Single Elimination
              </span>
              <span className="rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-pong-text/50">
                Real-time
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="shrink-0">
            <Button
              className="whitespace-nowrap"
              onClick={() => setShowCreateModal(true)}
            >
              + Create Tournament
            </Button>
          </div>
        </div>
      </div>

      {/* ── Segment tabs ───────────────────────────────────────── */}
      <div className="mb-6 flex rounded-xl bg-black/5 p-1">
        {(Object.keys(tabStatusMap) as TabKey[]).map((tab) => {
          const activeColor =
            tab === "available"
              ? "text-pong-accent"
              : tab === "completed"
                ? "text-pong-secondary"
                : "text-blue-600";
          return (
            <button
              key={tab}
              type="button"
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                activeTab === tab
                  ? `bg-white shadow-sm ${activeColor}`
                  : "text-pong-text/55 hover:text-pong-text"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tabLabelMap[tab]}
            </button>
          );
        })}
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-20 text-center">
          <p className="text-sm text-pong-text/50">Loading tournaments...</p>
        </div>
      ) : null}

      {!loading && error ? (
        <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      {!loading && tournaments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white/30 p-16 text-center backdrop-blur-sm">
          <p className="text-lg font-semibold text-pong-text">No tournaments here yet</p>
          <p className="mt-2 text-sm text-pong-text/50">
            {activeTab === "available"
              ? "Be the first — create a tournament and start the competition."
              : "Nothing to show for this tab yet."}
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
