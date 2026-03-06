import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Game from "../../src/pages/Game";
import { gamesService } from "../../src/services/games.service";

type Handler = (...args: unknown[]) => void;

class MockSocket {
  connected = true;
  emit = vi.fn();
  connect = vi.fn(() => {
    this.connected = true;
    this.trigger("connect");
  });
  private handlers = new Map<string, Set<Handler>>();
  private onceHandlers = new Map<string, Set<Handler>>();

  on(event: string, handler: Handler) {
    const set = this.handlers.get(event) ?? new Set<Handler>();
    set.add(handler);
    this.handlers.set(event, set);
    return this;
  }

  once(event: string, handler: Handler) {
    const set = this.onceHandlers.get(event) ?? new Set<Handler>();
    set.add(handler);
    this.onceHandlers.set(event, set);
    return this;
  }

  off(event: string, handler?: Handler) {
    if (!handler) {
      this.handlers.delete(event);
      this.onceHandlers.delete(event);
      return this;
    }
    this.handlers.get(event)?.delete(handler);
    this.onceHandlers.get(event)?.delete(handler);
    return this;
  }

  trigger(event: string, payload?: unknown) {
    this.handlers.get(event)?.forEach((handler) => handler(payload));
    this.onceHandlers.get(event)?.forEach((handler) => handler(payload));
    this.onceHandlers.delete(event);
  }
}

const navigateMock = vi.fn();
const useSocketMock = vi.fn<{ socket: MockSocket | null }, []>();
let mockGameId = "42";

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => ({ id: mockGameId }),
  };
});

vi.mock("../../src/context/SocketContext", () => ({
  useSocket: () => useSocketMock(),
}));

vi.mock("../../src/services/games.service", () => ({
  gamesService: {
    createGame: vi.fn(),
  },
}));

