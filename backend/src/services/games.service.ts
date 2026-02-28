// Games service — business logic for game operations
// Create game, validate moves, win detection, draw detection

import prisma from '../lib/prisma';
import { initializeBoard } from '../types/game';
import type {
  GameState,
  GameStatus,
  Player,
  Board,
  CellValue,
} from '../types/game';

// ───────────────── CONST ERROR (Move) ─────────────────

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

// ───────────────── CONST ERROR (Create) ─────────────────

export const CREATE_ERRORS = {
  SELF_PLAY:        'Cannot play against yourself',
  PLAYER_NOT_FOUND: 'Player not found',
  NOT_FRIENDS:      'Can only play with friends',
} as const;

// ───────────────── Types ─────────────────

export interface MoveValidationResult {
  valid: boolean;
  error?: string;
}

export interface CreateValidationResult {
  valid: boolean;
  error?: string;
}

// ───────────────── Interns Helpers ─────────────────

const safeGetPlayerSymbol = (
  game: GameState,
  userId: number,
): Player | null => {
  if (userId === game.player1Id) return game.player1Symbol;
  if (userId === game.player2Id) return game.player2Symbol;
  return null;
};

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

// Response for players
const playerSelect = {
  select: { id: true, username: true, avatarUrl: true },
} as const;

// ───────────────── Main Functions ─────────────────

//        VALIDATE MOVE

export const validateMove = (
  gameState: GameState,
  cellIndex: number,
  userId: number,
): MoveValidationResult => {

  if (gameState.status !== 'IN_PROGRESS') {
    const error = statusErrorMap[gameState.status] ?? MOVE_ERRORS.NOT_ACTIVE;
    return { valid: false, error };
  }

  if (!isCellIndexValid(cellIndex, gameState.boardSize)) {
    return { valid: false, error: MOVE_ERRORS.INVALID_CELL };
  }

  if (gameState.boardState[cellIndex] !== null) {
    return { valid: false, error: MOVE_ERRORS.CELL_OCCUPIED };
  }

  const symbol = safeGetPlayerSymbol(gameState, userId);
  if (symbol === null) {
    return { valid: false, error: MOVE_ERRORS.NOT_IN_GAME };
  }

  if (symbol !== gameState.currentTurn) {
    return { valid: false, error: MOVE_ERRORS.NOT_YOUR_TURN };
  }

  return { valid: true };
};

//        CHECK WIN

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

type WinResult = {
  winner: 'X' | 'O';
  line: readonly [number, number, number];
} | null;

export const checkWinnerWithLine = (board: Board, boardSize: number = 3): WinResult => {
  if (boardSize !== 3) throw new Error('Only 3x3 boards supported');
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (
      board[a] !== null &&
      board[a] === board[b] &&
      board[a] === board[c]
    ) {
      return { winner: board[a], line };
    }
  }
  return null;
};

//        CHECK DRAW

export const checkDraw = (board: Board): boolean => {
  return board.every(cell => cell !== null);
};

//        CHECK GAME OVER

export type GameOverResult =
  | { gameOver: true;  winner: Player; isDraw: false; line: readonly [number, number, number] }
  | { gameOver: true;  winner: null;   isDraw: true;  line: null }
  | { gameOver: false; winner: null;   isDraw: false; line: null };

export const checkGameOver = (board: Board, boardSize: number = 3): GameOverResult => {
  const winResult = checkWinnerWithLine(board, boardSize);

  if (winResult) {
    return { gameOver: true, winner: winResult.winner, isDraw: false, line: winResult.line };
  }

  if (checkDraw(board)) {
    return { gameOver: true, winner: null, isDraw: true, line: null };
  }

  return { gameOver: false, winner: null, isDraw: false, line: null };
};

// ───────────────── DB Operations ─────────────────

//        VALIDATE CREATE GAME (DB checks)

