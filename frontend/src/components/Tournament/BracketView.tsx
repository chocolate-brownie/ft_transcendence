import { useNavigate } from "react-router-dom";
import type {
  BracketMatch,
  BracketResponse,
  TournamentParticipant,
} from "../../services/tournament.service";

// ─── Layout constants ────────────────────────────────────────────────────────
const CARD_W = 208; // w-52 = 13rem
const COL_GAP = 32; // gap between round columns (px); matches gap-8
const BASE_GAP = 8; // round 1 vertical gap between match cards
const CARD_H = 118; // visual card height used for bracket positioning
const CARD_ANCHOR_Y = 70; // connector anchor inside a card: between player 1 and player 2
const HEADER_H = 28; // round label text (16px) + gap-3 (12px)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function matchRoundLabel(
  round: number,
  totalRounds: number,
  matchNumber: number,
): string {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return `Semifinal ${matchNumber}`;
  if (fromEnd === 2) return `Quarterfinal ${matchNumber}`;
  return `R${round} – M${matchNumber}`;
}

function columnRoundLabel(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return "Finals";
  if (fromEnd === 1) return "Semifinals";
  if (fromEnd === 2) return "Quarterfinals";
  return `Round ${round}`;
}

type MatchStatus = "completed" | "in_progress" | "scheduled" | "pending";

function getMatchStatus(match: BracketMatch, currentRound: number | null): MatchStatus {
  if (match.winner !== null) return "completed";
  if (match.player1 === null || match.player2 === null) return "pending";
  if (match.round === currentRound) return "in_progress";
  return "scheduled";
}

function roundStep(round: number): number {
  return Math.pow(2, round - 1) * (CARD_H + BASE_GAP);
}

function roundTopOffset(round: number): number {
  return ((Math.pow(2, round - 1) - 1) * (CARD_H + BASE_GAP)) / 2;
}

function roundGap(round: number): number {
  return roundStep(round) - CARD_H;
}

// ─── SVG connector paths ─────────────────────────────────────────────────────

interface ConnectorPath {
  key: string;
  bracket: string;
  midline: string;
}

function buildConnectorPaths(
  rounds: Map<number, BracketMatch[]>,
  totalRounds: number,
): ConnectorPath[] {
  const paths: ConnectorPath[] = [];

  for (let round = 1; round < totalRounds; round++) {
    const roundMatches = rounds.get(round) ?? [];
    const stepPx = roundStep(round);
    const ptPx = roundTopOffset(round);

    const colX = (round - 1) * (CARD_W + COL_GAP);
    const nextColX = round * (CARD_W + COL_GAP);

    for (let p = 0; p < roundMatches.length; p += 2) {
      const i1 = p;
      const i2 = p + 1;

      const y1 = HEADER_H + ptPx + i1 * stepPx + CARD_ANCHOR_Y;
      const y2 = HEADER_H + ptPx + i2 * stepPx + CARD_ANCHOR_Y;
      const midY = (y1 + y2) / 2;

      const xRight = colX + CARD_W;
      const xMid = xRight + COL_GAP / 2;
      const xNext = nextColX;

      const bracket = `M ${xRight} ${y1} H ${xMid} V ${y2} H ${xRight}`;
      const midline = `M ${xMid} ${midY} H ${xNext}`;

      paths.push({ key: `conn-${round}-${p}`, bracket, midline });
    }
  }

  return paths;
}

// ─── MatchCard ───────────────────────────────────────────────────────────────

interface MatchCardProps {
  match: BracketMatch;
  currentRound: number | null;
  totalRounds: number;
  seedMap: Map<number, number>;
  currentUserId?: number | null;
}

