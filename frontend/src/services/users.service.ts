// Users API calls — get profile, update profile, upload avatar

import type { User } from "../types";
import { apiClient } from "../lib/apiClient";

export const usersService = {
  getUserById(id: number): Promise<User> {
    return apiClient.get<User>(`/api/users/${id}`);
  },

  updateMe(data: { displayName: string }): Promise<User> {
    return apiClient.put<User>("/api/users/me", data);
  },
};
