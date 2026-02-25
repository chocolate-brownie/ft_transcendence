// Auth API calls — login, signup, get current user
// Keeps fetch() logic out of React components

import type { User } from "../types";
import { apiClient } from "../lib/apiClient";

export interface AuthResponse {
  token: string;
  user: User;
}

export interface MeResponse {
  user: User;
}

export const authService = {
  login(email: string, password: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/api/auth/login", { email, password });
  },

  signup(email: string, username: string, password: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/api/auth/signup", { email, username, password });
  },

  me(): Promise<MeResponse> {
    return apiClient.get<MeResponse>("/api/auth/me");
  },

  logout(): void {
    // Fire-and-forget — reads token from localStorage before it is cleared
    apiClient.post<void>("/api/auth/logout", {}).catch(() => {});
  },
};
