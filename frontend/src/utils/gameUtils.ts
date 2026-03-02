// frontend/src/utils/gameUtils.ts
import type { Board } from "../types/game";

const WIN_LINES: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // horizontal
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // vertical
  [0, 4, 8], [2, 4, 6],            // diagonal
];

// Returns the winning line indices if a player has won, otherwise null.
export function findWinningLine(board: Board): number[] | null {
  for (let i = 0; i < WIN_LINES.length; i++) {
    const line = WIN_LINES[i];
    const a = line[0];
    const b = line[1];
    const c = line[2];

    const value = board[a];

    if (value !== null && value === board[b] && value === board[c]) {
      return line;
    }
  }

  return null;
}