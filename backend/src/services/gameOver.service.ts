import { Server } from "socket.io";
import { getGameRoomName } from "../socket/helpers";
import prisma from "../lib/prisma";
import { advanceWinner } from "./bracket.service";

interface PlayerInfo {
  id: number;
  username: string;
  symbol: string;
}

export async function processGameOver(io: Server, updatedGame: any, gameOverResult: any) {
  const { id, player1, player2, player1Symbol, player2Symbol, boardState, createdAt } =
    updatedGame;

  const isDraw = updatedGame.status === "DRAW";
  const winnerId = updatedGame.winnerId;

  // Determine winner and loser
  let winner: PlayerInfo | null = null;
  let loser: PlayerInfo | null = null;

  if (!isDraw && winnerId) {
    const isP1Winner = winnerId === player1.id;
    winner = {
      id: isP1Winner ? player1.id : player2.id,
      username: isP1Winner ? player1.username : player2.username,
      symbol: isP1Winner ? player1Symbol : player2Symbol,
    };
    loser = {
      id: isP1Winner ? player2.id : player1.id,
      username: isP1Winner ? player2.username : player1.username,
      symbol: isP1Winner ? player2Symbol : player1Symbol,
    };
  }

  const payload = {
    gameId: id,
    result: isDraw ? "draw" : "win",
    winner,
    loser,
    finalBoard: boardState,
    totalMoves: boardState.filter((cell: string | null) => cell !== null).length,
    duration: Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000),
    winningLine: gameOverResult.line || null,
    timestamp: new Date().toISOString(),
  };

  // Broadcast game_over event
  const roomName = getGameRoomName(id);
  io.to(roomName).emit("game_over", payload);

  // Issue #159 — Auto-record tournament result when a tournament game finishes
  if (updatedGame.status === "FINISHED" && winnerId) {
    await handleTournamentGameOver(io, id, winnerId);
  }

  // Post-Game Cleanup: keep the room 5 minutes for chat
  const cleanupTimer = setTimeout(
    () => {
      /* Room cleanup: post-game window closed */
    },
    5 * 60 * 1000,
  );
  cleanupTimer.unref?.();

  return payload;
}

// ─── Issue #159 — Tournament auto-advance on game completion ────────────────
// Checks if the finished game is linked to a TournamentMatch. If so, calls
// advanceWinner and emits tournament socket notifications (fire-and-forget).

async function handleTournamentGameOver(
  io: Server,
  gameId: number,
  winnerId: number,
): Promise<void> {
  try {
    const tournamentMatch = await prisma.tournamentMatch.findFirst({
      where: { gameId },
    });
    if (!tournamentMatch) return;

    const { tournamentId, id: matchId } = tournamentMatch;

    // Advance the winner in the bracket (DB operations)
    const result = await advanceWinner(tournamentId, matchId, winnerId, gameId);

    // Emit tournament socket notifications (fire-and-forget, never block)
    try {
      await emitTournamentNotifications(io, tournamentId, result, winnerId);
    } catch (err) {
      console.error("[TournamentGameOver] Socket notification error:", err);
    }
  } catch (err) {
    console.error("[TournamentGameOver] Failed to advance winner:", err);
  }
}

// ─── Issue #159 — Emit tournament notifications after auto-advance ──────────
// Replicates the notification logic from recordMatchResultController so that
// auto-advanced tournament matches produce the same real-time events.

async function emitTournamentNotifications(
  io: Server,
  tournamentId: number,
  result: { match: any; nextMatch: any },
  winnerId: number,
): Promise<void> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { name: true, maxPlayers: true, status: true, winnerId: true },
  });

  if (!tournament) return;

  const loserId =
    result.match.player1Id === winnerId
      ? result.match.player2Id
      : result.match.player1Id;

  // Notify all participants that a match finished
  await notifyMatchCompleted(io, tournamentId, tournament.name, result.match, winnerId);

  // Notify the eliminated player
  if (loserId) {
    notifyEliminated(
      io,
      tournamentId,
      tournament.name,
      loserId,
      result.match.round,
      tournament.maxPlayers,
    );
  }

  // If the next match now has both players, notify them it's their turn
  if (result.nextMatch?.player1Id && result.nextMatch?.player2Id) {
    await notifyYourTurn(
      io,
      tournamentId,
      tournament.name,
      result.nextMatch,
      tournament.maxPlayers,
    );
  }

  // If the tournament just finished, announce the champion
  if (tournament.status === "FINISHED" && tournament.winnerId) {
    await notifyTournamentCompleted(
      io,
      tournamentId,
      tournament.name,
      tournament.winnerId,
    );
  }
}

