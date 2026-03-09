/**
 * AIGame page unit tests — Issue #183
 *
 * Tests the three-phase AI game flow: setup → playing → finished.
 * Mocks aiService and react-router-dom to isolate component behavior.
 */
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AIGame from "../../src/pages/AIGame";

/* ── Mocks ──────────────────────────────────────────────────────────────────── */

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const createGameMock = vi.fn();
const makeMoveMock = vi.fn();

vi.mock("../../src/services/ai.service", () => ({
  aiService: {
    createGame: (...args: unknown[]) => createGameMock(...args),
    makeMove: (...args: unknown[]) => makeMoveMock(...args),
    getGame: vi.fn(),
  },
}));

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

/** Returns a fake createGame response with an empty 3x3 board. */
function fakeCreateResponse(playerSymbol: string) {
  return {
    game: {
      id: 1,
      boardState: JSON.stringify(Array(9).fill(null)),
      player1Symbol: playerSymbol,
      player2Symbol: playerSymbol === "X" ? "O" : "X",
      currentTurn: "X",
      status: "IN_PROGRESS",
      difficulty: "medium",
      winningLine: null,
    },
    difficulty: "medium",
  };
}

/* ── Tests ───────────────────────────────────────────────────────────────────── */

describe("AIGame — setup phase", () => {
  afterEach(cleanup);

  beforeEach(() => {
    navigateMock.mockReset();
    createGameMock.mockReset();
    makeMoveMock.mockReset();
  });

  it("renders the setup screen with difficulty and symbol selectors", () => {
    render(<AIGame />);

    expect(screen.getByText("Play vs AI")).toBeInTheDocument();
    expect(screen.getByText("Easy")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("Hard")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start game/i })).toBeInTheDocument();
  });

  // Difficulty is no longer read from URL params (Issue #183); default is always "medium"
  it("defaults to medium difficulty on load", () => {
    const { container } = render(<AIGame />);

    const grid = container.querySelector(".grid");
    const diffButtons = grid?.querySelectorAll("button") ?? [];
    // Medium is the 2nd button
    expect(diffButtons[1]?.className).toContain("border-amber-400");
  });

  it("defaults to medium when no search params are present", () => {
    const { container } = render(<AIGame />);

    const grid = container.querySelector(".grid");
    const diffButtons = grid?.querySelectorAll("button") ?? [];
    // Easy (1st) and Hard (3rd) should not be active
    expect(diffButtons[0]?.className).not.toContain("border-emerald-400");
    expect(diffButtons[2]?.className).not.toContain("border-red-400");
  });

  it("navigates to /lobby when Back to Lobby is clicked", () => {
    render(<AIGame />);

    const lobbyButtons = screen.getAllByRole("button", { name: /back to lobby/i });
    fireEvent.click(lobbyButtons[0]);
    expect(navigateMock).toHaveBeenCalledWith("/lobby");
  });

  it("calls aiService.createGame and transitions to playing phase", async () => {
    createGameMock.mockResolvedValueOnce(fakeCreateResponse("X"));
    render(<AIGame />);

    fireEvent.click(screen.getByRole("button", { name: /start game/i }));

    await waitFor(() => {
      expect(createGameMock).toHaveBeenCalledWith("medium", "X");
    });

    // Should now be in playing phase — "vs AI" header appears
    await waitFor(() => {
      expect(screen.getByText(/vs AI/)).toBeInTheDocument();
    });
  });

  it("shows error message when createGame fails", async () => {
    createGameMock.mockRejectedValueOnce(new Error("Network error"));
    render(<AIGame />);

    fireEvent.click(screen.getByRole("button", { name: /start game/i }));

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("shows 'Creating game...' while request is in flight", async () => {
    createGameMock.mockReturnValue(new Promise(() => {}));
    render(<AIGame />);

    fireEvent.click(screen.getByRole("button", { name: /start game/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /creating game/i })).toBeInTheDocument();
    });
  });
});

describe("AIGame — playing phase", () => {
  afterEach(cleanup);

  beforeEach(() => {
    navigateMock.mockReset();
    createGameMock.mockReset();
    makeMoveMock.mockReset();
  });

  it("renders the game board after starting", async () => {
    createGameMock.mockResolvedValueOnce(fakeCreateResponse("X"));
    render(<AIGame />);

    fireEvent.click(screen.getByRole("button", { name: /start game/i }));

    // Wait for board to appear — 9 cells + other buttons
    await waitFor(() => {
      expect(screen.getByText(/vs AI/)).toBeInTheDocument();
    });
  });

  it("displays difficulty label during play", async () => {
    createGameMock.mockResolvedValueOnce(fakeCreateResponse("X"));
    render(<AIGame />);

    fireEvent.click(screen.getByRole("button", { name: /start game/i }));

    await waitFor(() => {
      expect(screen.getByText("(medium)")).toBeInTheDocument();
    });
  });
});
