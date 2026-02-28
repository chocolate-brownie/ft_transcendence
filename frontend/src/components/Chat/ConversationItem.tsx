import type { ConversationSummary } from "../../types";

interface ConversationItemProps {
  conversation: ConversationSummary;
  isActive: boolean;
  currentUserId: number;
  onClick: () => void;
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ConversationItem({ conversation, isActive, currentUserId, onClick }: ConversationItemProps) {
  const { user, lastMessage, unreadCount } = conversation;

  const avatarSrc =
    user.avatarUrl?.startsWith("/uploads/") && !user.avatarUrl.includes("default")
      ? user.avatarUrl
      : "/default-avatar.png";

  const displayName = user.displayName ?? user.username;
  const preview =
    lastMessage.senderId === currentUserId
      ? `You: ${lastMessage.content}`
      : lastMessage.content;
  const truncatedPreview = preview.length > 40 ? preview.slice(0, 40) + "…" : preview;

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-3 cursor-pointer rounded-lg transition ${
        isActive
          ? "bg-pong-accent/20 border border-pong-accent/30"
          : "hover:bg-white/10 border border-transparent"
      }`}
    >
      {/* Avatar with online dot */}
      <div className="relative flex-shrink-0">
        <img
          src={avatarSrc}
          alt={`${user.username} avatar`}
          className="h-11 w-11 rounded-full object-cover border border-black/10"
        />
        {user.isOnline && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={`text-sm truncate ${unreadCount > 0 ? "font-semibold text-pong-text" : "font-medium text-pong-text/80"}`}>
            {displayName}
          </span>
          <span className="text-xs text-pong-text/40 flex-shrink-0">
            {formatRelativeTime(lastMessage.createdAt)}
          </span>
        </div>
        <p className={`text-xs truncate mt-0.5 ${unreadCount > 0 ? "text-pong-text/80" : "text-pong-text/50"}`}>
          {truncatedPreview}
        </p>
      </div>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-pong-accent flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        </div>
      )}
    </div>
  );
}

export default ConversationItem;