// ─── Notification helpers (Issue #159) ──────────────────────────────────────
// Minimal copies of the controller notification functions, scoped to this
// service so we don't need to export controller internals.

function getRoundName(round: number, maxPlayers: number): string {
  const totalRounds = Math.log2(maxPlayers);
  if (round === totalRounds) return "Finals";
  if (round === totalRounds - 1) return "Semifinals";
  if (round === totalRounds - 2) return "Quarterfinals";
  return `Round ${round}`;
}

async function getTournamentParticipantUserIds(tournamentId: number): Promise<number[]> {
  const participants = await prisma.tournamentParticipant.findMany({
    where: { tournamentId },
    select: { userId: true },
  });
  return participants.map((p) => p.userId);
}

async function notifyMatchCompleted(
  io: Server,
  tournamentId: number,
  tournamentName: string,
  match: { id: number; round: number; player1Id: number | null; player2Id: number | null },
  winnerId: number,
): Promise<void> {
  const loserId = match.player1Id === winnerId ? match.player2Id : match.player1Id;

  const [winner, loser] = await Promise.all([
    prisma.user.findUnique({ where: { id: winnerId }, select: { id: true, username: true } }),
    loserId
      ? prisma.user.findUnique({ where: { id: loserId }, select: { id: true, username: true } })
      : null,
  ]);

  if (!winner) return;

  const participantUserIds = await getTournamentParticipantUserIds(tournamentId);

  participantUserIds.forEach((userId) => {
    io.to(`user:${userId}`).emit("tournament_match_completed", {
      tournamentId,
      tournamentName,
      matchId: match.id,
      round: match.round,
      winner: { id: winner.id, username: winner.username },
      loser: loser ? { id: loser.id, username: loser.username } : null,
    });
  });
}

function notifyEliminated(
  io: Server,
  tournamentId: number,
  tournamentName: string,
  loserId: number,
  round: number,
  maxPlayers: number,
): void {
  io.to(`user:${loserId}`).emit("tournament_eliminated", {
    tournamentId,
    tournamentName,
    round,
    roundName: getRoundName(round, maxPlayers),
  });
}

async function notifyYourTurn(
  io: Server,
  tournamentId: number,
  tournamentName: string,
  match: { id: number; round: number; player1Id: number | null; player2Id: number | null; gameId?: number | null },
  maxPlayers: number,
): Promise<void> {
  if (!match.player1Id || !match.player2Id) return;

  const [player1, player2] = await Promise.all([
    prisma.user.findUnique({
      where: { id: match.player1Id },
      select: { id: true, username: true, avatarUrl: true },
    }),
    prisma.user.findUnique({
      where: { id: match.player2Id },
      select: { id: true, username: true, avatarUrl: true },
    }),
  ]);

  if (!player1 || !player2) return;

  const roundName = getRoundName(match.round, maxPlayers);

  // Issue #159 — Include gameId so frontend can navigate directly to the game
  io.to(`user:${player1.id}`).emit("tournament_your_turn", {
    tournamentId,
    tournamentName,
    matchId: match.id,
    gameId: match.gameId ?? null,
    round: match.round,
    roundName,
    opponent: { id: player2.id, username: player2.username, avatarUrl: player2.avatarUrl },
  });

  io.to(`user:${player2.id}`).emit("tournament_your_turn", {
    tournamentId,
    tournamentName,
    matchId: match.id,
    gameId: match.gameId ?? null,
    round: match.round,
    roundName,
    opponent: { id: player1.id, username: player1.username, avatarUrl: player1.avatarUrl },
  });
}

async function notifyTournamentCompleted(
  io: Server,
  tournamentId: number,
  tournamentName: string,
  championId: number,
): Promise<void> {
  const champion = await prisma.user.findUnique({
    where: { id: championId },
    select: { id: true, username: true, avatarUrl: true },
  });

  if (!champion) return;

  const participantUserIds = await getTournamentParticipantUserIds(tournamentId);

  participantUserIds.forEach((userId) => {
    io.to(`user:${userId}`).emit("tournament_completed", {
      tournamentId,
      tournamentName,
      champion: { id: champion.id, username: champion.username, avatarUrl: champion.avatarUrl },
    });
  });
}
