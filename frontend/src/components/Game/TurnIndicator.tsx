interface TurnIndicatorProps {
  currentPlayer: "X" | "O";
  isYourTurn: boolean;
  playerSymbol: "X" | "O";
  className?: string;
}

export default function TurnIndicator({
  currentPlayer,
  isYourTurn,
  playerSymbol,
  className = "",
}: TurnIndicatorProps) {
  const text = isYourTurn
    ? `Your turn (${playerSymbol})`
    : `Waiting for opponent (${currentPlayer})…`;

  return (
    <div
      className={
        "text-center py-3 text-lg font-semibold " +
        (isYourTurn ? "text-pong-secondary animate-pulse" : "text-pong-text/50") +
        " " +
        className
      }
    >
      {text}
    </div>
  );
}