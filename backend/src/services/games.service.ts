// Games service — business logic for game operations
// Create game, validate moves, win detection, draw detection

import type { GameState, GameStatus, Player } from '../types/game';

// ───────────────── CONST ERROR ─────────────────

export const MOVE_ERRORS = {
  NOT_ACTIVE:           'Game is not active',
  WAITING_FOR_OPPONENT: 'Waiting for opponent',
  GAME_FINISHED:        'Game already finished',
  GAME_CANCELLED:       'Game has been cancelled',
  GAME_ABANDONED:       'Game has been abandoned',
  INVALID_CELL:         'Invalid cell index',
  CELL_OCCUPIED:        'Cell already occupied',
  NOT_IN_GAME:          'You are not in this game',
  NOT_YOUR_TURN:        'Not your turn',
} as const;

// ───────────────── Types ─────────────────

export interface MoveValidationResult {
  valid: boolean;
  error?: string;
}

// ───────────────── Interns Helpers ─────────────────

//We need to return null, not a throw
const safeGetPlayerSymbol = (
  game: GameState,
  userId: number,
): Player | null => {
  if (userId === game.player1Id) return game.player1Symbol;
  if (userId === game.player2Id) return game.player2Symbol;
  return null;
};

//Check cell index
const isCellIndexValid = (cellIndex: number, boardSize: number): boolean =>
  Number.isInteger(cellIndex) &&
  cellIndex >= 0 &&
  cellIndex < boardSize * boardSize;

type NonPlayableStatus = Exclude<GameStatus, 'IN_PROGRESS'>;

const statusErrorMap: Record<NonPlayableStatus, string> = {
  WAITING:   MOVE_ERRORS.WAITING_FOR_OPPONENT,
  FINISHED:  MOVE_ERRORS.GAME_FINISHED,
  DRAW:      MOVE_ERRORS.GAME_FINISHED,
  CANCELLED: MOVE_ERRORS.GAME_CANCELLED,
  ABANDONED: MOVE_ERRORS.GAME_ABANDONED,
};

// ───────────────── Main Functions ─────────────────

//  VALIDATE MOVE
export const validateMove = (
  gameState: GameState,
  cellIndex: number,
  userId: number,
): MoveValidationResult => {

  //game still in progress ?
  if (gameState.status !== 'IN_PROGRESS') {
    const error = statusErrorMap[gameState.status] ?? MOVE_ERRORS.NOT_ACTIVE;
    return { valid: false, error };
  }

  //Cell index valid ?
  if (!isCellIndexValid(cellIndex, gameState.boardSize)) {
    return { valid: false, error: MOVE_ERRORS.INVALID_CELL };
  }

  //Cell value === null ?
  if (gameState.boardState[cellIndex] !== null) {
    return { valid: false, error: MOVE_ERRORS.CELL_OCCUPIED };
  }

  //Player is in the game ?
  const symbol = safeGetPlayerSymbol(gameState, userId);
  if (symbol === null) {
    return { valid: false, error: MOVE_ERRORS.NOT_IN_GAME };
  }

  //Player turn ?
  if (symbol !== gameState.currentTurn) {
    return { valid: false, error: MOVE_ERRORS.NOT_YOUR_TURN };
  }

  return { valid: true };
};
