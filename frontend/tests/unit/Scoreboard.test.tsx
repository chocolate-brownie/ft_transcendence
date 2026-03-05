import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import Scoreboard from "../../src/components/Game/Scoreboard";

describe("Scoreboard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders both players with avatar images when provided", () => {
    render(
      <Scoreboard
        player1={{ id: 1, username: "alice", avatarUrl: "https://cdn.test/alice.png" }}
        player2={{ id: 2, username: "bob", avatarUrl: "https://cdn.test/bob.png" }}
        player1Symbol="X"
        player2Symbol="O"
        currentTurn="X"
        serverStatus="IN_PROGRESS"
        player1Score={1}
        player2Score={0}
      />,
    );

    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("bob")).toBeInTheDocument();
    expect(screen.getByTestId("player1-avatar-image")).toBeInTheDocument();
    expect(screen.getByTestId("player2-avatar-image")).toBeInTheDocument();
  });

  it("shows waiting slot and default avatar image when player avatar is missing", () => {
    render(
      <Scoreboard
        player1={{ id: 1, username: "alice", avatarUrl: null }}
        player2={null}
        player1Symbol="X"
        player2Symbol="O"
        currentTurn="X"
        serverStatus="WAITING"
        player1Score={0}
        player2Score={0}
      />,
    );

    expect(screen.getByText("Waiting...")).toBeInTheDocument();
    const p1Avatar = screen.getByTestId("player1-avatar-image");
    const p2Avatar = screen.getByTestId("player2-avatar-image");
    expect(p1Avatar).toBeInTheDocument();
    expect(p2Avatar).toBeInTheDocument();
    expect(p1Avatar).toHaveAttribute("src", "/default-avatar.png");
    expect(p2Avatar).toHaveAttribute("src", "/default-avatar.png");
  });

  it("highlights the active player card during in-progress games", () => {
    render(
      <Scoreboard
        player1={{ id: 1, username: "alice", avatarUrl: null }}
        player2={{ id: 2, username: "bob", avatarUrl: null }}
        player1Symbol="X"
        player2Symbol="O"
        currentTurn="O"
        serverStatus="IN_PROGRESS"
        player1Score={0}
        player2Score={0}
      />,
    );

    expect(screen.getByTestId("scoreboard-player2-card").className).toContain("ring-2");
    expect(screen.getByTestId("scoreboard-player1-card").className).not.toContain(
      "ring-2",
    );
  });

  it("mirrors the right player card layout", () => {
    render(
      <Scoreboard
        player1={{ id: 1, username: "alice", avatarUrl: null }}
        player2={{ id: 2, username: "bob", avatarUrl: null }}
        player1Symbol="X"
        player2Symbol="O"
        currentTurn="X"
        serverStatus="IN_PROGRESS"
        player1Score={0}
        player2Score={0}
      />,
    );

    expect(screen.getByTestId("scoreboard-player2-card").className).toContain("text-right");
    expect(screen.getByTestId("scoreboard-player2-row").className).toContain("flex-row-reverse");
  });
});
