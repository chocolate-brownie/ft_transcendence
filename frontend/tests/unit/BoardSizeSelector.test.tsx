import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import BoardSizeSelector from "../../src/components/Customization/BoardSizeSelector";

afterEach(() => {
  cleanup();
});

describe("BoardSizeSelector", () => {
  it("renders the 3 board size options", () => {
    const onSelect = vi.fn();

    render(<BoardSizeSelector selected={3} onSelect={onSelect} />);

    expect(screen.getByRole("button", { name: /3x3/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /4x4/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /5x5/i })).toBeInTheDocument();
  });

  it("calls onSelect with 3, 4 and 5", () => {
    const onSelect = vi.fn();

    render(<BoardSizeSelector selected={3} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: /3x3/i }));
    fireEvent.click(screen.getByRole("button", { name: /4x4/i }));
    fireEvent.click(screen.getByRole("button", { name: /5x5/i }));

    expect(onSelect).toHaveBeenNthCalledWith(1, 3);
    expect(onSelect).toHaveBeenNthCalledWith(2, 4);
    expect(onSelect).toHaveBeenNthCalledWith(3, 5);
  });

  it("highlights the selected size", () => {
    const onSelect = vi.fn();

    render(<BoardSizeSelector selected={4} onSelect={onSelect} />);

    const selectedButton = screen.getByRole("button", { name: /4x4/i });
    const otherButton = screen.getByRole("button", { name: /3x3/i });

    expect(selectedButton).toHaveClass("border-blue-600");
    expect(otherButton).toHaveClass("border-gray-300");
  });
});