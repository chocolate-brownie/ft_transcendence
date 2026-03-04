import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import BracketView from "../../src/components/Tournament/BracketView";
import type {
  BracketResponse,
  TournamentParticipant,
} from "../../src/services/tournament.service";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const participants: TournamentParticipant[] = [
  {
    id: 1,
    userId: 10,
    seed: 1,
    eliminatedInRound: null,
    user: { id: 10, username: "alice", avatarUrl: null },
  },
  {
    id: 2,
    userId: 20,
    seed: 2,
    eliminatedInRound: null,
    user: { id: 20, username: "bob", avatarUrl: null },
  },
];

const bracket: BracketResponse = {
  tournamentId: 1,
  name: "Spring Cup",
  status: "IN_PROGRESS",
  totalRounds: 1,
  currentRound: 1,
  matches: [
    {
      id: 1,
      round: 1,
      matchNumber: 1,
      player1: { id: 10, username: "alice", avatarUrl: null },
      player2: { id: 20, username: "bob", avatarUrl: null },
      winner: { id: 10, username: "alice" },
      gameId: 99,
      completedAt: "2026-03-04T00:00:00.000Z",
    },
    {
      id: 2,
      round: 1,
      matchNumber: 2,
      player1: null,
      player2: null,
      winner: null,
      gameId: null,
      completedAt: null,
    },
  ],
};

describe("BracketView", () => {
  it("navigates to game on Enter and Space for completed clickable card", () => {
    navigateMock.mockReset();
    render(<BracketView bracket={bracket} participants={participants} />);

    const [card] = screen.getAllByRole("button", { name: /final/i });
    expect(card).toBeDefined();
    fireEvent.keyDown(card, { key: "Enter" });
    fireEvent.keyDown(card, { key: " " });

    expect(navigateMock).toHaveBeenCalledTimes(2);
    expect(navigateMock).toHaveBeenNthCalledWith(1, "/game/99");
    expect(navigateMock).toHaveBeenNthCalledWith(2, "/game/99");
  });

  it("does not expose button role for pending non-clickable cards", () => {
    render(<BracketView bracket={bracket} participants={participants} />);

    expect(screen.queryByRole("button", { name: /waiting for players/i })).toBeNull();
  });
});
