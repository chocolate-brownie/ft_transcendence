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

// ───────────────── Verify Completed Game ─────────────────

/**
 * Verify a completed game has all required data.
 * Returns true if valid, false + logs errors if not.
 */
export const verifyCompletedGame = (game: {
  id: number;
  status: string;
  finishedAt: Date | null;
  winnerId: number | null;
  player1Id: number;
  player2Id: number | null;
  boardState: unknown;
}): boolean => {
  let isValid = true;

  // Must have completion timestamp
  if (!game.finishedAt) {
    console.error(`Game ${game.id}: Missing finishedAt timestamp`);
    isValid = false;
  }

  // Must have both players
  if (!game.player2Id) {
    console.error(`Game ${game.id}: Completed without player2`);
    isValid = false;
  }

  // If FINISHED, must have a winnerId that is one of the two players
  if (game.status === 'FINISHED') {
    if (game.winnerId === null) {
      console.error(`Game ${game.id}: FINISHED but no winnerId`);
      isValid = false;
    } else if (
      game.winnerId !== game.player1Id &&
      game.winnerId !== game.player2Id
    ) {
      console.error(`Game ${game.id}: winnerId ${game.winnerId} is not a player`);
      isValid = false;
    }
  }

  // If DRAW, winnerId must be null and board must be full
  if (game.status === 'DRAW') {
    if (game.winnerId !== null) {
      console.error(`Game ${game.id}: DRAW but winnerId is set`);
      isValid = false;
    }
    const board = game.boardState as CellValue[];
    if (!board.every(cell => cell !== null)) {
      console.warn(`Game ${game.id}: DRAW with non-full board`);
      // warn only — could happen with future rule variants
    }
  }

  return isValid;
};

// ───────────────── DB Operations ─────────────────

//        VALIDATE CREATE GAME (DB checks)

export const validateCreateGame = async (
  player1Id: number,
  player2Id: number,
): Promise<CreateValidationResult> => {

  const player2 = await prisma.user.findUnique({
    where: { id: player2Id },
  });
  if (!player2) {
    return { valid: false, error: CREATE_ERRORS.PLAYER_NOT_FOUND };
  }

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
    const updatedGame = await tx.game.update({
      where: { id: gameId },
      data:  updateData,
      include: {
        player1: playerSelect,
        player2: playerSelect,
        winner:  playerSelect,
      },
    });

    // 6. Verify completed games have valid data
    if (updatedGame.status === 'FINISHED' || updatedGame.status === 'DRAW') {
      const isValid = verifyCompletedGame(updatedGame);
      if (!isValid) {
        // Log but don't throw — game data is already saved,
        // this catches logic bugs during development
        console.error(`Game ${updatedGame.id}: completed but verification failed`);
      } else {
        const outcome = updatedGame.status === 'DRAW'
          ? 'Draw'
          : `Winner: ${updatedGame.winner?.username ?? updatedGame.winnerId}`;
        console.log(`Game ${updatedGame.id} completed — ${outcome}`);
      }
    }

    return updatedGame;
  });
};

// ───────────────── GET GAME BY ID ─────────────────

export const getGameByIdFromDb = async (
  gameId: number,
  userId: number,
) => {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      player1: playerSelect,
      player2: playerSelect,
      winner:  playerSelect,
    },
  });

  const isPlayer = game?.player1Id === userId || game?.player2Id === userId;

  if (!game || !isPlayer) {
    throw new Error('Game not found');
  }

  const board = game.boardState as CellValue[];
  const moveCount = board.filter(cell => cell !== null).length;

  return {
    ...game,
    moveCount,
  };
};

// ───────────────── GET COMPLETED GAMES (History) ─────────────────

export const getCompletedGamesFromDb = async (
  userId: number,
  limit: number = 10,
  offset: number = 0,
) => {
  const [games, total] = await Promise.all([
    prisma.game.findMany({
      where: {
        status: { in: ['FINISHED', 'DRAW'] },
        OR: [
          { player1Id: userId },
          { player2Id: userId },
        ],
      },
      include: {
        player1: playerSelect,
        player2: playerSelect,
        winner:  playerSelect,
      },
      orderBy: { finishedAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.game.count({
      where: {
        status: { in: ['FINISHED', 'DRAW'] },
        OR: [
          { player1Id: userId },
          { player2Id: userId },
        ],
      },
    }),
  ]);

  return { games, total };
};
