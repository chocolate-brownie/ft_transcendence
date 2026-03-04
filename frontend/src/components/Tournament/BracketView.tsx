import { useNavigate } from "react-router-dom";
import type { BracketMatch, BracketResponse } from "../../services/tournament.service";

// ─── Layout constants (must match Tailwind values + card dimensions) ──────────
const CARD_W = 208; // w-52 = 13rem
const COL_GAP = 32; // gap between round columns (px); matches gap-8
const CARD_H = 92; // approx rendered height with header row + 2 player rows
const HEADER_H = 28; // round label text (16px) + gap-3 (12px)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function roundLabel(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semi-Finals";
  if (fromEnd === 2) return "Quarter-Finals";
  return `Round ${round}`;
}

type MatchStatus = "completed" | "in_progress" | "scheduled" | "pending";

function getMatchStatus(match: BracketMatch, currentRound: number | null): MatchStatus {
  if (match.winner !== null) return "completed";
  if (match.player1 === null || match.player2 === null) return "pending";
  if (match.round === currentRound) return "in_progress";
  return "scheduled";
}

// ─── SVG connector paths ──────────────────────────────────────────────────────
// Builds bracket-arm SVG path data connecting pairs of matches in round R
// to the corresponding match in round R+1.
//
// Shape for each pair:
//   [Match 1] ────┐
//                 │
//                 ├──── [Next Match]
//                 │
//   [Match 2] ────┘

interface ConnectorPath {
  key: string;
  bracket: string; // U-arm connecting the pair
  midline: string; // horizontal line to next round
}

function buildConnectorPaths(
  rounds: Map<number, BracketMatch[]>,
  totalRounds: number,
): ConnectorPath[] {
  const paths: ConnectorPath[] = [];

  for (let round = 1; round < totalRounds; round++) {
    const roundMatches = rounds.get(round) ?? [];
    const gapPx = Math.pow(2, round - 1) * 8; // flex gap between matches (px)
    const ptPx = (Math.pow(2, round - 1) - 1) * 4; // padding-top of match list (px)

    const colX = (round - 1) * (CARD_W + COL_GAP);
    const nextColX = round * (CARD_W + COL_GAP);

    for (let p = 0; p < roundMatches.length; p += 2) {
      const i1 = p;
      const i2 = p + 1;

      // Y center of each match from top of SVG
      const y1 = HEADER_H + ptPx + i1 * (CARD_H + gapPx) + CARD_H / 2;
      const y2 = HEADER_H + ptPx + i2 * (CARD_H + gapPx) + CARD_H / 2;
      const midY = (y1 + y2) / 2;

      const xRight = colX + CARD_W; // right edge of match cards
      const xMid = xRight + COL_GAP / 2; // midpoint of the column gap
      const xNext = nextColX; // left edge of next round

      // Bracket arm: right stub from match1 → spine → right stub from match2
      const bracket = `M ${xRight} ${y1} H ${xMid} V ${y2} H ${xRight}`;
      // Midpoint line: from spine midpoint to left edge of next round
      const midline = `M ${xMid} ${midY} H ${xNext}`;

      paths.push({ key: `conn-${round}-${p}`, bracket, midline });
    }
  }

  return paths;
}

// ─── MatchCard ────────────────────────────────────────────────────────────────

interface MatchCardProps {
  match: BracketMatch;
  currentRound: number | null;
}

function MatchCard({ match, currentRound }: MatchCardProps) {
  const navigate = useNavigate();
  const player1 = match.player1;
  const player2 = match.player2;
  const isComplete = match.winner !== null;
  const status = getMatchStatus(match, currentRound);
  const isPending = status === "pending";
  const isInProgress = status === "in_progress";
  const isClickable = isComplete && match.gameId !== null;

  function playerRow(player: BracketMatch["player1"], isWinner: boolean) {
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

  const statusBadge =
    status === "in_progress" ? (
      <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide">
        Live
      </span>
    ) : status === "scheduled" ? (
      <span className="text-[10px] text-pong-text/30 uppercase tracking-wide">
        Upcoming
      </span>
    ) : null;

  return (
    <div
      className={`w-52 overflow-hidden rounded-lg border bg-white/40 shadow-sm backdrop-blur-sm ${
        isPending
          ? "border-dashed border-black/20"
          : isInProgress
            ? "border-pong-accent/40 ring-1 ring-pong-accent/20"
            : "border-black/10"
      } ${isClickable ? "cursor-pointer transition-shadow hover:shadow-md" : ""}`}
      onClick={
        isClickable ? () => void navigate(`/game/${match.gameId}`) : undefined
      }
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {/* Match metadata header */}
      <div className="flex items-center justify-between border-b border-black/5 px-3 py-1">
        <span className="text-[10px] font-medium text-pong-text/30">
          M{match.matchNumber}
        </span>
        {statusBadge}
      </div>

      {/* Player rows */}
      <div className="divide-y divide-black/8">
        {playerRow(player1, isComplete && match.winner?.id === player1?.id)}
        <div className="h-px bg-black/8" />
        {playerRow(player2, isComplete && match.winner?.id === player2?.id)}
      </div>
    </div>
  );
}

// ─── BracketView ─────────────────────────────────────────────────────────────

interface BracketViewProps {
  bracket: BracketResponse;
}

export default function BracketView({ bracket }: BracketViewProps) {
  const { matches, totalRounds, currentRound } = bracket;

  // Group matches by round (sorted by matchNumber)
  const rounds: Map<number, BracketMatch[]> = new Map();
  for (let r = 1; r <= totalRounds; r++) {
    rounds.set(
      r,
      matches.filter((m) => m.round === r).sort((a, b) => a.matchNumber - b.matchNumber),
    );
  }

  const connectors = buildConnectorPaths(rounds, totalRounds);

  // Calculate SVG canvas dimensions
  const svgWidth = totalRounds * CARD_W + (totalRounds - 1) * COL_GAP;
  const round1Count = rounds.get(1)?.length ?? 1;
  const gap1 = 8; // Math.pow(2, 0) * 8
  const svgHeight =
    HEADER_H + (round1Count - 1) * (CARD_H + gap1) + CARD_H + 16; // +16 buffer

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="relative inline-flex min-w-max items-start gap-8">
        {/* SVG connector overlay */}
        <svg
          width={svgWidth}
          height={svgHeight}
          className="pointer-events-none absolute left-0 top-0"
          style={{ overflow: "visible" }}
        >
          {connectors.map(({ key, bracket, midline }) => (
            <g key={key}>
              <path
                d={bracket}
                fill="none"
                stroke="currentColor"
                strokeWidth={1}
                className="text-black/15"
              />
              <path
                d={midline}
                fill="none"
                stroke="currentColor"
                strokeWidth={1}
                className="text-black/15"
              />
            </g>
          ))}
        </svg>

        {/* Round columns */}
        {Array.from(rounds.entries()).map(([round, roundMatches]) => (
          <div key={round} className="flex flex-col gap-3">
            {/* Round label */}
            <div className="text-center">
              <span
                className={`text-xs font-semibold uppercase tracking-widest ${
                  round === currentRound ? "text-pong-accent" : "text-pong-text/40"
                }`}
              >
                {roundLabel(round, totalRounds)}
              </span>
            </div>

            {/* Match cards */}
            <div
              className="flex flex-col"
              style={{
                gap: `${Math.pow(2, round - 1) * 0.5}rem`,
                paddingTop: `${(Math.pow(2, round - 1) - 1) * 0.25}rem`,
              }}
            >
              {roundMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  currentRound={currentRound}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
