import type { GameBoardProps } from "../../types/game";

// Component to render the game board
export default function GameBoard({
  board,
  onCellClick,
  disabled = false,
  className = "",
  winningLine = null,
  waitForNewGame,
}: GameBoardProps) {
  const handleCellClick = (index: number) => {
    if (disabled || board[index] !== null) return;
    onCellClick(index);
  };

  return (
    <div className={`inline-block rounded-lg bg-pong-surface p-3.5  
    ${className}
    ${waitForNewGame
      ? " absolute"
      : ""}`}>
      <div className={`grid grid-cols-3 gap-2.5 w-[min(80vw,360px)]
     
      `}>
        {board.map((cell, index) => (
          <button
            key={index}
            disabled={disabled}
            disabled={waitForNewGame}
            onClick={() => handleCellClick(index)}
            className={`
            aspect-square rounded-lg bg-white text-6xl
            transition-colors duration-200
            ${disabled ? "cursor-not-allowed opacity-60" : ""}
            ${!waitForNewGame && !disabled && cell === null ? "cursor-pointer hover:bg-transparent" : ""}
            ${waitForNewGame && !disabled && cell !== null ? "cursor-default" : ""}
            ${winningLine && winningLine.includes(index) ? "bg-transparent winner-cell" : ""}
            ${disabled ? "cursor-pointer" : "cursor-not-allowed"}
            ${waitForNewGame ? "cursor-not-allowed opacity-40" : ""}
            `}
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
