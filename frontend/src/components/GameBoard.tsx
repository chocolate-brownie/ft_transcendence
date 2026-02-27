import type { Board } from "../types/game";
import type { GameBoardProps } from "../types/game";

// Every possible winning outcome
const WIN_LINES: number[][] = [
  [0, 1, 2], // horizontal
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6], // vertical
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8], // diagonal
  [2, 4, 6],
];

// Function to check a line
function findWinningLine(board: Board) {
  for (let i = 0; i < WIN_LINES.length; i++) {
    const line = WIN_LINES[i];
    const a = line[0];
    const b = line[1];
    const c = line[2];

    const value = board[a];

    if (value && value === board[b] && value === board[c]) {
      return line;
    }
  }

  return null;
}

// Component to render the game board
export default function GameBoard({
  board,
  onCellClick,
  disabled = false,
  className = "",
}: GameBoardProps) {
  const winningLine = findWinningLine(board);

  return (
    <div className={`inline-block rounded-lg bg-pong-surface p-2.5 ${className}`}>
      <div className="grid grid-cols-3 gap-2.5 w-[min(80vw,360px)]">
        {board.map((cell, index) => (
          <button
            key={index}
            disabled={disabled || cell !== null}
            onClick={() => onCellClick(index)}
            className={
              "aspect-square rounded-lg bg-white text-4xl md:text-5xl " +
              "hover:bg-transparent transition-colors duration-200 " +
              "disabled:cursor-not-allowed " +
              (winningLine && winningLine.includes(index)
                ? "disabled:bg-transparent winner-cell"
                : "disabled:hover:bg-white")
            }
          >
            <span
              className={
                (cell === "X"
                  ? "text-pong-accent"
                  : cell === "O"
                  ? "text-pong-secondary"
                  : "") + " font-sans font-bold"
              }
            >
              {cell}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}