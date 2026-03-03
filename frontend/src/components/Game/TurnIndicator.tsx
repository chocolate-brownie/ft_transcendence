interface TurnIndicatorProps {
  currentPlayer: "X" | "O";
  isYourTurn: boolean;
  playerSymbol: "X" | "O";
  className?: string;
  textOverride?: string;
}

export default function TurnIndicator({
  currentPlayer,
  isYourTurn,
  playerSymbol,
  className = "",
  textOverride = "",
}: TurnIndicatorProps) {
  const text =
    textOverride !== ""
      ? textOverride
      : isYourTurn
        ? `Your turn (${playerSymbol})`
        : `Waiting for opponent (${currentPlayer})…`;
  const colorClass =
    textOverride !== ""
      ? currentPlayer === "X"
        ? "text-pong-accent"
        : "text-pong-secondary"
      : isYourTurn
        ? "text-pong-secondary animate-pulse"
        : "text-pong-text/50";

  return (
    <div
      className={"text-center py-3 text-lg font-semibold " + colorClass + " " + className}
    >
      {text}
    </div>
  );
}
