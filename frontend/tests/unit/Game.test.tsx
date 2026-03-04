import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => ({ id: "42" }),
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

    fireEvent.click(screen.getByRole("button", { name: /close game over modal/i }));
    expect(screen.queryByTestId("game-over-modal")).not.toBeInTheDocument();
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
      expect(gamesService.createGame).toHaveBeenCalledWith({ player2Id: 2 });
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
});
