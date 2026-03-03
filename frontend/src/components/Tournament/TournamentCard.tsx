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
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const statusBarMap: Record<string, string> = {
  REGISTERING: "bg-pong-accent",
  IN_PROGRESS: "bg-blue-400",
  FINISHED: "bg-pong-secondary",
  CANCELLED: "bg-shadow-grey-300",
};

const statusLabelMap: Record<string, string> = {
  REGISTERING: "Pending",
  IN_PROGRESS: "Active",
  FINISHED: "Completed",
  CANCELLED: "Cancelled",
};

const statusClassMap: Record<string, string> = {
  REGISTERING: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border border-blue-200",
  FINISHED: "bg-green-100 text-green-800 border border-green-200",
  CANCELLED: "bg-gray-100 text-gray-700 border border-gray-200",
};

export default function TournamentCard({
  tournament,
  onJoin,
  onView,
  isUserParticipant,
  isJoining,
}: TournamentCardProps) {
  const isRegistering = tournament.status === "REGISTERING";
  const isFull = tournament.currentParticipants >= tournament.maxPlayers;

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
          Full
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
    <div className="group relative overflow-hidden rounded-2xl border border-black/10 bg-white/50 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
      {/* Status accent bar */}
      <div className={`h-1 w-full ${statusBarMap[tournament.status]}`} />

      <div className="flex flex-col gap-4 p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xl font-bold text-pong-text">
              {tournament.name}
            </h3>
            <p className="mt-0.5 text-xs text-pong-text/50">
              by {tournament.creator.username} ·{" "}
              {formatRelativeDate(tournament.createdAt)}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusClassMap[tournament.status]}`}
          >
            {statusLabelMap[tournament.status]}
          </span>
        </div>

        {/* Players progress */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-pong-text/50">
              Players
            </span>
            <span
              className={`text-xs font-bold ${isFull ? "text-red-500" : "text-pong-secondary"}`}
            >
              {tournament.currentParticipants} / {tournament.maxPlayers}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
            <div
              className={`h-1.5 rounded-full transition-all ${isFull ? "bg-red-400" : "bg-pong-secondary"}`}
              style={{
                width: `${Math.min(
                  100,
                  (tournament.currentParticipants / tournament.maxPlayers) * 100,
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Winner banner */}
        {tournament.status === "FINISHED" && tournament.winner ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2">
            <span className="text-base">🏆</span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-600">
                Champion
              </p>
              <p className="truncate text-sm font-bold text-pong-text">
                {tournament.winner.username}
              </p>
            </div>
          </div>
        ) : null}

        {/* Action button */}
        {action()}
      </div>
    </div>
  );
}
