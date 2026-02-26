import type { PendingRequest } from "../types";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

interface PendingRequestsProps {
  requests: PendingRequest[];
  onAccept: (requestId: number) => void;
  onReject: (senderId: number) => void;
  className?: string;
}

export default function PendingRequests({
  requests,
  onAccept,
  onReject,
  className,
}: PendingRequestsProps) {
  if (requests.length === 0) {
    return (
      <div className={className ?? ""}>
        <p className="text-sm text-pong-text/50">No pending friend requests.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      {requests.map((req) => {
        const name = req.sender.displayName ?? req.sender.username;
        const avatarSrc = req.sender.avatarUrl || "/default-avatar.png";

        return (
          <div
            key={req.id}
            className="flex items-center gap-3 rounded-lg border border-slate-700/60 bg-slate-900/60 p-3"
          >
            <img
              src={avatarSrc}
              alt={`${req.sender.username} avatar`}
              className="h-10 w-10 flex-shrink-0 rounded-full border border-slate-700 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-50">{name}</p>
              <p className="truncate text-xs text-slate-400">
                @{req.sender.username} · {timeAgo(req.createdAt)}
              </p>
            </div>
            <div className="flex flex-shrink-0 gap-2">
              <button
                onClick={() => onAccept(req.id)}
                className="rounded-md border border-emerald-400/50 px-3 py-1 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/10 hover:text-emerald-200"
              >
                Accept
              </button>
              <button
                onClick={() => onReject(req.senderId)}
                className="rounded-md border border-red-400/50 px-3 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
              >
                Decline
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
