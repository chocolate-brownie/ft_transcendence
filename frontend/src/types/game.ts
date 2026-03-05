export type CellValue = "X" | "O" | null;
export type PlayerSymbol = "X" | "O";

export type Board = CellValue[];

export interface GameBoardProps {
  board: Board;
  onCellClick: (index: number) => void;
  disabled?: boolean;
  className?: string;
  winningLine?: number[] | null;
  winnerSymbol?: "X" | "O" | null;
  playerSymbol?: "X" | "O" | null;
  gameOver?: boolean;
}
