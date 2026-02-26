// Friends API calls — send request, accept, reject, list friends

import type { FriendInfo } from "../types";
import { apiClient } from "../lib/apiClient";

export const friendsService = {
  getFriends(): Promise<FriendInfo[]> {
    return apiClient.get<FriendInfo[]>("/api/friends");
  },

  removeFriend(friendId: number): Promise<void> {
    return apiClient.del(`/api/friends/${friendId}`);
  },
};