describe("Game page socket wiring", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mockGameId = "42";
    navigateMock.mockReset();
    useSocketMock.mockReset();
    vi.mocked(gamesService.createGame).mockReset();
  });

  function joinRoom(socket: MockSocket) {
    act(() => {
      socket.trigger("room_joined", {
        gameId: 42,
        game: {
          boardState: Array(9).fill(null),
          currentTurn: "X",
          status: "IN_PROGRESS",
          yourSymbol: "X",
          player1: { id: 1, username: "alice", avatarUrl: null },
          player2: { id: 2, username: "bob", avatarUrl: null },
          player1Symbol: "X",
          player2Symbol: "O",
          startedAt: null,
        },
      });
    });
  }

  it("maps game_over payload with finalBoard/result and shows winner message", () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });

    render(<Game />);
    joinRoom(socket);

    act(() => {
      socket.trigger("game_over", {
        gameId: 42,
        result: "win",
        winner: { id: 1, username: "alice", symbol: "X" },
        finalBoard: ["X", "X", "X", null, null, null, null, null, null],
        winningLine: [0, 1, 2],
      });
    });

    expect(screen.getByText("Game over: You won")).toBeInTheDocument();
    expect(screen.getByLabelText("Cell 1, winning cell")).toBeInTheDocument();
    expect(screen.getByLabelText("Cell 2, winning cell")).toBeInTheDocument();
    expect(screen.getByLabelText("Cell 3, winning cell")).toBeInTheDocument();
  });

  it("treats generic socket error as non-fatal while game is ready", () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });

    render(<Game />);
    joinRoom(socket);

    act(() => {
      socket.trigger("error", { message: "Already searching for a game" });
    });

    expect(screen.queryByText("Game error")).not.toBeInTheDocument();
    expect(screen.getByText("Already searching for a game")).toBeInTheDocument();
  });

  it("shows game over modal and closes when user clicks close button", () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });

    render(<Game />);
    joinRoom(socket);

    act(() => {
      socket.trigger("game_over", {
        gameId: 42,
        result: "draw",
        winner: null,
        loser: null,
        totalMoves: 9,
        finalBoard: ["X", "O", "X", "X", "O", "O", "O", "X", "X"],
        winningLine: null,
      });
    });

    const modal = screen.getByTestId("game-over-modal");
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByText("It's a Draw! 🤝")).toBeInTheDocument();
    expect(within(modal).getByText("bob (O)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close game over modal/i }));
    expect(screen.queryByTestId("game-over-modal")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /view result/i })).toBeInTheDocument();
  });

  it("renders lose-state message and closes on Escape key", () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });

    render(<Game />);
    joinRoom(socket);

    act(() => {
      socket.trigger("game_over", {
        gameId: 42,
        result: "win",
        winner: { id: 9, username: "opponent", symbol: "O" },
        loser: { id: 1, username: "you", symbol: "X" },
        totalMoves: 8,
        finalBoard: ["X", "O", "X", "O", "O", "X", "O", "X", null],
        winningLine: [1, 4, 7],
      });
    });

    const modal = screen.getByTestId("game-over-modal");
    expect(within(modal).getByText("You Lost 😢")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("game-over-modal")).not.toBeInTheDocument();
  });

  it("creates rematch and navigates to new game when Play Again is clicked", async () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });
    vi.mocked(gamesService.createGame).mockResolvedValue({
      id: 77,
    } as never);

    render(<Game />);
    joinRoom(socket);

    act(() => {
      socket.trigger("game_over", {
        gameId: 42,
        result: "win",
        winner: { id: 1, username: "alice", symbol: "X" },
        loser: { id: 2, username: "bob", symbol: "O" },
        totalMoves: 5,
        finalBoard: ["X", "X", "X", null, "O", null, null, "O", null],
        winningLine: [0, 1, 2],
      });
    });

    fireEvent.click(screen.getByRole("button", { name: /play again/i }));

    await waitFor(() => {
      expect(gamesService.createGame).toHaveBeenCalledWith({
        player2Id: 2,
        sourceGameId: 42,
      });
      expect(navigateMock).toHaveBeenCalledWith("/game/77");
    });
  });

  it("reopens modal after closing when another game_over event arrives", () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });

    render(<Game />);
    joinRoom(socket);

    act(() => {
      socket.trigger("game_over", {
        gameId: 42,
        result: "draw",
        winner: null,
        loser: null,
        totalMoves: 9,
        finalBoard: ["X", "O", "X", "X", "O", "O", "O", "X", "X"],
        winningLine: null,
      });
    });

    fireEvent.click(screen.getByRole("button", { name: /close game over modal/i }));
    expect(screen.queryByTestId("game-over-modal")).not.toBeInTheDocument();

    act(() => {
      socket.trigger("game_over", {
        gameId: 42,
        result: "win",
        winner: { id: 1, username: "alice", symbol: "X" },
        loser: { id: 2, username: "bob", symbol: "O" },
        totalMoves: 5,
        finalBoard: ["X", "X", "X", null, "O", null, null, "O", null],
        winningLine: [0, 1, 2],
      });
    });

    expect(screen.getByTestId("game-over-modal")).toBeInTheDocument();
  });

  it("reopens game over modal when View Result is clicked", () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });

    render(<Game />);
    joinRoom(socket);

    act(() => {
      socket.trigger("game_over", {
        gameId: 42,
        result: "draw",
        winner: null,
        loser: null,
        totalMoves: 9,
        finalBoard: ["X", "O", "X", "X", "O", "O", "O", "X", "X"],
        winningLine: null,
      });
    });

    fireEvent.click(screen.getByRole("button", { name: /close game over modal/i }));
    expect(screen.queryByTestId("game-over-modal")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /view result/i }));
    expect(screen.getByTestId("game-over-modal")).toBeInTheDocument();
  });

  it("maps shared player contract across room_joined and game_over payloads", () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });

    render(<Game />);

    act(() => {
      socket.trigger("room_joined", {
        gameId: 42,
        game: {
          boardState: Array(9).fill(null),
          currentTurn: "X",
          status: "IN_PROGRESS",
          yourSymbol: "X",
          player1: { id: 1, username: "alice", avatarUrl: null },
          player2: { id: 2, username: "bob", avatarUrl: "https://cdn.test/bob.png" },
          player1Symbol: "X",
          player2Symbol: "O",
          startedAt: null,
        },
      });
    });

    act(() => {
      socket.trigger("game_over", {
        gameId: 42,
        result: "draw",
        winner: null,
        loser: null,
        totalMoves: 9,
        finalBoard: ["X", "O", "X", "X", "O", "O", "O", "X", "X"],
        winningLine: null,
      });
    });

    const modal = screen.getByTestId("game-over-modal");
    expect(within(modal).getByText("bob (O)")).toBeInTheDocument();
    expect(within(modal).getByAltText("bob avatar")).toBeInTheDocument();
  });

  it("shows View Result only when game is over and modal is hidden", () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });

    render(<Game />);
    joinRoom(socket);

    expect(screen.queryByRole("button", { name: /view result/i })).not.toBeInTheDocument();

    act(() => {
      socket.trigger("game_over", {
        gameId: 42,
        result: "win",
        winner: { id: 1, username: "alice", symbol: "X" },
        loser: { id: 2, username: "bob", symbol: "O" },
        totalMoves: 5,
        finalBoard: ["X", "X", "X", null, "O", null, null, "O", null],
        winningLine: [0, 1, 2],
      });
    });

    expect(screen.queryByRole("button", { name: /view result/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /close game over modal/i }));
    expect(screen.getByRole("button", { name: /view result/i })).toBeInTheDocument();
  });

  it("prevents duplicate rematch requests on rapid Play Again clicks", async () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });

    let resolveCreateGame: ((value: { id: number }) => void) | null = null;
    const createGamePromise = new Promise<{ id: number }>((resolve) => {
      resolveCreateGame = resolve;
    });
    vi.mocked(gamesService.createGame).mockReturnValue(createGamePromise as never);

    render(<Game />);
    joinRoom(socket);

    act(() => {
      socket.trigger("game_over", {
        gameId: 42,
        result: "win",
        winner: { id: 1, username: "alice", symbol: "X" },
        loser: { id: 2, username: "bob", symbol: "O" },
        totalMoves: 5,
        finalBoard: ["X", "X", "X", null, "O", null, null, "O", null],
        winningLine: [0, 1, 2],
      });
    });

    const playAgainButton = screen.getByRole("button", { name: /play again/i });
    fireEvent.click(playAgainButton);
    fireEvent.click(playAgainButton);

    expect(gamesService.createGame).toHaveBeenCalledTimes(1);

    resolveCreateGame?.({ id: 88 });
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/game/88");
    });
  });

  it("disables local rematch action when opponent rematch event is received", () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });

    render(<Game />);
    joinRoom(socket);

    act(() => {
      socket.trigger("game_over", {
        gameId: 42,
        result: "win",
        winner: { id: 1, username: "alice", symbol: "X" },
        loser: { id: 2, username: "bob", symbol: "O" },
        totalMoves: 5,
        finalBoard: ["X", "X", "X", null, "O", null, null, "O", null],
        winningLine: [0, 1, 2],
      });
    });

    const playAgainButton = screen.getByRole("button", { name: /play again/i });
    expect(playAgainButton).not.toBeDisabled();

    act(() => {
      socket.trigger("rematch_received", { newGameId: 99 });
    });

    expect(playAgainButton).toBeDisabled();
    expect(navigateMock).toHaveBeenCalledWith("/game/99");
  });

  it("shows waiting state UI with animated indicator and cancel button, board disabled", () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });

    render(<Game />);

    act(() => {
      socket.trigger("room_joined", {
        gameId: 42,
        game: {
          boardState: Array(9).fill(null),
          currentTurn: "X",
          status: "WAITING",
          yourSymbol: "X",
          player1: { id: 1, username: "alice", avatarUrl: null },
          player2: null,
          player1Symbol: "X",
          player2Symbol: "O",
          startedAt: null,
        },
      });
    });

    // "Waiting for second player" text is unique to the animated indicator in the waiting block
    expect(screen.getByText(/waiting for second player/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel game/i })).toBeInTheDocument();
    expect(screen.getByText("Waiting...")).toBeInTheDocument();

    const cellButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.getAttribute("aria-label")?.startsWith("Cell"));
    expect(cellButtons).toHaveLength(9);
    expect(cellButtons.every((cell) => cell.hasAttribute("disabled"))).toBe(true);
  });

  it("updates waiting opponent card when opponent_joined event is received", () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });

    render(<Game />);

    act(() => {
      socket.trigger("room_joined", {
        gameId: 42,
        game: {
          boardState: Array(9).fill(null),
          currentTurn: "X",
          status: "WAITING",
          yourSymbol: "X",
          player1: { id: 1, username: "alice", avatarUrl: null },
          player2: null,
          player1Symbol: "X",
          player2Symbol: "O",
          startedAt: null,
        },
      });
    });

    expect(screen.getByText("Waiting...")).toBeInTheDocument();

    act(() => {
      socket.trigger("opponent_joined", {
        opponent: { id: 2, username: "bob", avatarUrl: null },
      });
    });

    const player2Card = screen.getByTestId("scoreboard-player2-card");
    expect(within(player2Card).getByText(/bob/i)).toBeInTheDocument();
  });

  it("does not overwrite player2 when player2 client receives opponent_joined for player1", () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });

    render(<Game />);

    act(() => {
      socket.trigger("room_joined", {
        gameId: 42,
        game: {
          boardState: Array(9).fill(null),
          currentTurn: "X",
          status: "IN_PROGRESS",
          yourSymbol: "O",
          player1: { id: 1, username: "admin", avatarUrl: "/uploads/avatars/admin.png" },
          player2: { id: 2, username: "admin2", avatarUrl: "/uploads/avatars/admin2.png" },
          player1Symbol: "X",
          player2Symbol: "O",
          startedAt: null,
        },
      });
    });

    act(() => {
      socket.trigger("opponent_joined", {
        opponent: { id: 1, username: "admin" },
      });
    });

    const player1Card = screen.getByTestId("scoreboard-player1-card");
    const player2Card = screen.getByTestId("scoreboard-player2-card");

    expect(within(player1Card).getByText(/admin/i)).toBeInTheDocument();
    expect(within(player2Card).getByText(/admin2/i)).toBeInTheDocument();
    expect(within(player2Card).getByTestId("player2-avatar-image")).toBeInTheDocument();
  });

  it("shows disconnection banner, disables board, and clears on opponent_reconnected", async () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });

    render(<Game />);
    joinRoom(socket);

    act(() => {
      socket.trigger("opponent_disconnected", {
        gameId: 42,
        username: "bob",
        waitTime: 30,
      });
    });

    expect(screen.getByTestId("opponent-disconnected-banner")).toBeInTheDocument();
    expect(screen.getByText(/bob disconnected/i)).toBeInTheDocument();
    expect(screen.getByText(/waiting for reconnection \(30s\)/i)).toBeInTheDocument();

    const cellButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.getAttribute("aria-label")?.startsWith("Cell"));
    expect(cellButtons.every((cell) => cell.hasAttribute("disabled"))).toBe(true);

    act(() => {
      socket.trigger("opponent_reconnected", { gameId: 42 });
    });

    await waitFor(() => {
      expect(screen.queryByTestId("opponent-disconnected-banner")).not.toBeInTheDocument();
    });
  });

  it("maps game_forfeited payload to game over state and winner message", () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });

    render(<Game />);
    joinRoom(socket);

    act(() => {
      socket.trigger("game_forfeited", {
        gameId: 42,
        forfeitedBy: { id: 2, username: "bob" },
        winner: { id: 1, username: "alice" },
      });
    });

    expect(screen.getByText("Game over: You won")).toBeInTheDocument();
    expect(screen.getByTestId("game-over-modal")).toBeInTheDocument();
    expect(screen.getAllByText("You Won! 🎉").length).toBeGreaterThan(0);
  });

  it("rejoins the room when Try again is clicked while socket is still connected", async () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });

    render(<Game />);
    joinRoom(socket);

    const initialJoinCalls = socket.emit.mock.calls.filter(
      (call) => call[0] === "join_game_room",
    ).length;
    expect(initialJoinCalls).toBe(1);

    act(() => {
      socket.trigger("disconnect");
    });

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    await waitFor(() => {
      const joinCalls = socket.emit.mock.calls.filter(
        (call) => call[0] === "join_game_room",
      ).length;
      expect(joinCalls).toBe(2);
    });
  });

  it("leaves old room and joins new room when gameId route param changes", async () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });

    const { rerender } = render(<Game />);
    joinRoom(socket);

    const joinCallsBefore = socket.emit.mock.calls.filter((call) => call[0] === "join_game_room");
    expect(joinCallsBefore).toHaveLength(1);
    expect(joinCallsBefore[0][1]).toEqual({ gameId: 42 });

    mockGameId = "77";
    rerender(<Game />);

    await waitFor(() => {
      const leaveCalls = socket.emit.mock.calls.filter((call) => call[0] === "leave_game_room");
      const joinCalls = socket.emit.mock.calls.filter((call) => call[0] === "join_game_room");
      expect(leaveCalls.some((call) => call[1]?.gameId === 42)).toBe(true);
      expect(joinCalls.some((call) => call[1]?.gameId === 77)).toBe(true);
    });
  });

  it("rejoins the room after reconnect when Try again is clicked while disconnected", async () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });

    socket.connect = vi.fn(() => {
      socket.connected = true;
    });

    render(<Game />);
    joinRoom(socket);

    const initialJoinCalls = socket.emit.mock.calls.filter(
      (call) => call[0] === "join_game_room",
    ).length;
    expect(initialJoinCalls).toBe(1);

    socket.connected = false;
    act(() => {
      socket.trigger("disconnect");
    });

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(socket.connect).toHaveBeenCalledTimes(1);

    act(() => {
      socket.trigger("connect");
    });

    await waitFor(() => {
      const joinCalls = socket.emit.mock.calls.filter(
        (call) => call[0] === "join_game_room",
      ).length;
      expect(joinCalls).toBe(2);
    });
  });

  it("navigates to lobby and home from modal actions", () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });

    render(<Game />);
    joinRoom(socket);

    act(() => {
      socket.trigger("game_over", {
        gameId: 42,
        result: "win",
        winner: { id: 9, username: "opponent", symbol: "O" },
        loser: { id: 1, username: "you", symbol: "X" },
        totalMoves: 6,
        finalBoard: ["X", "O", "X", null, "O", null, null, "O", "X"],
        winningLine: [1, 4, 7],
      });
    });

    fireEvent.click(screen.getByRole("button", { name: /new game \(lobby\)/i }));
    expect(navigateMock).toHaveBeenCalledWith("/lobby");

    act(() => {
      socket.trigger("game_over", {
        gameId: 42,
        result: "draw",
        winner: null,
        loser: null,
        totalMoves: 9,
        finalBoard: ["X", "O", "X", "X", "O", "O", "O", "X", "X"],
        winningLine: null,
      });
    });

    fireEvent.click(screen.getByRole("button", { name: /back to home/i }));
    expect(navigateMock).toHaveBeenCalledWith("/");
  });

  it("emits leave_game_room only once when navigating away", () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });

    render(<Game />);
    joinRoom(socket);

    act(() => {
      socket.trigger("game_over", {
        gameId: 42,
        result: "win",
        winner: { id: 1, username: "alice", symbol: "X" },
        loser: { id: 2, username: "bob", symbol: "O" },
        totalMoves: 5,
        finalBoard: ["X", "X", "X", null, "O", null, null, "O", null],
        winningLine: [0, 1, 2],
      });
    });

    fireEvent.click(screen.getByRole("button", { name: /new game \(lobby\)/i }));
    expect(navigateMock).toHaveBeenCalledWith("/lobby");

    const leaveCalls = socket.emit.mock.calls.filter(
      (call) => call[0] === "leave_game_room",
    );
    expect(leaveCalls).toHaveLength(1);
  });
});

