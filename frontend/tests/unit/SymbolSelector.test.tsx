/**
 * SymbolSelector unit tests — Issue #183
 *
 * Verifies the X/O symbol buttons render, call onSelect correctly,
 * show active styling, and display the helper text about move order.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import SymbolSelector from "../../src/components/AI/SymbolSelector";

describe("SymbolSelector", () => {
  afterEach(cleanup);

  it("renders X and O buttons", () => {
    const { container } = render(<SymbolSelector selected="X" onSelect={vi.fn()} />);

    const buttons = container.querySelectorAll("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0].textContent).toBe("X");
    expect(buttons[1].textContent).toBe("O");
  });

  it("shows helper text about move order", () => {
    render(<SymbolSelector selected="X" onSelect={vi.fn()} />);

    expect(
      screen.getByText("X always goes first. Choosing O means the AI moves first."),
    ).toBeInTheDocument();
  });

  it("calls onSelect with the clicked symbol", () => {
    const onSelect = vi.fn();
    const { container } = render(<SymbolSelector selected="X" onSelect={onSelect} />);

    const buttons = container.querySelectorAll("button");
    buttons[1].click(); // O
    expect(onSelect).toHaveBeenCalledWith("O");

    buttons[0].click(); // X
    expect(onSelect).toHaveBeenCalledWith("X");
  });

  it("highlights the selected symbol with active border", () => {
    const { container } = render(<SymbolSelector selected="O" onSelect={vi.fn()} />);

    const buttons = container.querySelectorAll("button");
    expect(buttons[0].className).toContain("border-white/10");
    expect(buttons[1].className).toContain("border-pong-secondary");
  });

  it("highlights X with accent border when selected", () => {
    const { container } = render(<SymbolSelector selected="X" onSelect={vi.fn()} />);

    const buttons = container.querySelectorAll("button");
    expect(buttons[0].className).toContain("border-pong-accent");
    expect(buttons[1].className).toContain("border-white/10");
  });
});
