import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../lib/apiClient";
import {
  tournamentService,
  type BracketResponse,
  type TournamentDetails,
} from "../services/tournament.service";
import BracketView from "../components/Tournament/BracketView";
import Button from "../components/Button";

const statusLabelMap: Record<string, string> = {
  REGISTERING: "Pending",
  IN_PROGRESS: "In Progress",
  FINISHED: "Completed",
  CANCELLED: "Cancelled",
};

const statusClassMap: Record<string, string> = {
  REGISTERING: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border border-blue-200",
  FINISHED: "bg-green-100 text-green-800 border border-green-200",
  CANCELLED: "bg-gray-100 text-gray-700 border border-gray-200",
};

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState<TournamentDetails | null>(null);
  const [bracket, setBracket] = useState<BracketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tournamentId = parseInt(id ?? "", 10);
    if (isNaN(tournamentId)) {
      setError("Invalid tournament ID.");
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [details, bracketData] = await Promise.allSettled([
          tournamentService.getTournament(tournamentId),
          tournamentService.getBracket(tournamentId),
        ]);

        if (details.status === "fulfilled") {
          setTournament(details.value);
        } else {
          const msg =
            details.reason instanceof ApiError
              ? details.reason.message
              : "Failed to load tournament.";
          setError(msg);
        }

        if (bracketData.status === "fulfilled") {
          setBracket(bracketData.value);
        }
        // Bracket 404 is expected when tournament is still REGISTERING — not an error
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id]);

  if (loading) {
    return (
      <div className="w-full max-w-5xl py-6">
        <p className="py-20 text-center text-pong-text/50">Loading tournament...</p>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="w-full max-w-5xl py-6">
        <Button variant="secondary" onClick={() => void navigate("/tournaments")}>
          ← Back to Tournaments
        </Button>
        <p className="mt-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error ?? "Tournament not found."}
        </p>
      </div>
    );
  }

  const isRegistering = tournament.status === "REGISTERING";

  return (
    <div className="w-full max-w-5xl py-6">
      {/* Back link */}
      <button
        type="button"
        className="mb-6 flex items-center gap-1 text-sm text-pong-text/50 transition-colors hover:text-pong-text"
        onClick={() => void navigate("/tournaments")}
      >
        ← Back to Tournaments
      </button>

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-pong-text">{tournament.name}</h1>
          <p className="mt-1 text-sm text-pong-text/50">
            Created by {tournament.creator.username} • {tournament.maxPlayers} player
            bracket • {new Date(tournament.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span
          className={`rounded-full px-4 py-1.5 text-sm font-semibold uppercase tracking-wide ${statusClassMap[tournament.status]}`}
        >
          {statusLabelMap[tournament.status]}
        </span>
      </div>

      {/* Champion banner */}
      {tournament.status === "FINISHED" && tournament.winner ? (
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-yellow-700">
              Tournament Champion
            </p>
            <p className="text-xl font-bold text-pong-text">
              {tournament.winner.username}
            </p>
          </div>
        </div>
      ) : null}

      {/* Participants */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-pong-text/40">
          Participants ({tournament.participants.length} / {tournament.maxPlayers})
        </h2>
        <div className="flex flex-wrap gap-2">
          {tournament.participants.length > 0 ? (
            tournament.participants.map((p) => (
              <span
                key={p.id}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm backdrop-blur-sm ${
                  p.eliminatedInRound !== null
                    ? "border-black/5 bg-white/20 text-pong-text/40"
                    : "border-black/10 bg-white/40 text-pong-text"
                }`}
              >
                <span className="text-xs text-pong-text/40">#{p.seed}</span>
                {p.user.username}
                {p.eliminatedInRound !== null && (
                  <span className="text-xs text-pong-text/30">
                    · out R{p.eliminatedInRound}
                  </span>
                )}
              </span>
            ))
          ) : (
            <p className="text-sm text-pong-text/40">No participants yet.</p>
          )}
        </div>
      </section>

      {/* Bracket */}
      <section>
        <div className="mb-4 flex items-baseline gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-pong-text/40">
            Bracket
          </h2>
          {bracket && bracket.currentRound !== null && bracket.status === "IN_PROGRESS" && (
            <span className="text-xs font-medium text-pong-accent">
              Round {bracket.currentRound} of {bracket.totalRounds}
            </span>
          )}
        </div>

        {isRegistering ? (
          <div className="rounded-xl border border-dashed border-black/15 bg-white/20 p-12 text-center">
            <p className="text-lg font-semibold text-pong-text">
              Bracket not yet generated
            </p>
            <p className="mt-1 text-sm text-pong-text/50">
              Waiting for all {tournament.maxPlayers} players to join before the bracket
              is drawn.
            </p>
            <p className="mt-2 text-sm text-pong-accent">
              {tournament.participants.length} / {tournament.maxPlayers} players
              registered
            </p>
          </div>
        ) : bracket ? (
          <BracketView bracket={bracket} participants={tournament.participants} />
        ) : (
          <p className="text-sm text-pong-text/40">Bracket data unavailable.</p>
        )}
      </section>
    </div>
  );
}
