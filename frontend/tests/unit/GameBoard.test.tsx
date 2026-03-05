import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import GameBoard from "../../src/components/Game/GameBoard";

describe("GameBoard", () => {
  afterEach(() => {
    cleanup();
  });

  it("highlights winning cells with win style and dims non-winning cells", () => {
    render(
      <GameBoard
        board={["X", "X", "X", "O", null, null, null, null, null]}
        onCellClick={vi.fn()}
        disabled
        gameOver
        winningLine={[0, 1, 2]}
        winnerSymbol="X"
        playerSymbol="X"
      />,
    );

    const winningButtons = [1, 2, 3].map((n) =>
      screen.getByLabelText(`Cell ${n}, winning cell`),
    );
    for (const btn of winningButtons) {
      expect(btn.className).toContain("winner-cell-win");
    }
    expect(screen.getByLabelText("Cell 4").className).toContain("opacity-35");
  });

  it("uses loss style when opponent wins", () => {
    render(
      <GameBoard
        board={["O", "O", "O", "X", null, null, null, null, null]}
        onCellClick={vi.fn()}
        disabled
        gameOver
        winningLine={[0, 1, 2]}
        winnerSymbol="O"
        playerSymbol="X"
      />,
    );

    expect(screen.getAllByLabelText("Cell 1, winning cell")[0].className).toContain(
      "winner-cell-loss",
    );
  });

  it("uses turn-based hover color for empty cells", () => {
    const { rerender } = render(
      <GameBoard
        board={[null, null, null, null, null, null, null, null, null]}
        onCellClick={vi.fn()}
        currentTurnSymbol="X"
      />,
    );

    expect(screen.getByLabelText("Cell 1").className).toContain("hover:bg-pong-accent/10");

    rerender(
      <GameBoard
        board={[null, null, null, null, null, null, null, null, null]}
        onCellClick={vi.fn()}
        currentTurnSymbol="O"
      />,
    );

    expect(screen.getByLabelText("Cell 1").className).toContain("hover:bg-pong-secondary/10");
  });

  it("does not show actionable hover style when board is disabled", () => {
    render(
      <GameBoard
        board={[null, null, null, null, null, null, null, null, null]}
        onCellClick={vi.fn()}
        currentTurnSymbol="X"
        disabled
      />,
    );

    const cellClass = screen.getByLabelText("Cell 1").className;
    expect(cellClass).not.toContain("hover:bg-pong-accent/10");
    expect(cellClass).not.toContain("hover:bg-pong-secondary/10");
    expect(cellClass).toContain("cursor-not-allowed");
  });
});
