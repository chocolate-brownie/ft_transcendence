import type { GameBoardProps } from "../../types/game";

// Component to render the game board
export default function GameBoard({
  board,
  onCellClick,
  disabled = false,
  className = "",
  winningLine = null,
}: GameBoardProps) {
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
              "disabled:cursor-not-allowed disabled:opacity-60 " +
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
                  : "") + " font-sans font-bold" +
                (cell ? " cell-piece" : "")
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