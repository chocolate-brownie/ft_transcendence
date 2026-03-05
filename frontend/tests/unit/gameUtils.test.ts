import { describe, expect, it } from "vitest";

import type { Board } from "../../src/types/game";
import { findWinningLine } from "../../src/utils/gameUtils";

describe("findWinningLine", () => {
  const winnerCases: Array<{ board: Board; line: number[] }> = [
    { board: ["X", "X", "X", null, null, null, null, null, null], line: [0, 1, 2] },
    { board: [null, null, null, "O", "O", "O", null, null, null], line: [3, 4, 5] },
    { board: [null, null, null, null, null, null, "X", "X", "X"], line: [6, 7, 8] },
    { board: ["O", null, null, "O", null, null, "O", null, null], line: [0, 3, 6] },
    { board: [null, "X", null, null, "X", null, null, "X", null], line: [1, 4, 7] },
    { board: [null, null, "O", null, null, "O", null, null, "O"], line: [2, 5, 8] },
    { board: ["X", null, null, null, "X", null, null, null, "X"], line: [0, 4, 8] },
    { board: [null, null, "O", null, "O", null, "O", null, null], line: [2, 4, 6] },
  ];

  it.each(winnerCases)("detects winning line %#", ({ board, line }) => {
    expect(findWinningLine(board)).toEqual(line);
  });

  it("returns null for draw board", () => {
    const drawBoard: Board = ["X", "O", "X", "X", "O", "O", "O", "X", "X"];
    expect(findWinningLine(drawBoard)).toBeNull();
  });

  it("returns null while game is in progress", () => {
    const board: Board = ["X", null, null, null, "O", null, null, null, null];
    expect(findWinningLine(board)).toBeNull();
  });
});
