import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import BoardSizeSelector from "../../src/components/Customization/BoardSizeSelector";

afterEach(() => {
  cleanup();
});

describe("BoardSizeSelector", () => {
  it("renders the selected size and reveals others on click", () => {
    const onSelect = vi.fn();

    render(<BoardSizeSelector selected={3} onSelect={onSelect} />);

    const trigger = screen.getByRole("button", { name: /selected board size: 3x3/i });
    expect(trigger).toBeInTheDocument();

    // Other options are hidden until the trigger is clicked
    expect(screen.queryByRole("button", { name: /^4x4$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^5x5$/i })).not.toBeInTheDocument();

    fireEvent.click(trigger);

    expect(screen.getByRole("button", { name: /^4x4$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^5x5$/i })).toBeInTheDocument();
  });

  it("calls onSelect with the chosen size", () => {
    const onSelect = vi.fn();

    render(<BoardSizeSelector selected={3} onSelect={onSelect} />);

    // Open dropdown
    fireEvent.click(screen.getByRole("button", { name: /selected board size: 3x3/i }));

    fireEvent.click(screen.getByRole("button", { name: /^4x4$/i }));
    expect(onSelect).toHaveBeenCalledWith(4);
  });

  it("marks the trigger with aria-expanded when open", () => {
    const onSelect = vi.fn();

    render(<BoardSizeSelector selected={4} onSelect={onSelect} />);

    const trigger = screen.getByRole("button", { name: /selected board size: 4x4/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
});
