/**
 * useGameCustomization — Issue #209
 *
 * Shared hook that persists the player's theme and symbol preferences
 * to localStorage. Used by LocalGame, AIGame, Game (online), and
 * tournament games so the customization choice carries across all modes.
 *
 * Returns the current customization state plus setter helpers and
 * derived values (isThemed, renderSymbol) ready to pass to GameBoard.
 */

import { useCallback, useEffect, useState } from "react";

import type { CellValue } from "../types/game";
import type {
  CustomSymbols,
  GameCustomization,
  Theme,
} from "../types/customization";
import { DEFAULT_CUSTOMIZATION } from "../types/customization";

const STORAGE_KEY = "game-customization";
const VALID_THEMES = new Set<string>(["classic", "neon", "retro"]);
const VALID_SYMBOL_TYPES = new Set<string>(["default", "emoji", "initials"]);
const MAX_SYMBOL_LEN = 2;

/** Read persisted customization from localStorage, falling back to defaults. */
function loadCustomization(): GameCustomization {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CUSTOMIZATION;
    const parsed = JSON.parse(raw) as GameCustomization;
    if (
      VALID_THEMES.has(parsed.theme) &&
      VALID_SYMBOL_TYPES.has(parsed.symbols?.type) &&
      typeof parsed.symbols.player1Symbol === "string" &&
      typeof parsed.symbols.player2Symbol === "string" &&
      parsed.symbols.player1Symbol.length <= MAX_SYMBOL_LEN &&
      parsed.symbols.player2Symbol.length <= MAX_SYMBOL_LEN
    ) {
      return parsed;
    }
  } catch {
    /* ignore parse errors */
  }
  return DEFAULT_CUSTOMIZATION;
}

/** Write customization to localStorage. */
function saveCustomization(c: GameCustomization) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch {
    /* storage full or unavailable — silently ignore */
  }
}

export function useGameCustomization() {
  const [customization, setCustomizationState] = useState<GameCustomization>(
    loadCustomization,
  );

  /** Update customization and persist to localStorage. */
  const setCustomization = useCallback((next: GameCustomization) => {
    setCustomizationState(next);
    saveCustomization(next);
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    /* Pure updater — no side effects inside setState. PR #306 follow-up fix. */
    setCustomizationState((prev) => ({ ...prev, theme }));
  }, []);

  const setSymbols = useCallback((symbols: CustomSymbols) => {
    /* Pure updater — no side effects inside setState. PR #306 follow-up fix. */
    setCustomizationState((prev) => ({ ...prev, symbols }));
  }, []);

  /* Persist to localStorage whenever customization changes.
   * Kept in useEffect so updaters stay pure (React StrictMode safe).
   * Issue: PR #306 follow-up — saveCustomization anti-pattern fix. */
  useEffect(() => {
    saveCustomization(customization);
  }, [customization]);

  /* Whether a non-classic theme is active */
  const isThemed = customization.theme !== "classic";

  /* Symbol renderer for emoji / initials modes */
  const { symbols } = customization;
  const renderSymbol = useCallback(
    (cell: CellValue): React.ReactNode => {
      if (cell === null) return null;
      if (symbols.type === "default") return cell;
      return cell === "X" ? symbols.player1Symbol : symbols.player2Symbol;
    },
    [symbols.type, symbols.player1Symbol, symbols.player2Symbol],
  );

  /* Whether we need the renderSymbol callback */
  const hasCustomSymbols = customization.symbols.type !== "default";

  return {
    customization,
    setCustomization,
    setTheme,
    setSymbols,
    isThemed,
    renderSymbol: hasCustomSymbols ? renderSymbol : undefined,
  };
}
