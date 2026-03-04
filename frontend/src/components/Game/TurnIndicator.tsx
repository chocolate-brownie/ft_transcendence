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
        ? "text-pong-accent animate-pulse"
        : "text-pong-text/50";

  return (
    <div
      className={
        "text-center py-3 text-lg font-semibold " +
        colorClass +
        " " +
        className
      }
    >
      {text}
    </div>
  );
}

// COPY & PASTE in https://play.tailwindcss.com/
{/* <h1><b>TurnIndicator, c'est du texte qui clignote ou pas, utilisé comme H1 dans le composant "Game". </b></h1>
<h2><b>TurnIndicator</b> prend 4 "paramètres":</h2>
<ol>
  <li>• <b>string</b> currentPlayer ("X" ou "O")</li>
  <li>• <b>string</b> playerSymbol ("X" ou "O")</li>
  <li>• <b>bool</b>   isYourTurn</li>
  <li>• <b>string</b> className (tailwindCSS ajouté comme style de la div)</li>
</ol>

<br>
<h2>Dans le cas ou c'est ton tour :</h2>
  <p>< div ></p>
    <div class="text-center py-3 text-lg font-semibold text-pong-secondary animate-pulse -mb-6">
          Your turn X
    </div>
  <p>< / div ></p>
  <br>
<h2>Dans le cas contraire :</h2>
  <p>< div ></p>
    <div class=
            "text-center py-3 text-lg font-semibold text-pong-text/5 -mb-6" >
          Waiting for opponent O
    </div>
  <p>< / div ></p> */}