export const validateCreateGame = async (
  player1Id: number,
  player2Id: number,
): Promise<CreateValidationResult> => {

  //has player 2 ?
  const player2 = await prisma.user.findUnique({
    where: { id: player2Id },
  });
  if (!player2) {
    return { valid: false, error: CREATE_ERRORS.PLAYER_NOT_FOUND };
  }

  //has relationship ?
  const friendship = await prisma.friend.findFirst({
    where: {
      status: 'ACCEPTED',
      OR: [
        { requesterId: player1Id, addresseeId: player2Id },
        { requesterId: player2Id, addresseeId: player1Id },
      ],
    },
  });
  if (!friendship) {
    return { valid: false, error: CREATE_ERRORS.NOT_FRIENDS };
  }

  return { valid: true };
};

//        CREATE GAME

export const createGameInDb = async (
  player1Id: number,
  player2Id?: number,
) => {
  const hasOpponent = player2Id != null;

  const game = await prisma.game.create({
    data: {
      player1Id,
      player2Id:     player2Id ?? null,
      boardState:    initializeBoard(),
      boardSize:     3,
      currentTurn:   'X',
      status:        hasOpponent ? 'IN_PROGRESS' : 'WAITING',
      player1Symbol: 'X',
      player2Symbol: 'O',
      startedAt:     hasOpponent ? new Date() : null,
    },
    include: {
      player1: playerSelect,
      player2: playerSelect,
    },
  });

  return game;
};

//        MAKE MOVE

export const makeMoveInDb = async (
  gameId: number,
  cellIndex: number,
  userId: number,
) => {
  return prisma.$transaction(async (tx) => {

    // 1. Fetch game
    const game = await tx.game.findUnique({
      where: { id: gameId },
      include: {
        player1: playerSelect,
        player2: playerSelect,
      },
    });

    if (!game) throw new Error('Game not found');

    // 2. Validate the move
    const gameState = game as unknown as GameState;
    const validation = validateMove(gameState, cellIndex, userId);
    if (!validation.valid) {
      throw new Error(`Invalid move: ${validation.error}`);
    }

    // 3. Apply the move (new array, no mutation)
    const playerSymbol = safeGetPlayerSymbol(gameState, userId)!;
    const newBoard = [...(game.boardState as CellValue[])] as Board;
    newBoard[cellIndex] = playerSymbol;

    // 4. Check game over
    const result = checkGameOver(newBoard, game.boardSize);

    const updateData: Record<string, unknown> = {
      boardState: newBoard,
    };

    if (result.gameOver && result.winner) {
      updateData.status     = 'FINISHED';
      updateData.winnerId   = result.winner === game.player1Symbol
        ? game.player1Id
        : game.player2Id;
      updateData.finishedAt = new Date();
    } else if (result.gameOver && result.isDraw) {
      updateData.status     = 'DRAW';
      updateData.winnerId   = null;
      updateData.finishedAt = new Date();
    } else {
      updateData.currentTurn = game.currentTurn === 'X' ? 'O' : 'X';
    }

    // 5. Save to database
    return tx.game.update({
      where: { id: gameId },
      data:  updateData,
      include: {
        player1: playerSelect,
        player2: playerSelect,
      },
    });
  });
};

// ───────────────── GET GAME BY ID ─────────────────

export const FETCH_ERRORS = {
  NOT_FOUND:     'Game not found',
  ACCESS_DENIED: 'Access denied',
} as const;

export const getGameByIdFromDb = async (
  gameId: number,
  userId: number,
) => {
  // 1. Fetch game with player info
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      player1: playerSelect,
      player2: playerSelect,
    },
  });

  // 2. Check existence
  if (!game) {
    throw new Error(FETCH_ERRORS.NOT_FOUND);
  }

  // 3. Authorization: only players can view
  const isPlayer =
    game.player1Id === userId ||
    game.player2Id === userId;

  if (!isPlayer) {
    throw new Error(FETCH_ERRORS.ACCESS_DENIED);
  }

  // 4. Compute moveCount from board
  const board = game.boardState as CellValue[];
  const moveCount = board.filter(cell => cell !== null).length;

  return {
    ...game,    // Copy all game attributs
    moveCount,  // Add Move counter
  };
};
