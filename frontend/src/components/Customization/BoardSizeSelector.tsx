import { useEffect, useRef, useState } from "react";

import type { BoardSize } from "../../types/game";

interface Props {
  selected: BoardSize;
  onSelect: (size: BoardSize) => void;
}

function MiniBoard({
  size,
  active = false,
}: {
  size: BoardSize;
  active?: boolean;
}) {
  const cells = Array(size * size).fill(null);

  const gridColsClass = {
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
  }[size];

  const gapClass = {
    3: "gap-1",
    4: "gap-[3px]",
    5: "gap-[2px]",
  }[size];

  const cellRadiusClass = {
    3: "rounded-[4px]",
    4: "rounded-[3px]",
    5: "rounded-[2px]",
  }[size];

  const cellBgClass = active ? "bg-white" : "bg-black/5";

  return (
    <div
      className={`rounded-xl border p-1.5 transition-colors ${
        active
          ? "border-black/10 bg-pong-surface shadow-sm"
          : "border-black/5 bg-white/70"
      }`}
    >
      <div className={`grid h-12 w-12 ${gridColsClass} ${gapClass}`}>
        {cells.map((_, index) => (
          <div
            key={index}
            className={`aspect-square ${cellRadiusClass} ${cellBgClass}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function BoardSizeSelector({ selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const sizes: BoardSize[] = [3, 4, 5];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSelect(size: BoardSize) {
    onSelect(size);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative inline-flex items-start">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Selected board size: ${selected}x${selected}`}
        aria-expanded={open}
        className={
          "relative flex items-center rounded-xl bg-pong-surface shadow-sm " +
          "transition-colors hover:border-pong-accent/30 hover:bg-pong-accent/30 focus:outline-none"
        }
      >
        <MiniBoard size={selected} active />
      </button>

      {open ? (
        <div className="absolute left-full top-0 z-20 ml-2 flex items-start gap-2">
          {sizes
            .filter((size) => size !== selected)
            .map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => handleSelect(size)}
                aria-label={`${size}x${size}`}
                className={
                  "relative flex items-center rounded-xl bg-pong-surface shadow-sm " +
                  "transition-colors hover:border-pong-accent/30 hover:bg-pong-accent/30 focus:outline-none"
                }
              >
                <MiniBoard size={size} />
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
}