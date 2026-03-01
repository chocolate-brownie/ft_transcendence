// Users API calls — get profile, update profile, upload avatar

import type { User } from "../types";
import { apiClient } from "../lib/apiClient";

export const usersService = {
  getUserById(id: number): Promise<User> {
    // GET /api/users/:id
    return apiClient.get<User>(`/api/users/${id}`);
  },

  updateMe(data: { displayName: string }): Promise<User> {
    // PUT /api/users/me
    return apiClient.put<User>("/api/users/me", data);
  },

  uploadAvatar(file: File): Promise<User> {
    // POST /api/users/me/avatar with FormData
    const formData = new FormData();
    formData.append("avatar", file);
    return apiClient.post<User>("/api/users/me/avatar", formData);
  },

  searchUsers(query: string): Promise<User[]> {
    return apiClient.get<User[]>(
      `/api/users/search?q=${encodeURIComponent(query)}`
    );
  },
};
