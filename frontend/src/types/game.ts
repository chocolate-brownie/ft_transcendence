export type CellValue = "X" | "O" | null;

export type Board = CellValue[];

export interface GameBoardProps {
  board: Board;
  onCellClick: (index: number) => void;
  disabled?: boolean;
  className?: string;
}