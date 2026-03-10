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

/* ── Helpers for finished-phase tests ──────────────────────────────────────── */

/** Drives the component from setup → playing → finished (player wins top row). */
async function reachFinishedPlayerWin() {
  // Board after player wins: X fills top row, O has col 1 rows 1–2.
  // [X, X, X, O, O, null, null, null, null]
  const finalBoard = ["X", "X", "X", "O", "O", null, null, null, null];

  createGameMock.mockResolvedValueOnce(fakeCreateResponse("X"));
  makeMoveMock.mockResolvedValueOnce({
    game: {
      boardState: finalBoard,
      status: "FINISHED",
      winner: "X",
      currentTurn: "O",
    },
    aiMove: null,
  });

  render(<AIGame />);
  fireEvent.click(screen.getByRole("button", { name: /start game/i }));

  // Wait for playing phase
  await waitFor(() => expect(screen.getByText(/vs AI/)).toBeInTheDocument());

  // Click cell 0 — triggers the winning move
  const cells = screen.getAllByRole("button", { name: /^Cell/ });
  fireEvent.click(cells[0]);

  // Wait for finished phase — GameBoard is disabled and still mounted
  await waitFor(() =>
    expect(screen.getAllByRole("button", { name: /winning cell/i }).length).toBeGreaterThan(0),
  );
}

/** Drives the component from setup → playing → finished (AI wins top row). */
async function reachFinishedAiWin() {
  const finalBoard = ["O", "O", "O", "X", "X", null, null, null, null];

  createGameMock.mockResolvedValueOnce(fakeCreateResponse("X"));
  makeMoveMock.mockResolvedValueOnce({
    game: {
      boardState: finalBoard,
      status: "FINISHED",
      winner: "O",
      currentTurn: "X",
    },
    aiMove: null,
  });

  render(<AIGame />);
  fireEvent.click(screen.getByRole("button", { name: /start game/i }));

  await waitFor(() => expect(screen.getByText(/vs AI/)).toBeInTheDocument());

  const cells = screen.getAllByRole("button", { name: /^Cell/ });
  fireEvent.click(cells[3]);

  await waitFor(() =>
    expect(screen.getAllByRole("button", { name: /winning cell/i }).length).toBeGreaterThan(0),
  );
}

/** Drives the component from setup → playing → finished (draw). */
async function reachFinishedDraw() {
  // Full board with no winner: X O X / O X X / O X O
  const finalBoard = ["X", "O", "X", "O", "X", "X", "O", "X", "O"];

  createGameMock.mockResolvedValueOnce(fakeCreateResponse("X"));
  makeMoveMock.mockResolvedValueOnce({
    game: {
      boardState: finalBoard,
      status: "DRAW",
      winner: null,
      currentTurn: "O",
    },
    aiMove: null,
  });

  render(<AIGame />);
  fireEvent.click(screen.getByRole("button", { name: /start game/i }));

  await waitFor(() => expect(screen.getByText(/vs AI/)).toBeInTheDocument());

  const cells = screen.getAllByRole("button", { name: /^Cell/ });
  fireEvent.click(cells[0]);

  // Wait for finished phase — board is still rendered with no winning cells
  await waitFor(() => {
    const allCells = screen.getAllByRole("button", { name: /^Cell/ });
    expect(allCells.length).toBeGreaterThan(0);
  });
}

describe("AIGame — finished phase winning line (Issue #322)", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    createGameMock.mockReset();
    makeMoveMock.mockReset();
  });

  afterEach(cleanup);

  it("highlights the winning cells when the player wins", async () => {
    await reachFinishedPlayerWin();

    // Cells 0, 1, 2 should have the "winning cell" aria-label
    const winningCells = screen.getAllByRole("button", { name: /winning cell/i });
    expect(winningCells).toHaveLength(3);
  });

  it("applies winner-cell-win class to winning cells when player wins", async () => {
    await reachFinishedPlayerWin();

    const winningCells = screen.getAllByRole("button", { name: /winning cell/i });
    winningCells.forEach((cell) => {
      expect(cell.className).toContain("winner-cell-win");
    });
  });

  it("applies winner-cell-loss class to winning cells when AI wins", async () => {
    await reachFinishedAiWin();

    const winningCells = screen.getAllByRole("button", { name: /winning cell/i });
    expect(winningCells.length).toBeGreaterThan(0);
    winningCells.forEach((cell) => {
      expect(cell.className).toContain("winner-cell-loss");
    });
  });

  it("shows no winning cell labels on a draw", async () => {
    await reachFinishedDraw();

    const winningCells = screen.queryAllByRole("button", { name: /winning cell/i });
    expect(winningCells).toHaveLength(0);
  });

  it("board remains rendered in finished phase (not hidden before modal)", async () => {
    await reachFinishedPlayerWin();

    // Board cells should still be in the DOM
    const cells = screen.getAllByRole("button", { name: /^Cell/ });
    expect(cells.length).toBeGreaterThan(0);
  });

  it("modal is not open immediately — appears after the 700ms delay", async () => {
    createGameMock.mockResolvedValueOnce(fakeCreateResponse("X"));
    const finalBoard = ["X", "X", "X", "O", "O", null, null, null, null];
    makeMoveMock.mockResolvedValueOnce({
      game: { boardState: finalBoard, status: "FINISHED", winner: "X", currentTurn: "O" },
      aiMove: null,
    });

    render(<AIGame />);
    fireEvent.click(screen.getByRole("button", { name: /start game/i }));
    await waitFor(() => expect(screen.getByText(/vs AI/)).toBeInTheDocument());

    const cells = screen.getAllByRole("button", { name: /^Cell/ });
    fireEvent.click(cells[0]);

    // Winning line visible immediately — modal still closed
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: /winning cell/i }).length).toBeGreaterThan(0),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // After the 700ms delay, modal opens
    await new Promise((r) => setTimeout(r, 750));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
  }, 10_000);
});
