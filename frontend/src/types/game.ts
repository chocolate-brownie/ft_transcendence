export type CellValue = "X" | "O" | null;
export type BoardSize = 3 | 4 | 5;
export type PlayerSymbol = "X" | "O";

export type Board = CellValue[];

export interface PlayerSummary {
  id: number;
  username: string;
  avatarUrl: string | null;
  symbol: PlayerSymbol;
}

export type RoomPlayerSummary = Omit<PlayerSummary, "symbol">;
export type GameOverPlayerSummary = Omit<PlayerSummary, "avatarUrl">;

export interface GameBoardProps {
  board: Board;
  onCellClick: (index: number) => void;
  disabled?: boolean;
  className?: string;
  currentTurnSymbol?: PlayerSymbol | null;
  winningLine?: number[] | null;
  winnerSymbol?: "X" | "O" | null;
  playerSymbol?: "X" | "O" | null;
  gameOver?: boolean;
  boardSize?: BoardSize;
}
