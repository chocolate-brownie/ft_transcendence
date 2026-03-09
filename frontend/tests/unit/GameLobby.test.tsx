import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import GameLobby from "../../src/pages/GameLobby";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("GameLobby", () => {
  afterEach(cleanup);

  beforeEach(() => {
    navigateMock.mockReset();
  });

  it("navigates to matchmaking when Find Match is clicked", () => {
    render(<GameLobby />);

    fireEvent.click(screen.getByRole("button", { name: /find match/i }));

    expect(navigateMock).toHaveBeenCalledWith("/matchmaking?boardSize=3");
  });

  // Difficulty is now selected on the AI game page itself (Issue #183)
  it("navigates to /ai-game when Start AI Game is clicked", () => {
    render(<GameLobby />);

    fireEvent.click(screen.getByRole("button", { name: /start ai game/i }));

    expect(navigateMock).toHaveBeenCalledWith("/ai-game");
  });

  it("does not render a difficulty dropdown on the lobby card", () => {
    render(<GameLobby />);

    expect(screen.queryByLabelText(/difficulty/i)).toBeNull();
  });

  it("navigates to local game when Start Local Game is clicked", () => {
    render(<GameLobby />);

    fireEvent.click(screen.getByRole("button", { name: /start local game/i }));

    expect(navigateMock).toHaveBeenCalledWith("/game/local?boardSize=3");
  });
});
