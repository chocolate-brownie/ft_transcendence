import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import LocalGame from "../../src/pages/LocalGame";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../src/components/Game/GameBoard", () => ({
  default: ({
    board,
    onCellClick,
  }: {
    board: ("X" | "O" | null)[];
    onCellClick: (index: number) => void;
  }) => (
    <div>
      <div data-testid="board-length">{board.length}</div>
      {board.map((cell, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onCellClick(index)}
          disabled={cell !== null}
        >
          {cell ?? `cell-${index}`}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../../src/components/Game/TurnIndicator", () => ({
  default: ({ textOverride }: { textOverride?: string }) => (
    <div>{textOverride ?? "turn-indicator"}</div>
  ),
}));

vi.mock("../../src/components/Button", () => ({
  default: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

afterEach(() => {
  cleanup();
  navigateMock.mockReset();
});

function renderLocalGame(route = "/game/local") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <LocalGame />
    </MemoryRouter>,
  );
}

describe("LocalGame", () => {
  it("uses a 3x3 board by default", () => {
    renderLocalGame();

    expect(screen.getByText("3x3")).toBeInTheDocument();
    expect(screen.getByText(/move 0 \/ 9/i)).toBeInTheDocument();
    expect(screen.getByTestId("board-length")).toHaveTextContent("9");
  });

  it("uses the boardSize from query params", () => {
    renderLocalGame("/game/local?boardSize=5");

    expect(screen.getByText("5x5")).toBeInTheDocument();
    expect(screen.getByText(/move 0 \/ 25/i)).toBeInTheDocument();
    expect(screen.getByTestId("board-length")).toHaveTextContent("25");
  });

  it("updates local game state and resets on play again", () => {
    renderLocalGame();

    fireEvent.click(screen.getByRole("button", { name: "cell-0" })); // X
    fireEvent.click(screen.getByRole("button", { name: "cell-1" })); // O
    fireEvent.click(screen.getByRole("button", { name: "cell-3" })); // X
    fireEvent.click(screen.getByRole("button", { name: "cell-2" })); // O
    fireEvent.click(screen.getByRole("button", { name: "cell-6" })); // X wins

    expect(screen.getByText(/player 1 wins! \(x\)/i)).toBeInTheDocument();
    expect(screen.getByText(/move 5 \/ 9/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /play again/i }));

    expect(screen.getByText(/move 0 \/ 9/i)).toBeInTheDocument();
    expect(screen.queryByText(/player 1 wins! \(x\)/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("board-length")).toHaveTextContent("9");
  });
});