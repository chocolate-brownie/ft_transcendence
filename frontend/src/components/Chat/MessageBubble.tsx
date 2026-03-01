import type { MessageWithSender } from "../../types";

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
}

function formatTimestamp(createdAt: string): string {
  const date = new Date(createdAt);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" }) +
    " " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const avatarSrc =
    message.sender.avatarUrl?.startsWith("/uploads/") &&
    !message.sender.avatarUrl.includes("default")
      ? message.sender.avatarUrl
      : "/default-avatar.png";

  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar — only shown for other user's messages */}
      {!isOwn && (
        <img
          src={avatarSrc}
          alt={`${message.sender.username} avatar`}
          className="h-7 w-7 rounded-full object-cover border border-black/10 flex-shrink-0 mb-1"
          onError={(e) => { e.currentTarget.src = "/default-avatar.png"; }}
        />
      )}

      <div className={`flex flex-col gap-1 max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isOwn
              ? "bg-pong-accent text-white rounded-br-sm"
              : "bg-white/20 text-pong-text rounded-bl-sm"
          }`}
        >
          {message.content}
        </div>
        <span className="text-xs text-pong-text/40 px-1">
          {formatTimestamp(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

export default MessageBubble;
