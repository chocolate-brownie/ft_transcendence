import type { BoardSize, GameBoardProps } from "../../types/game";

// Component to render the game board
export default function GameBoard({
  board,
  onCellClick,
  disabled = false,
  className = "",
  currentTurnSymbol = null,
  winningLine = null,
  winnerSymbol = null,
  playerSymbol = null,
  gameOver = false,
  boardSize,
}: GameBoardProps) {
  const resolvedBoardSize = boardSize ?? (Math.sqrt(board.length) as BoardSize);

  const didPlayerWin =
    winnerSymbol !== null && playerSymbol !== null && winnerSymbol === playerSymbol;

  const handleCellClick = (index: number) => {
    if (disabled || board[index] !== null) return;
    onCellClick(index);
  };

  const turnHoverClass =
    currentTurnSymbol === "X"
      ? "hover:bg-pong-accent/10"
      : currentTurnSymbol === "O"
        ? "hover:bg-pong-secondary/10"
        : "hover:bg-orange-50";

  const gridColsClass = {
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
  }[resolvedBoardSize];

  const boardWidthClass = {
    3: "w-[min(80vw,360px)]",
    4: "w-[min(80vw,400px)]",
    5: "w-[min(80vw,420px)]",
  }[resolvedBoardSize];

  const cellTextClass = {
    3: "text-6xl",
    4: "text-5xl",
    5: "text-4xl",
  }[resolvedBoardSize];

  return (
    <div className={`inline-block rounded-lg bg-pong-surface p-2.5 shadow-sm ${className}`}>
      <div className={`grid ${gridColsClass} ${boardWidthClass} gap-2.5`}>
        {board.map((cell, index) => (
          <button
            key={index}
            disabled={disabled}
            onClick={() => handleCellClick(index)}
            aria-label={`Cell ${index + 1}${winningLine?.includes(index) ? ", winning cell" : ""}`}
            className={
              `aspect-square rounded-lg bg-white transition-colors duration-200 ${cellTextClass} ` +
              (disabled
                ? "cursor-not-allowed opacity-60"
                : cell === null
                  ? `cursor-pointer ${turnHoverClass}`
                  : "cursor-default") +
              " " +
              (gameOver && winningLine && !winningLine.includes(index)
                ? "opacity-35 saturate-50"
                : "") +
              " " +
              (winningLine && winningLine.includes(index)
                ? didPlayerWin
                  ? "winner-cell winner-cell-win"
                  : "winner-cell winner-cell-loss"
                : "")
            }
          >
            <span
              className={
                (cell === "X"
                  ? "text-pong-accent"
                  : cell === "O"
                    ? "text-pong-secondary"
                    : "") +
                " font-sans font-bold" +
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