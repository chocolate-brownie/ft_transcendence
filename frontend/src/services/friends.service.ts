// Friends API calls — send request, accept, reject, list friends

import type { FriendInfo, PendingRequest } from "../types";
import { apiClient } from "../lib/apiClient";

export const friendsService = {
  getFriends(): Promise<FriendInfo[]> {
    return apiClient.get<FriendInfo[]>("/api/friends");
  },

  removeFriend(friendId: number): Promise<void> {
    return apiClient.del(`/api/friends/${friendId}`);
  },

  sendRequest(userId: number): Promise<void> {
    return apiClient.post<void>(`/api/friends/request/${userId}`, {});
  },

  getPendingRequests(): Promise<PendingRequest[]> {
    return apiClient.get<PendingRequest[]>("/api/friends/requests");
  },

  acceptRequest(requestId: number): Promise<void> {
    return apiClient.post<void>(`/api/friends/accept/${requestId}`, {});
  },
};
