import type { BracketMatch, BracketResponse } from "../../services/tournament.service";

interface MatchCardProps {
  match: BracketMatch;
  isCurrentRound: boolean;
}

function MatchCard({ match, isCurrentRound }: MatchCardProps) {
  const player1 = match.player1;
  const player2 = match.player2;
  const isComplete = match.winner !== null;

  function playerRow(
    player: BracketMatch["player1"],
    isWinner: boolean,
  ) {
    const name = player?.username ?? "TBD";
    const isEmpty = !player;

    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 text-sm ${
          isWinner
            ? "bg-pong-accent/10 font-semibold text-pong-accent"
            : isEmpty
              ? "text-pong-text/30 italic"
              : isComplete
                ? "text-pong-text/50 line-through"
                : "text-pong-text"
        }`}
      >
        {isWinner ? <span className="text-xs">🏆</span> : <span className="w-3" />}
        <span className="truncate">{name}</span>
      </div>
    );
  }

  return (
    <div
      className={`w-52 overflow-hidden rounded-lg border bg-white/40 shadow-sm backdrop-blur-sm ${
        isCurrentRound && !isComplete
          ? "border-pong-accent/40 ring-1 ring-pong-accent/20"
          : "border-black/10"
      }`}
    >
      <div className="divide-y divide-black/8">
        {playerRow(player1, isComplete && match.winner?.id === player1?.id)}
        <div className="h-px bg-black/8" />
        {playerRow(player2, isComplete && match.winner?.id === player2?.id)}
      </div>
    </div>
  );
}

function roundLabel(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semi-Finals";
  if (fromEnd === 2) return "Quarter-Finals";
  return `Round ${round}`;
}

interface BracketViewProps {
  bracket: BracketResponse;
}

export default function BracketView({ bracket }: BracketViewProps) {
  const { matches, totalRounds, currentRound } = bracket;

  // Group matches by round
  const rounds: Map<number, BracketMatch[]> = new Map();
  for (let r = 1; r <= totalRounds; r++) {
    rounds.set(
      r,
      matches.filter((m) => m.round === r).sort((a, b) => a.matchNumber - b.matchNumber),
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex min-w-max items-start gap-8">
        {Array.from(rounds.entries()).map(([round, roundMatches]) => (
          <div key={round} className="flex flex-col gap-3">
            {/* Round header */}
            <div className="text-center">
              <span
                className={`text-xs font-semibold uppercase tracking-widest ${
                  round === currentRound
                    ? "text-pong-accent"
                    : "text-pong-text/40"
                }`}
              >
                {roundLabel(round, totalRounds)}
              </span>
            </div>

            {/* Matches in this round, vertically centred relative to their bracket position */}
            <div
              className="flex flex-col justify-around"
              style={{
                // Each match occupies an equal slice of the column height.
                // Round 1 has maxPlayers/2 slots; each later round halves that.
                gap: `${Math.pow(2, round - 1) * 0.5}rem`,
                paddingTop: `${(Math.pow(2, round - 1) - 1) * 0.25}rem`,
              }}
            >
              {roundMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  isCurrentRound={round === currentRound}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
