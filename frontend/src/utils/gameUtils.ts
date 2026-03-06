// frontend/src/utils/gameUtils.ts
import type { Board, BoardSize, PlayerSymbol } from "../types/game";

function getBoardSize(board: Board, boardSize?: BoardSize): BoardSize {
  if (boardSize) {
    return boardSize;
  }

  const size = Math.sqrt(board.length);
  if (size === 3 || size === 4 || size === 5) {
    return size;
  }

  return 3;
}

function getWinLength(boardSize: BoardSize): number {
  return boardSize === 3 ? 3 : 4;
}

function inBounds(row: number, col: number, boardSize: number): boolean {
  return row >= 0 && row < boardSize && col >= 0 && col < boardSize;
}

function checkDirection(
  board: Board,
  boardSize: BoardSize,
  startRow: number,
  startCol: number,
  rowStep: number,
  colStep: number,
  winLength: number,
): number[] | null {
  const first = board[startRow * boardSize + startCol];
  if (!first) {
    return null;
  }

  const line: number[] = [];

  for (let i = 0; i < winLength; i++) {
    const row = startRow + i * rowStep;
    const col = startCol + i * colStep;

    if (!inBounds(row, col, boardSize)) {
      return null;
    }

    const index = row * boardSize + col;
    if (board[index] !== first) {
      return null;
    }

    line.push(index);
  }

  return line;
}

// Returns the winning line indices if a player has won, otherwise null.
export function findWinningLine(
  board: Board,
  boardSize?: BoardSize,
): number[] | null {
  const resolvedBoardSize = getBoardSize(board, boardSize);
  const winLength = getWinLength(resolvedBoardSize);
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ] as const;

  for (let row = 0; row < resolvedBoardSize; row++) {
    for (let col = 0; col < resolvedBoardSize; col++) {
      for (const [rowStep, colStep] of directions) {
        const line = checkDirection(
          board,
          resolvedBoardSize,
          row,
          col,
          rowStep,
          colStep,
          winLength,
        );

        if (line) {
          return line;
        }
      }
    }
  }

  return null;
}

export function findWinner(
  board: Board,
  boardSize?: BoardSize,
): PlayerSymbol | null {
  const line = findWinningLine(board, boardSize);
  if (!line) {
    return null;
  }

  return board[line[0]];
}