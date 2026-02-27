import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { FriendInfo } from "../types";

interface FriendsListProps {
  friends: FriendInfo[];
  onRemoveFriend: (friendId: number) => void;
  className?: string;
}

export function FriendsList({ friends, onRemoveFriend, className }: FriendsListProps) {
  const navigate = useNavigate();

  const sortedFriends = useMemo(() => {
    return [...friends].sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      return a.username.localeCompare(b.username);
    });
  }, [friends]);

  const handleRemove = (e: React.MouseEvent, friend: FriendInfo) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Are you sure you want to remove ${friend.displayName ?? friend.username} from your friends?`,
    );
    if (confirmed) onRemoveFriend(friend.id);
  };

  if (sortedFriends.length === 0) {
    return (
      <div className={className ?? ""}>
        <div className="rounded-lg border border-dashed border-black/20 bg-white/10 p-6 text-center text-pong-text/60">
          You have no friends yet. Visit a user's profile to send them a request!
        </div>
      </div>
    );
  }

  return (
    <div className={className ?? ""}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedFriends.map((friend) => {
          const avatarSrc = friend.avatarUrl?.startsWith("/uploads/")
            && !friend.avatarUrl.includes("default")
            ? friend.avatarUrl
            : "/default-avatar.png";

          return (
            <div
              key={friend.id}
              onClick={() => void navigate(`/profile/${friend.id}`)}
              className="cursor-pointer rounded-lg border border-black/10 bg-white/20 p-4 shadow transition hover:-translate-y-0.5 hover:border-pong-accent/40 hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                <img
                  src={avatarSrc}
                  alt={`${friend.username} avatar`}
                  className="h-12 w-12 rounded-full object-cover border border-black/10"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-pong-text truncate">
                    {friend.displayName ?? friend.username}
                  </p>
                  <p className="text-xs text-pong-text/60 truncate">@{friend.username}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${friend.isOnline ? "bg-green-500" : "bg-gray-400"}`}
                  />
                  <span className="text-xs text-pong-text/60">
                    {friend.isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={(e) => handleRemove(e, friend)}
                  className="text-xs font-semibold text-red-500 border border-red-500/40 px-3 py-1 rounded-md transition hover:bg-red-500/10"
                >
                  Remove Friend
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FriendsList;
