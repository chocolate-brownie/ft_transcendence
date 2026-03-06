import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it("navigates to matchmaking when Find Match is clicked", async () => {
    render(<GameLobby />);

    fireEvent.click(screen.getByRole("button", { name: /find match/i }));

    expect(navigateMock).toHaveBeenCalledWith("/matchmaking?boardSize=3");
  });
});
