// Games API calls — create game, get game state
import type { Game } from "../types";
import { apiClient } from "../lib/apiClient";
import type { BoardSize } from "../types/game";

interface CreateGamePayload {
  player2Id?: number;
  sourceGameId?: number;
  boardSize?: BoardSize;
}


export const gamesService = {
  createGame(payload: CreateGamePayload = {}): Promise<Game> {
    return apiClient.post<Game>("/api/games", payload);
  },
};
