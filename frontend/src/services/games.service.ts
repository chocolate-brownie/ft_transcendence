// Games API calls — create game, get game state
import type { Game } from "../types";
import { apiClient } from "../lib/apiClient";

interface CreateGamePayload {
  player2Id?: number;
}

export const gamesService = {
  createGame(payload: CreateGamePayload = {}): Promise<Game> {
    return apiClient.post<Game>("/api/games", payload);
  },
};

