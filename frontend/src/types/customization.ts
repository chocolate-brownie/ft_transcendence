/**
 * Theme & Symbol Customization Types — Issue #209
 *
 * Defines the types and constants for visual customization of local games.
 * Players can choose between three themes (Classic, Neon, Retro) and
 * three symbol types (X/O, Emojis, Custom Initials).
 */

export type Theme = "classic" | "neon" | "retro";
export type SymbolType = "default" | "emoji" | "initials";

export interface EmojiPair {
  id: string;
  player1: string;
  player2: string;
  label: string;
}

export interface CustomSymbols {
  type: SymbolType;
  player1Symbol: string;
  player2Symbol: string;
}

export interface GameCustomization {
  theme: Theme;
  symbols: CustomSymbols;
}

/** Five preset emoji pairs for the emoji symbol selector — Issue #209 */
export const EMOJI_PAIRS: EmojiPair[] = [
  { id: "sword-shield", player1: "⚔️", player2: "🛡️", label: "Sword vs Shield" },
  { id: "fire-ice", player1: "🔥", player2: "❄️", label: "Fire vs Ice" },
  { id: "moon-sun", player1: "🌙", player2: "☀️", label: "Moon vs Sun" },
  { id: "ghost-pumpkin", player1: "👻", player2: "🎃", label: "Ghost vs Pumpkin" },
  { id: "lion-tiger", player1: "🦁", player2: "🐯", label: "Lion vs Tiger" },
];

/** Default symbols: standard X and O */
export const DEFAULT_SYMBOLS: CustomSymbols = {
  type: "default",
  player1Symbol: "X",
  player2Symbol: "O",
};

/** Default customization: classic theme with standard X/O */
export const DEFAULT_CUSTOMIZATION: GameCustomization = {
  theme: "classic",
  symbols: DEFAULT_SYMBOLS,
};
