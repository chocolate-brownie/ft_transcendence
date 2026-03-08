import { describe, expect, it } from "@jest/globals";
import { checkWinnerWithLine } from "../src/services/games.service.js";
import type { Board } from "../src/types/game.js";

describe("checkWinnerWithLine", () => {
  it("returns a winner for a 3x3 top row", () => {
    const board: Board = [
      "X", "X", "X",
      null, "O", null,
      "O", null, null,
    ];

    expect(checkWinnerWithLine(board, 3)).toEqual({
      winner: "X",
      line: [0, 1, 2],
    });
  });

  it("returns a winner for a 3x3 anti-diagonal", () => {
    const board: Board = [
      null, null, "O",
      null, "O", null,
      "O", "X", "X",
    ];

    expect(checkWinnerWithLine(board, 3)).toEqual({
      winner: "O",
      line: [2, 4, 6],
    });
  });

  it("returns a winner for 4 aligned cells on a 4x4 board", () => {
    const board: Board = [
      null, null, null, null,
      "X", "X", "X", "X",
      null, "O", null, null,
      "O", null, null, null,
    ];

    expect(checkWinnerWithLine(board, 4)).toEqual({
      winner: "X",
      line: [4, 5, 6, 7],
    });
  });

  it("does not return a winner for only 3 aligned cells on a 4x4 board", () => {
    const board: Board = [
      null, null, null, null,
      "X", "X", "X", null,
      null, "O", null, null,
      "O", null, null, null,
    ];

    expect(checkWinnerWithLine(board, 4)).toBeNull();
  });

  it("returns a winner for 4 aligned cells on a 5x5 board", () => {
    const board: Board = [
      null, null, null, null, null,
      null, null, null, null, null,
      "O", "O", "O", "O", null,
      null, "X", null, null, null,
      null, null, null, null, null,
    ];

    expect(checkWinnerWithLine(board, 5)).toEqual({
      winner: "O",
      line: [10, 11, 12, 13],
    });
  });

  it("does not return a winner for only 3 aligned cells on a 5x5 board", () => {
    const board: Board = [
      null, null, null, null, null,
      null, null, null, null, null,
      "O", "O", "O", null, null,
      null, "X", null, null, null,
      null, null, null, null, null,
    ];

    expect(checkWinnerWithLine(board, 5)).toBeNull();
  });

  it("returns a winner for an offset diagonal of 4 on a 5x5 board", () => {
    const board: Board = [
      null, "X", null, null, null,
      null, null, "X", null, null,
      null, null, null, "X", null,
      null, null, null, null, "X",
      "O", null, null, null, null,
    ];

    expect(checkWinnerWithLine(board, 5)).toEqual({
      winner: "X",
      line: [1, 7, 13, 19],
    });
  });
});