function MatchCard({
  match,
  currentRound,
  totalRounds,
  seedMap,
  currentUserId,
}: MatchCardProps) {
  const navigate = useNavigate();
  const player1 = match.player1;
  const player2 = match.player2;
  const isComplete = match.winner !== null;
  const status = getMatchStatus(match, currentRound);
  const isPending = status === "pending";
  const isScheduled = status === "scheduled";
  const isInProgress = status === "in_progress";

  const hasGame = match.gameId !== null;
  const isMyMatch =
    currentUserId != null &&
    (player1?.id === currentUserId || player2?.id === currentUserId);
  const isClickable = hasGame && isMyMatch;
  const isPlayable = hasGame && !isComplete && !isPending && isMyMatch;
  const isNotStarted = isPending || isScheduled;

  const goToGame = () => {
    if (!isClickable) return;
    void navigate(`/game/${match.gameId}`);
  };

  function playerRow(player: BracketMatch["player1"], isWinner: boolean) {
    const isEmpty = !player;
    const seed = player ? seedMap.get(player.id) : undefined;
    const name = player?.username ?? "TBD";

    const scoreIndicator = isEmpty ? null : isComplete ? (
      isWinner ? (
        <span className="shrink-0 text-xs font-bold text-green-600">✓</span>
      ) : null
    ) : (
      <span className="shrink-0 text-xs text-pong-text/30">–</span>
    );

    return (
      <div
        className={`flex items-center justify-between gap-2 px-3 py-2 text-sm ${
          isWinner
            ? "bg-green-50 font-semibold text-green-700"
            : isEmpty
              ? "text-pong-text/30 italic"
              : isComplete
                ? "text-pong-text/40 line-through"
                : "text-pong-text"
        }`}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          {seed !== undefined && (
            <span className="shrink-0 text-xs text-pong-text/40">#{seed}</span>
          )}
          <span className="truncate">{name}</span>
        </div>
        {scoreIndicator}
      </div>
    );
  }

  const cardLabel = matchRoundLabel(match.round, totalRounds, match.matchNumber);

  return (
    <div
      className={`flex min-h-[118px] w-52 flex-col overflow-hidden rounded-lg border shadow-sm backdrop-blur-sm ${
        isPending
          ? "border-dashed border-black/15 bg-gray-50/60"
          : isInProgress
            ? "border-pong-accent/40 bg-white/40 ring-1 ring-pong-accent/20"
            : isScheduled
              ? "border-black/10 bg-gray-100/60"
              : "border-black/10 bg-white/40"
      } ${isClickable ? "cursor-pointer transition-shadow hover:shadow-md" : ""}`}
      onClick={isClickable ? goToGame : undefined}
      onKeyDown={
        isClickable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                goToGame();
              }
            }
          : undefined
      }
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {/* Match header */}
      <div className="flex items-center justify-between gap-1 border-b border-black/5 px-3 py-1">
        <span className="truncate text-[10px] font-medium text-pong-text/40">
          {cardLabel}
        </span>
        {isInProgress && (
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-blue-500">
            Live
          </span>
        )}
        {isComplete && hasGame && isMyMatch && (
          <span className="shrink-0 text-[10px] text-pong-text/30">view ↗</span>
        )}
        {isPlayable && (
          <span className="shrink-0 text-[10px] font-semibold text-pong-accent">
            play ↗
          </span>
        )}
      </div>

      {/* Player rows */}
      <div className="divide-y divide-black/8">
        {playerRow(player1, isComplete && match.winner?.id === player1?.id)}
        <div className="h-px bg-black/8" />
        {playerRow(player2, isComplete && match.winner?.id === player2?.id)}
      </div>

      {/* Footer */}
      <div className="mt-auto">
        {isPlayable ? (
          <div className="border-t border-pong-accent/20 bg-pong-accent/5 px-3 py-1.5 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-pong-accent">
              Play Now →
            </span>
          </div>
        ) : isNotStarted ? (
          <div className="border-t border-black/5 px-3 py-1 text-center">
            <span className="text-[10px] text-pong-text/30">Waiting for players</span>
          </div>
        ) : (
          <div className="px-3 py-1.5" />
        )}
      </div>
    </div>
  );
}

// ─── BracketView ─────────────────────────────────────────────────────────────

interface BracketViewProps {
  bracket: BracketResponse;
  participants?: TournamentParticipant[];
  currentUserId?: number | null;
}

export default function BracketView({
  bracket,
  participants = [],
  currentUserId,
}: BracketViewProps) {
  const { matches, totalRounds, currentRound } = bracket;

  const rounds: Map<number, BracketMatch[]> = new Map();
  for (let r = 1; r <= totalRounds; r++) {
    rounds.set(
      r,
      matches.filter((m) => m.round === r).sort((a, b) => a.matchNumber - b.matchNumber),
    );
  }

  const seedMap = new Map<number, number>(participants.map((p) => [p.userId, p.seed]));
  const connectors = buildConnectorPaths(rounds, totalRounds);

  const svgWidth = totalRounds * CARD_W + (totalRounds - 1) * COL_GAP;
  const round1Count = rounds.get(1)?.length ?? 1;
  const svgHeight = HEADER_H + (round1Count - 1) * roundStep(1) + CARD_H + 16;

  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="hidden overflow-x-auto pb-4 sm:block">
        <div className="relative inline-flex min-w-max items-start gap-8">
          <svg
            width={svgWidth}
            height={svgHeight}
            className="pointer-events-none absolute left-0 top-0"
            style={{ overflow: "visible" }}
          >
            {connectors.map(({ key, bracket: bracketPath, midline }) => (
              <g key={key}>
                <path
                  d={bracketPath}
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

          {Array.from(rounds.entries()).map(([round, roundMatches]) => (
            <div key={round} className="flex flex-col gap-3">
              <div className="text-center">
                <span
                  className={`text-xs font-semibold uppercase tracking-widest ${
                    round === currentRound ? "text-pong-accent" : "text-pong-text/40"
                  }`}
                >
                  {columnRoundLabel(round, totalRounds)}
                </span>
              </div>

              <div
                className="flex flex-col"
                style={{
                  gap: `${roundGap(round)}px`,
                  paddingTop: `${roundTopOffset(round)}px`,
                }}
              >
                {roundMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    currentRound={currentRound}
                    totalRounds={totalRounds}
                    seedMap={seedMap}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile */}
      <div className="flex flex-col gap-6 sm:hidden">
        {Array.from(rounds.entries()).map(([round, roundMatches]) => (
          <div key={round}>
            <div className="mb-3 flex items-center gap-2">
              <span
                className={`text-xs font-semibold uppercase tracking-widest ${
                  round === currentRound ? "text-pong-accent" : "text-pong-text/40"
                }`}
              >
                {columnRoundLabel(round, totalRounds)}
              </span>
              <div className="h-px flex-1 bg-black/8" />
            </div>

            <div className="flex flex-col gap-3">
              {roundMatches.map((match) => (
                <div key={match.id} className="w-full">
                  <div className="[&>div]:w-full">
                    <MatchCard
                      match={match}
                      currentRound={currentRound}
                      totalRounds={totalRounds}
                      seedMap={seedMap}
                      currentUserId={currentUserId}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
