/**
 * SymbolSelector — Issue #209, PR #306
 *
 * Three-tab selector that lets players choose their board symbols:
 *   1. Classic X/O (default)
 *   2. Emoji pairs (preset list from EMOJI_PAIRS)
 *   3. Custom initials (1-2 uppercase chars per player)
 *
 * XSS prevention: initials input strips HTML tags server-side style
 * (lesson from PR #131 — always sanitize on input, not just display).
 */

import { useState } from "react";

import type { CustomSymbols, SymbolType } from "../../types/customization";
import { EMOJI_PAIRS } from "../../types/customization";

interface Props {
  symbols: CustomSymbols;
  onSelect: (symbols: CustomSymbols) => void;
}

/** Tab definitions — order matters for rendering. */
const TABS: { type: SymbolType; label: string }[] = [
  { type: "default", label: "Classic X/O" },
  { type: "emoji", label: "Emojis" },
  { type: "initials", label: "Initials" },
];

/** Strip HTML tags to prevent XSS in user-provided initials. */
function sanitize(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}

export default function SymbolSelector({ symbols, onSelect }: Props) {
  const [activeTab, setActiveTab] = useState<SymbolType>(symbols.type);

  /** Switch tab and emit default symbols for the new tab type. */
  function handleTabChange(tab: SymbolType) {
    setActiveTab(tab);

    if (tab === "default") {
      onSelect({ type: "default", player1Symbol: "X", player2Symbol: "O" });
    }
    /* Emoji and initials tabs don't auto-select — user picks explicitly. */
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-black/10">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.type;
          return (
            <button
              key={tab.type}
              type="button"
              onClick={() => handleTabChange(tab.type)}
              className={
                "px-4 py-2 text-sm font-semibold transition-colors " +
                (isActive
                  ? "border-b-2 border-pong-accent text-pong-text"
                  : "text-pong-text/50 hover:text-pong-text")
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "default" && <ClassicTab />}
      {activeTab === "emoji" && <EmojiTab symbols={symbols} onSelect={onSelect} />}
      {activeTab === "initials" && <InitialsTab symbols={symbols} onSelect={onSelect} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Classic tab — simple X vs O display                               */
/* ------------------------------------------------------------------ */

function ClassicTab() {
  return (
    <div className="flex items-center justify-center gap-6 py-6">
      <span className="text-5xl font-bold text-pong-text">X</span>
      <span className="text-lg text-pong-text/50">vs</span>
      <span className="text-5xl font-bold text-pong-text">O</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Emoji tab — grid of preset emoji pairs                            */
/* ------------------------------------------------------------------ */

function EmojiTab({
  symbols,
  onSelect,
}: {
  symbols: CustomSymbols;
  onSelect: (s: CustomSymbols) => void;
}) {
  /** Check if a pair matches the currently selected symbols. */
  function isSelected(p1: string, p2: string): boolean {
    return (
      symbols.type === "emoji" &&
      symbols.player1Symbol === p1 &&
      symbols.player2Symbol === p2
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {EMOJI_PAIRS.map((pair) => {
        const active = isSelected(pair.player1, pair.player2);

        return (
          <button
            key={pair.id}
            type="button"
            onClick={() =>
              onSelect({
                type: "emoji",
                player1Symbol: pair.player1,
                player2Symbol: pair.player2,
              })
            }
            aria-pressed={active}
            className={
              "flex flex-col items-center gap-1 rounded-lg border-2 p-3 " +
              "transition-all cursor-pointer " +
              (active
                ? "border-pong-accent bg-pong-surface"
                : "border-black/10 bg-white hover:border-pong-accent/30")
            }
          >
            <span className="text-2xl">
              {pair.player1} vs {pair.player2}
            </span>
            <span className="text-xs text-pong-text/50">{pair.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Initials tab — two text inputs, max 2 uppercase chars each        */
/* ------------------------------------------------------------------ */

function InitialsTab({
  symbols,
  onSelect,
}: {
  symbols: CustomSymbols;
  onSelect: (s: CustomSymbols) => void;
}) {
  const p1 = symbols.type === "initials" ? symbols.player1Symbol : "";
  const p2 = symbols.type === "initials" ? symbols.player2Symbol : "";

  /** Sanitize, uppercase, and clamp to 2 chars. */
  function handleChange(player: 1 | 2, raw: string) {
    const clean = sanitize(raw).toUpperCase().slice(0, 2);
    onSelect({
      type: "initials",
      player1Symbol: player === 1 ? clean : p1,
      player2Symbol: player === 2 ? clean : p2,
    });
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="flex items-center gap-4">
        {/* Player 1 input */}
        <div className="flex flex-col items-center gap-1">
          <label htmlFor="p1-initial" className="text-xs font-medium text-pong-text/50">
            Player 1
          </label>
          <input
            id="p1-initial"
            name="p1-initial"
            type="text"
            maxLength={2}
            value={p1}
            onChange={(e) => handleChange(1, e.target.value)}
            className={
              "w-20 rounded-lg border border-black/10 bg-white px-4 py-3 " +
              "text-center text-3xl font-bold text-pong-text " +
              "focus:border-pong-accent focus:outline-none"
            }
          />
        </div>

        <span className="mt-5 text-lg text-pong-text/50">vs</span>

        {/* Player 2 input */}
        <div className="flex flex-col items-center gap-1">
          <label htmlFor="p2-initial" className="text-xs font-medium text-pong-text/50">
            Player 2
          </label>
          <input
            id="p2-initial"
            name="p2-initial"
            type="text"
            maxLength={2}
            value={p2}
            onChange={(e) => handleChange(2, e.target.value)}
            className={
              "w-20 rounded-lg border border-black/10 bg-white px-4 py-3 " +
              "text-center text-3xl font-bold text-pong-text " +
              "focus:border-pong-accent focus:outline-none"
            }
          />
        </div>
      </div>

      <p className="text-xs text-pong-text/50">Enter 1-2 characters for each player</p>
    </div>
  );
}
