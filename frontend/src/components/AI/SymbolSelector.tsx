/**
 * SymbolSelector — Issue #183
 *
 * Two large buttons (X / O) for choosing the player's symbol.
 * Includes helper text: "X always goes first. Choosing O means the AI moves first."
 */
import type { PlayerSymbol } from "../../types/game";

interface SymbolSelectorProps {
  selected: PlayerSymbol;
  onSelect: (s: PlayerSymbol) => void;
}

export default function SymbolSelector({ selected, onSelect }: SymbolSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        {(["X", "O"] as const).map((symbol) => {
          const isActive = selected === symbol;
          const colorClass = symbol === "X" ? "text-pong-accent" : "text-pong-secondary";
          const borderClass =
            symbol === "X"
              ? "border-pong-accent bg-pong-accent/10"
              : "border-pong-secondary bg-pong-secondary/10";
          return (
            <button
              key={symbol}
              type="button"
              onClick={() => onSelect(symbol)}
              className={`flex h-20 w-20 items-center justify-center rounded-xl border-2 text-4xl font-bold transition-all ${
                isActive
                  ? `${borderClass} ${colorClass}`
                  : "border-transparent bg-black/10 text-pong-text/40 hover:bg-black/15"
              }`}
            >
              {symbol}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-pong-text/50">
        X always goes first. Choosing O means the AI moves first.
      </p>
    </div>
  );
}
