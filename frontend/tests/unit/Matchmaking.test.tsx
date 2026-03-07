import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Matchmaking from "../../src/pages/Matchmaking";

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
  };
});

vi.mock("../../src/context/SocketContext", () => ({
  useSocket: () => useSocketMock(),
}));

describe("Matchmaking", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    navigateMock.mockReset();
    useSocketMock.mockReset();
  });

  it("shows connecting state when socket is unavailable", () => {
    useSocketMock.mockReturnValue({ socket: null });
    render(<Matchmaking />);

    expect(screen.getByText(/connecting to matchmaking/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry connection/i })).toBeInTheDocument();
  });

  it("emits find_game on mount and renders queue position on searching event", () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });
    render(<Matchmaking />);

    expect(socket.emit).toHaveBeenCalledWith("find_game");

    act(() => {
      socket.trigger("searching", { position: 2 });
    });

    expect(screen.getByText(/position in queue/i)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("navigates to game after match_found transition delay", () => {
    vi.useFakeTimers();
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });
    render(<Matchmaking />);

    act(() => {
      socket.trigger("match_found", {
        gameId: 42,
        opponent: { username: "bob" },
        yourSymbol: "X",
      });
    });

    expect(screen.getByText(/match found/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalledWith("/game/42");

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(navigateMock).toHaveBeenCalledWith("/game/42");
    vi.useRealTimers();
  });

  it("returns to lobby on search_cancelled event", () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });
    render(<Matchmaking />);

    act(() => {
      socket.trigger("search_cancelled");
    });

    expect(navigateMock).toHaveBeenCalledWith("/lobby");
  });

  it("shows error state and retries matchmaking when connected", () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });
    render(<Matchmaking />);

    act(() => {
      socket.trigger("error", { message: "Already in an active game" });
    });

    expect(screen.getByText(/matchmaking error/i)).toBeInTheDocument();
    expect(screen.getByText(/already in an active game/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(socket.emit).toHaveBeenLastCalledWith("find_game");
  });

  it("surfaces connection-lost error on disconnect", () => {
    const socket = new MockSocket();
    useSocketMock.mockReturnValue({ socket });
    render(<Matchmaking />);

    act(() => {
      socket.trigger("disconnect");
    });

    expect(screen.getByText(/connection lost/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("emits cancel_search exactly once when cancel is clicked and component unmounts", () => {
    const socket = new MockSocket();
    useSocketMock.mockImplementation(() => ({ socket }));

    const { unmount } = render(<Matchmaking />);

    // Confirm we're in searching state
    act(() => {
      socket.trigger("searching", { position: 1 });
    });

    // Click "Back to Lobby" — triggers leaveMatchmaking() which emits cancel_search
    const backButtons = screen.getAllByText(/back to lobby/i);
    fireEvent.click(backButtons[0]);

    const cancelsBefore = socket.emit.mock.calls.filter(
      (call) => call[0] === "cancel_search",
    );
    expect(cancelsBefore).toHaveLength(1);

    // Unmount triggers cleanup effect — cancelledRef prevents second emit
    unmount();

    const cancelsAfter = socket.emit.mock.calls.filter(
      (call) => call[0] === "cancel_search",
    );
    expect(cancelsAfter).toHaveLength(1);
  });
});
