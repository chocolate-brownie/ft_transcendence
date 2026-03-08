import Card from "../Card";

interface ProfileStatsProps {
  wins: number;
  losses: number;
  draws: number;
}

export default function ProfileStats({ wins, losses, draws }: ProfileStatsProps) {
  const total = wins + losses + draws;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  return (
    <Card variant="elevated">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-pong-text/50">
        Stats
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg bg-white/20 border border-black/10 p-3 text-center">
          <p className="text-xs text-pong-text/50">Wins</p>
          <p className="text-lg font-bold text-pong-text/100">{wins ? wins : 0}</p>
        </div>
        <div className="rounded-lg bg-white/20 border border-black/10 p-3 text-center">
          <p className="text-xs text-pong-text/50">Losses</p>
          <p className="text-lg font-bold text-pong-text/100">{losses ? losses : 0}</p>
        </div>
        <div className="rounded-lg bg-white/20 border border-black/10 p-3 text-center">
          <p className="text-xs text-pong-text/50">Draws</p>
          <p className="text-lg font-bold text-pong-text/100">{draws ? draws : 0}</p>
        </div>
        <div className="rounded-lg bg-white/20 border border-black/10 p-3 text-center">
          <p className="text-xs text-pong-text/50">Win Rate</p>
          <p className="text-lg font-bold text-pong-text/100">{winRate}%</p>
        </div>
      </div>
    </Card>
  );
}
