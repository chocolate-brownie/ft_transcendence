import Button from "../Button";
import type { TournamentListItem } from "../../services/tournament.service";

interface TournamentCardProps {
  tournament: TournamentListItem;
  onJoin: (id: number) => Promise<void>;
  onView: (id: number) => void;
  isUserParticipant: boolean;
  isJoining: boolean;
}

function formatRelativeDate(date: string): string {
  const created = new Date(date).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - created);
  const minutes = Math.floor(diffMs / (1000 * 60));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function TournamentCard({
  tournament,
  onJoin,
  onView,
  isUserParticipant,
  isJoining,
}: TournamentCardProps) {
  const isRegistering = tournament.status === "REGISTERING";
  const isFull = tournament.currentParticipants >= tournament.maxPlayers;

  const statusLabelMap = {
    REGISTERING: "Pending",
    IN_PROGRESS: "Active",
    FINISHED: "Completed",
    CANCELLED: "Cancelled",
  };

  const statusClassMap = {
    REGISTERING: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    IN_PROGRESS: "bg-blue-100 text-blue-800 border border-blue-200",
    FINISHED: "bg-green-100 text-green-800 border border-green-200",
    CANCELLED: "bg-gray-100 text-gray-700 border border-gray-200",
  };

  const action = () => {
    if (!isRegistering) {
      return (
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => onView(tournament.id)}
        >
          View Bracket
        </Button>
      );
    }

    if (isUserParticipant) {
      return (
        <Button variant="lime" className="w-full" disabled>
          Joined ✓
        </Button>
      );
    }

    if (isFull) {
      return (
        <Button variant="secondary" className="w-full" disabled>
          FULL
        </Button>
      );
    }

    return (
      <Button
        variant="primary"
        className="w-full"
        disabled={isJoining}
        onClick={() => void onJoin(tournament.id)}
      >
        {isJoining ? "Joining..." : "Join Tournament"}
      </Button>
    );
  };

  return (
    <div className="rounded-xl border border-black/10 bg-white/40 p-5 backdrop-blur-xl shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-pong-text">{tournament.name}</h3>
          <p className="mt-1 text-sm text-pong-text/60">
            Created by {tournament.creator.username} •{" "}
            {formatRelativeDate(tournament.createdAt)}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusClassMap[tournament.status]}`}
        >
          {statusLabelMap[tournament.status]}
        </span>
      </div>

      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-pong-text/60">Players</span>
          <span
            className={`font-semibold ${isFull ? "text-red-600" : "text-pong-secondary"}`}
          >
            {isFull
              ? `FULL (${tournament.currentParticipants}/${tournament.maxPlayers})`
              : `${tournament.currentParticipants}/${tournament.maxPlayers} players`}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-black/10">
          <div
            className={`h-2 rounded-full ${isFull ? "bg-red-500" : "bg-pong-secondary"}`}
            style={{
              width: `${Math.min(
                100,
                (tournament.currentParticipants / tournament.maxPlayers) * 100,
              )}%`,
            }}
          />
        </div>
      </div>

      {action()}
    </div>
  );
}
