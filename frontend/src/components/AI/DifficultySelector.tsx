/**
 * DifficultySelector — Issue #183
 *
 * Renders three selectable cards (Easy/Medium/Hard) for AI game difficulty.
 * Each card has a color accent and a short description of the AI behavior.
 */
import type { AiDifficulty } from "../../services/ai.service";

interface DifficultySelectorProps {
  selected: AiDifficulty;
  onSelect: (d: AiDifficulty) => void;
}

const levels: {
  value: AiDifficulty;
  label: string;
  description: string;
  color: string;
  selectedBorder: string;
}[] = [
  {
    value: "easy",
    label: "Easy",
    description: "AI makes random moves sometimes. Good for learning.",
    color: "text-emerald-400",
    selectedBorder: "border-emerald-400 bg-emerald-400/10",
  },
  {
    value: "medium",
    label: "Medium",
    description: "AI plays smart most of the time. A fair challenge.",
    color: "text-amber-400",
    selectedBorder: "border-amber-400 bg-amber-400/10",
  },
  {
    value: "hard",
    label: "Hard",
    description: "AI plays perfectly. Can you draw against it?",
    color: "text-red-400",
    selectedBorder: "border-red-400 bg-red-400/10",
  },
];

export default function DifficultySelector({
  selected,
  onSelect,
}: DifficultySelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {levels.map((lvl) => {
        const isActive = selected === lvl.value;
        return (
          <button
            key={lvl.value}
            type="button"
            onClick={() => onSelect(lvl.value)}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              isActive
                ? lvl.selectedBorder
                : "border-transparent bg-black/10 hover:bg-black/15"
            }`}
          >
            <p className={`text-lg font-bold ${lvl.color}`}>{lvl.label}</p>
            <p className="mt-1 text-xs text-pong-text/60">{lvl.description}</p>
          </button>
        );
      })}
    </div>
  );
}
