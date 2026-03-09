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

import { useCallback, useState } from "react";

import type { CellValue } from "../types/game";
import type {
  CustomSymbols,
  GameCustomization,
  Theme,
} from "../types/customization";
import { DEFAULT_CUSTOMIZATION } from "../types/customization";

const STORAGE_KEY = "game-customization";

/** Read persisted customization from localStorage, falling back to defaults. */
function loadCustomization(): GameCustomization {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CUSTOMIZATION;
    const parsed = JSON.parse(raw) as GameCustomization;
    /* Validate the shape minimally — ignore corrupt data */
    if (parsed.theme && parsed.symbols?.type) return parsed;
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
    setCustomizationState((prev) => {
      const next = { ...prev, theme };
      saveCustomization(next);
      return next;
    });
  }, []);

  const setSymbols = useCallback((symbols: CustomSymbols) => {
    setCustomizationState((prev) => {
      const next = { ...prev, symbols };
      saveCustomization(next);
      return next;
    });
  }, []);

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
    [symbols],
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
