/**
 * AI Game Service — Issue #183
 *
 * Wraps the three AI backend endpoints (POST create, POST move, GET game).
 * Uses apiClient (not raw axios/fetch) so the JWT token is attached automatically.
 * Field name for moves is `moveIndex` (matches backend ai.controller.ts).
 */
import { apiClient } from "../lib/apiClient";
import type { CellValue, PlayerSymbol } from "../types/game";

export type AiDifficulty = "easy" | "medium" | "hard";

export interface AIGameResponse {
  game: {
    id: number;
    boardState: string;
    player1Symbol: string;
    player2Symbol: string;
    currentTurn: string;
    status: string;
    difficulty: string;
    winningLine?: number[] | null;
  };
  difficulty: string;
}

export interface AIMoveResponse {
  game: {
    boardState: CellValue[];
    status: string;
    winner: string | null;
  };
  aiMove: { moveIndex: number; symbol: string } | null;
}

export const aiService = {
  createGame(
    difficulty: AiDifficulty,
    playerSymbol: PlayerSymbol,
  ): Promise<AIGameResponse> {
    return apiClient.post<AIGameResponse>("/api/ai/games", {
      difficulty,
      playerSymbol,
    });
  },

  makeMove(gameId: number, moveIndex: number): Promise<AIMoveResponse> {
    return apiClient.post<AIMoveResponse>(`/api/ai/games/${gameId}/move`, {
      moveIndex,
    });
  },

  getGame(gameId: number): Promise<AIGameResponse> {
    return apiClient.get<AIGameResponse>(`/api/ai/games/${gameId}`);
  },
};
