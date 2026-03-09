/**
 * DifficultySelector unit tests — Issue #183
 *
 * Verifies the three difficulty cards render correctly,
 * call onSelect with the right value, and visually distinguish the active card.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import DifficultySelector from "../../src/components/AI/DifficultySelector";

describe("DifficultySelector", () => {
  afterEach(cleanup);

  it("renders Easy, Medium, and Hard buttons", () => {
    const { container } = render(
      <DifficultySelector selected="medium" onSelect={vi.fn()} />,
    );

    const buttons = container.querySelectorAll("button");
    expect(buttons).toHaveLength(3);
    expect(screen.getByText("Easy")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("Hard")).toBeInTheDocument();
  });

  it("renders descriptions for each difficulty", () => {
    render(<DifficultySelector selected="easy" onSelect={vi.fn()} />);

    expect(screen.getByText(/random moves/)).toBeInTheDocument();
    expect(screen.getByText(/fair challenge/)).toBeInTheDocument();
    expect(screen.getByText(/plays perfectly/)).toBeInTheDocument();
  });

  it("calls onSelect with the correct difficulty value", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <DifficultySelector selected="medium" onSelect={onSelect} />,
    );

    const buttons = container.querySelectorAll("button");
    buttons[0].click(); // Easy
    expect(onSelect).toHaveBeenCalledWith("easy");

    buttons[2].click(); // Hard
    expect(onSelect).toHaveBeenCalledWith("hard");
  });

  it("applies active border style only to the selected card", () => {
    const { container } = render(
      <DifficultySelector selected="hard" onSelect={vi.fn()} />,
    );

    const buttons = container.querySelectorAll("button");
    expect(buttons[2].className).toContain("border-red-400");
    expect(buttons[0].className).toContain("border-white/10");
    expect(buttons[1].className).toContain("border-white/10");
  });
});
