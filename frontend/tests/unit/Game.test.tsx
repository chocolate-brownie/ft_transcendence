import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Game from "../../src/pages/Game";

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

describe("Game page socket wiring", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    useSocketMock.mockReset();
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
    expect(screen.getAllByRole("button", { name: "X" }).length).toBeGreaterThan(0);
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
});
