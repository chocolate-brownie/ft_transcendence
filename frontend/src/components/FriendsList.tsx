/* Goal: frontend/src/components/FriendsList.tsx that
  - takes friends: FriendInfo[]
  - takes onRemoveFriend(friendId: number)
  - shows online first, offline alphabetically
  - shows avatar, names, status dot/text, remove button, empty state
  - responsive grid (desktop) → single column (mobile)
 * */

import React from "react";
import type { FriendInfo } from "../types";

// 1: Define props interface
interface FriendsListProps {
  friends: FriendInfo[];
  onRemoveFriend: (friendId: number) => void;
  className?: string;
}

// 2: Sort friends (online first, then username)
const sorted = React.useMemo(() => {
  return [...friends].sort((a, b) => {
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
    return a.username.localeCompare(b.username);
  });
}, [friends]);

