// ── Cell & Board ──────────────────────────────────────────────
export type CellValue = 'X' | 'O' | null;

// Board : 3 x 3
// Index :  0 | 1 | 2
//          3 | 4 | 5
//          6 | 7 | 8
export type Board = [
  CellValue, CellValue, CellValue,
  CellValue, CellValue, CellValue,
  CellValue, CellValue, CellValue,
];

// ── Enums logiques ────────────────────────────────────────────
export type GameStatus =
  | 'WAITING'
  | 'IN_PROGRESS'
  | 'FINISHED'
  | 'DRAW'
  | 'CANCELLED'
  | 'ABANDONED';

export type Player = 'X' | 'O';

// ── Game Data Struct ─────────────────────────────────
export interface GameState {
  id: number;

  boardState: Board;               // "board_state" in DB
  boardSize: number;               // 3 = 3x3, 4 = 4x4, 5 = 5x5
  currentTurn: Player;
  status: GameStatus;
  winnerId: number | null;         // FK in User (null = in_progress or nul)

  player1Id: number;
  player2Id: number | null;        // null = waiting for players
  player1Symbol: Player;
  player2Symbol: Player;

  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;         // "finished_at" in DB
}

// ── Helpers ───────────────────────────────────────────────────

// Return Null Board
export function initializeBoard(): Board {
  return [
    null, null, null,
    null, null, null,
    null, null, null,
  ];
}

// Return 'X' or 'O' attribuate to a player in the game
// Send error if bad userId
export function getPlayerSymbol(game: GameState, userId: number): Player {
  if (userId === game.player1Id) return game.player1Symbol;
  if (userId === game.player2Id) return game.player2Symbol;
  throw new Error(`User ${userId} is not a player in game ${game.id}`);
}

// Check Player Turn
export function isPlayerTurn(game: GameState, userId: number): boolean {
  if (game.status !== 'IN_PROGRESS') return false;
  const symbol = getPlayerSymbol(game, userId);
  return symbol === game.currentTurn;
}