it("renders a 4x4 game with 16 cells and updated move counter", () => {
  const socket = new MockSocket();
  useSocketMock.mockReturnValue({ socket });

  render(<Game />);

  act(() => {
    socket.trigger("room_joined", {
      gameId: 42,
      game: {
        boardState: Array(16).fill(null),
        currentTurn: "X",
        status: "IN_PROGRESS",
        yourSymbol: "X",
        player1: { id: 1, username: "alice", avatarUrl: null },
        player2: { id: 2, username: "bob", avatarUrl: null },
        player1Symbol: "X",
        player2Symbol: "O",
        startedAt: null,
      },
    });
  });

  expect(screen.getByText(/move 0 \/ 16/i)).toBeInTheDocument();

  const cellButtons = screen
    .getAllByRole("button")
    .filter((btn) => btn.getAttribute("aria-label")?.startsWith("Cell"));

  expect(cellButtons).toHaveLength(16);
});

it("renders a 5x5 winning line of 4 cells on game over", () => {
  const socket = new MockSocket();
  useSocketMock.mockReturnValue({ socket });

  render(<Game />);

  act(() => {
    socket.trigger("room_joined", {
      gameId: 42,
      game: {
        boardState: Array(25).fill(null),
        currentTurn: "X",
        status: "IN_PROGRESS",
        yourSymbol: "X",
        player1: { id: 1, username: "alice", avatarUrl: null },
        player2: { id: 2, username: "bob", avatarUrl: null },
        player1Symbol: "X",
        player2Symbol: "O",
        startedAt: null,
      },
    });
  });

  act(() => {
    socket.trigger("game_over", {
      gameId: 42,
      result: "win",
      winner: { id: 1, username: "alice", symbol: "X" },
      loser: { id: 2, username: "bob", symbol: "O" },
      totalMoves: 4,
      finalBoard: [
        null, "X", null, null, null,
        null, null, "X", null, null,
        null, null, null, "X", null,
        null, null, null, null, "X",
        null, null, null, null, null,
      ],
      winningLine: [1, 7, 13, 19],
    });
  });

  expect(screen.getByText(/game over: you won/i)).toBeInTheDocument();
  expect(screen.getByText(/move 4 \/ 25/i)).toBeInTheDocument();

  expect(screen.getByLabelText("Cell 2, winning cell")).toBeInTheDocument();
  expect(screen.getByLabelText("Cell 8, winning cell")).toBeInTheDocument();
  expect(screen.getByLabelText("Cell 14, winning cell")).toBeInTheDocument();
  expect(screen.getByLabelText("Cell 20, winning cell")).toBeInTheDocument();
});