/**
 * ThemeSelector — Issue #209, PR #306
 *
 * Renders three clickable theme cards (Classic, Neon, Retro) in a responsive
 * grid. Each card shows a name, description, and a 3x3 mini preview grid
 * colored with the theme's actual palette so the player sees what the board
 * will look like before starting.
 *
 * The color constants are hardcoded here (not pulled from Tailwind tokens)
 * because they represent game-canvas colors that live outside the design
 * system. Lesson from PR #306: keep preview colors co-located with the
 * component that renders them to avoid stale references.
 */

import type { Theme } from "../../types/customization";

interface Props {
  selected: Theme;
  onSelect: (theme: Theme) => void;
}

/** Visual config for each theme — colors used in the mini preview grid. */
const THEME_CONFIG = [
  {
    value: "classic" as const,
    label: "Classic",
    description: "Clean and minimal",
    bg: "#ffffff",
    grid: "#e5e5e5",
    p1: "#f08b0f",
    p2: "#759933",
  },
  {
    value: "neon" as const,
    label: "Neon",
    description: "Futuristic glow",
    bg: "#1a0a2e",
    grid: "#00fff7",
    p1: "#ff2d95",
    p2: "#00fff7",
  },
  {
    value: "retro" as const,
    label: "Retro",
    description: "Arcade nostalgia",
    bg: "#fdf6e3",
    grid: "#8b6914",
    p1: "#c0392b",
    p2: "#2471a3",
  },
];

/**
 * 3x3 mini preview grid that shows an "X" in top-left (player 1 color)
 * and an "O" in the center (player 2 color). The remaining cells are empty
 * with the grid background color.
 */
function MiniPreview({
  bg,
  grid,
  p1,
  p2,
}: {
  bg: string;
  grid: string;
  p1: string;
  p2: string;
}) {
  const cells = Array.from({ length: 9 });

  return (
    <div
      className="mx-auto grid h-16 w-16 grid-cols-3 gap-1 rounded-lg p-1"
      style={{ backgroundColor: bg }}
    >
      {cells.map((_, i) => {
        /* Top-left = X (index 0), center = O (index 4), rest empty */
        const isP1 = i === 0;
        const isP2 = i === 4;

        return (
          <div
            key={i}
            className="flex items-center justify-center rounded-sm text-xs font-bold"
            style={{ backgroundColor: grid }}
          >
            {isP1 && <span style={{ color: p1 }}>X</span>}
            {isP2 && <span style={{ color: p2 }}>O</span>}
          </div>
        );
      })}
    </div>
  );
}

export default function ThemeSelector({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {THEME_CONFIG.map((theme) => {
        const isActive = selected === theme.value;

        return (
          <button
            key={theme.value}
            type="button"
            onClick={() => onSelect(theme.value)}
            aria-pressed={isActive}
            className={
              "flex flex-col items-center gap-2 rounded-xl border-2 p-4 shadow-sm " +
              "transition-all cursor-pointer " +
              (isActive
                ? "border-pong-accent bg-pong-surface"
                : "border-black/10 bg-white hover:border-pong-accent/30")
            }
          >
            <MiniPreview
              bg={theme.bg}
              grid={theme.grid}
              p1={theme.p1}
              p2={theme.p2}
            />
            <span className="text-sm font-semibold text-pong-text">
              {theme.label}
            </span>
            <span className="text-xs text-pong-text/50">
              {theme.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
