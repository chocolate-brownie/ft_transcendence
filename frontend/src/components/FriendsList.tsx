import React from "react";
import type { FriendInfo } from "../types";

interface FriendsListProps {
  friends: FriendInfo[];
  onRemoveFriend: (friendId: number) => void;
  className?: string;
}

/**
 * Render a list of friends as cards showing avatar, name, username, online status, and a remove action.
 *
 * The list is sorted with online users first and then alphabetically by username. If a friend has no
 * avatar URL, a default avatar ("/default-avatar.png") is used. Removing a friend prompts the user for
 * confirmation before invoking the removal callback. When the list is empty, a bordered empty-state box
 * with a message is rendered.
 *
 * @param friends - Array of friends to display
 * @param onRemoveFriend - Callback invoked with a friend's `id` after the user confirms removal
 * @param className - Optional CSS class applied to the outer container
 * @returns The rendered friends list or an empty-state element
 */
export function FriendsList({ friends, onRemoveFriend, className }: FriendsListProps) {
  const sortedFriends = React.useMemo(() => {
    return [...friends].sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1; // online first
      return a.username.localeCompare(b.username); // then alphabetical
    });
  }, [friends]);

  const handleRemove = (friend: FriendInfo) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${friend.username} from your friends?`,
    );
    if (confirmed) onRemoveFriend(friend.id);
  };

  if (sortedFriends.length === 0) {
    return (
      <div className={className ?? ""}>
        <div className="rounded-lg border border-dashed border-slate-500/50 p-6 text-center text-slate-300">
          {/* TODO: Customize empty-state copy if desired. */}
          You have no friends yet. Search for users to add them!
        </div>
      </div>
    );
  }

  return (
    <div className={className ?? ""}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedFriends.map((friend) => (
          <div
            key={friend.id}
            className="rounded-lg border border-slate-700/60 bg-slate-900/60 p-4 shadow transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-center gap-3">
              <img
                src={friend.avatarUrl ?? "/default-avatar.png"}
                alt={`${friend.username} avatar`}
                className="h-12 w-12 rounded-full object-cover border border-slate-700"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-50">
                  {friend.displayName ?? friend.username}
                </p>
                <p className="text-xs text-slate-400">@{friend.username}</p>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${friend.isOnline ? "bg-emerald-400" : "bg-slate-500"}`}
                />
                <span className="text-xs text-slate-300">
                  {friend.isOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleRemove(friend)}
                className="text-xs font-semibold text-red-300 hover:text-red-200 border border-red-400/50 px-3 py-1 rounded-md transition hover:bg-red-500/10"
              >
                Remove Friend
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FriendsList;
