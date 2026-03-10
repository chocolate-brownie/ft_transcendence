import type { BoardSize, GameBoardProps } from "../../types/game";

/**
 * GameBoard — renders the interactive Tic-Tac-Toe grid.
 *
 * Issue #209 — added optional `themed` and `renderSymbol` props for theme
 * customization in local games. When `themed` is true, cells use CSS-variable
 * classes (themed-board, themed-cell, themed-p1/p2) that inherit colors from
 * a parent .game-theme-wrapper[data-theme="..."] container. When false or
 * omitted (default), the original pong-* Tailwind classes are used unchanged.
 * This keeps the online Game.tsx completely unaffected.
 */
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
  themed = false,
  renderSymbol,
}: GameBoardProps) {
  const resolvedBoardSize = boardSize ?? (Math.sqrt(board.length) as BoardSize);

  const didPlayerWin =
    winnerSymbol !== null && playerSymbol !== null && winnerSymbol === playerSymbol;

  const handleCellClick = (index: number) => {
    if (disabled || board[index] !== null) return;
    onCellClick(index);
  };

  /* Issue #209 — hover class changes based on theme mode */
  const turnHoverClass = themed
    ? "hover:brightness-[1.25]"
    : currentTurnSymbol === "X"
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

  /* Issue #209 — board wrapper uses CSS-variable bg when themed, pong-surface otherwise */
  const boardSurfaceClass = themed ? "themed-board" : "bg-pong-surface";

  /* Issue #209 — cell bg uses CSS variable when themed, white otherwise */
  const cellBgClass = themed ? "themed-cell" : "bg-white";

  return (
    <div
      className={`inline-block rounded-lg p-2.5 shadow-sm ${boardSurfaceClass} ${className}`}
    >
      <div className={`grid ${gridColsClass} ${boardWidthClass} gap-2.5`}>
        {board.map((cell, index) => {
          /* Issue #209 — symbol color: use themed-p1/p2 classes when themed,
             pong-accent/secondary otherwise. Online games are unaffected. */
          const symbolColorClass = themed
            ? cell === "X"
              ? "themed-p1"
              : cell === "O"
                ? "themed-p2"
                : ""
            : cell === "X"
              ? "text-pong-accent"
              : cell === "O"
                ? "text-pong-secondary"
                : "";

          /* Winner cell highlight class — same for themed and default */
          const winnerClass =
            winningLine && winningLine.includes(index)
              ? themed
                ? didPlayerWin
                  ? "themed-winner-win"
                  : "themed-winner-loss"
                : didPlayerWin
                  ? "winner-cell winner-cell-win"
                  : "winner-cell winner-cell-loss"
              : "";

          /* Dim non-winning cells after game over */
          const dimClass =
            gameOver && winningLine && !winningLine.includes(index)
              ? "opacity-35 saturate-50"
              : "";

          /* Interaction state: disabled, empty (hoverable), or occupied */
          const interactionClass = disabled
            ? "cursor-not-allowed opacity-60"
            : cell === null
              ? `cursor-pointer ${turnHoverClass}`
              : "cursor-default";

          return (
            <button
              key={index}
              disabled={disabled}
              onClick={() => handleCellClick(index)}
              aria-label={`Cell ${index + 1}${winningLine?.includes(index) ? ", winning cell" : ""}`}
              className={`aspect-square rounded-lg transition-colors duration-200 ${cellTextClass} ${cellBgClass} ${interactionClass} ${dimClass} ${winnerClass}`}
            >
              <span
                className={`${symbolColorClass} font-sans font-bold${cell ? " cell-piece" : ""}`}
              >
                {renderSymbol ? renderSymbol(cell) : cell}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
