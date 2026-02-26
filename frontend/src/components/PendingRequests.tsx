import type { PendingRequest } from "../types";

interface PendingRequestsProps {
  requests: PendingRequest[];
  onAccept: (requestId: number) => void;
  onReject: (senderId: number) => void;
  className?: string;
}

/**
 * Renders a list of pending friend requests with sender avatar, display name (falls back to username), and Accept/Decline actions.
 *
 * @param requests - Array of pending requests to render.
 * @param onAccept - Called with a request's `id` when the Accept button is clicked.
 * @param onReject - Called with a request's `senderId` when the Decline button is clicked.
 * @param className - Optional container CSS class names to apply.
 * @returns The rendered React element containing either the list of requests or an empty-state message.
 */
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
        const avatarSrc =
          req.sender.avatarUrl?.startsWith("/uploads/")
            ? req.sender.avatarUrl
            : req.sender.avatarUrl || "/default-avatar.png";

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
              <p className="truncate text-xs text-slate-400">@{req.sender.username}</p>
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
                className="rounded-md border border-slate-600/50 px-3 py-1 text-xs font-semibold text-slate-400 transition hover:bg-slate-500/10 hover:text-slate-200"
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
