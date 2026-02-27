// Friends API calls — send request, accept, reject, list friends

import type { FriendInfo, PendingRequest, FriendshipStatus } from "../types";
import { apiClient } from "../lib/apiClient";

interface FriendshipStatusResponse {
  status: FriendshipStatus;
}

export const friendsService = {
  getFriends(): Promise<FriendInfo[]> {
    return apiClient.get<FriendInfo[]>("/api/friends");
  },

  removeFriend(friendId: number): Promise<void> {
    return apiClient.del(`/api/friends/${friendId}`);
  },

  rejectRequest(senderId: number): Promise<void> {
    return apiClient.del(`/api/friends/${senderId}`);
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

  async getFriendshipStatus(userId: number): Promise<FriendshipStatus> {
    const data = await apiClient.get<FriendshipStatusResponse>(
      `/api/friends/status/${userId}`,
    );
    return data.status;
  },
};
