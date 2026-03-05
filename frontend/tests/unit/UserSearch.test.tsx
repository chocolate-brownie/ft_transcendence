import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import UserSearch from "../../src/components/UserSearch";

const navigateMock = vi.fn();
const searchUsersMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../src/services/users.service", () => ({
  usersService: {
    searchUsers: (...args: unknown[]) => searchUsersMock(...args),
  },
}));

describe("UserSearch avatar fallback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    navigateMock.mockReset();
    searchUsersMock.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows default avatar when API returns null avatarUrl", async () => {
    searchUsersMock.mockResolvedValue([
      {
        id: 2,
        email: "friend@test.com",
        username: "friend",
        displayName: "Friend",
        avatarUrl: null,
        isOnline: true,
        wins: 0,
        losses: 0,
        draws: 0,
        createdAt: new Date().toISOString(),
      },
    ]);

    render(<UserSearch />);
    fireEvent.change(screen.getByLabelText("Search users"), {
      target: { value: "fri" },
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    await act(async () => {
      await Promise.resolve();
    });

    const avatar = screen.getByAltText("friend avatar") as HTMLImageElement;
    expect(avatar.src).toContain("/default-avatar.png");
  });

  it("falls back to default avatar when image URL fails to load", async () => {
    searchUsersMock.mockResolvedValue([
      {
        id: 3,
        email: "broken@test.com",
        username: "broken",
        displayName: "Broken",
        avatarUrl: "/uploads/avatars/missing-file.png",
        isOnline: false,
        wins: 0,
        losses: 0,
        draws: 0,
        createdAt: new Date().toISOString(),
      },
    ]);

    render(<UserSearch />);
    fireEvent.change(screen.getByLabelText("Search users"), {
      target: { value: "bro" },
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    await act(async () => {
      await Promise.resolve();
    });

    const avatar = screen.getByAltText("broken avatar") as HTMLImageElement;
    fireEvent.error(avatar);
    expect(avatar.src).toContain("/default-avatar.png");
  });
});
