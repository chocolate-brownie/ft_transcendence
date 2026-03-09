// Tournaments controller — handles HTTP request/response for tournament operations
// Calls tournaments.service.ts for business logic

import { Response } from "express";
import type { Server as SocketIOServer } from "socket.io";
import prisma from "../lib/prisma";
import { TournamentStatus } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";
import {
  createTournament,
  joinTournament,
  getTournaments,
  getTournamentById,
  recordMatchResult,
  getTournamentBracket,
  TournamentError,
} from "../services/tournaments.service";

/* ─── Socket Notification Helpers (Issue #159) ──────────────────────────────
These helpers emit real-time tournament events to participants via personal
rooms (user:<id>). Called from controllers after service calls complete,
ensuring DB transactions are committed before notifications fire.

Fetches all participant user IDs for a given tournament.
Used by notify functions to determine who should receive each event. */
async function getTournamentParticipantUserIds(tournamentId: number): Promise<number[]> {
  const participants = await prisma.tournamentParticipant.findMany({
    where: { tournamentId },
    select: { userId: true },
  });

  return participants.map((participant) => participant.userId);
}

/* Issue #159 — Event: tournament_player_joined
   Notifies all existing participants (except the joiner) that a new player
   has joined the tournament. Includes player info and current fill count. */
async function notifyTournamentPlayerJoined(
  io: SocketIOServer,
  result: { participant: any; tournamentInfo: any },
  joinedUserId: number,
): Promise<void> {
  const { tournamentInfo, participant } = result;
  const participantUserIds = await getTournamentParticipantUserIds(tournamentInfo.id);

  /* Also include the tournament creator — they should see join notifications
     even before they themselves join as a participant. */
  const creatorId = tournamentInfo.createdById;
  const notifyUserIds = new Set(participantUserIds);
  if (creatorId) notifyUserIds.add(creatorId);

  notifyUserIds.forEach((userId) => {
    if (userId === joinedUserId) return;
    io.to(`user:${userId}`).emit("tournament_player_joined", {
      tournamentId: tournamentInfo.id,
      tournamentName: tournamentInfo.name,
      player: {
        id: participant.user.id,
        username: participant.user.username,
        avatarUrl: participant.user.avatarUrl,
      },
      currentParticipants: tournamentInfo.currentParticipants,
      maxPlayers: tournamentInfo.maxPlayers,
    });
  });
}

/* Issue #159 — Event: tournament_started
   Notifies ALL participants that the tournament has started.
   Fired when the last player joins and status becomes IN_PROGRESS. */
async function notifyTournamentStarted(
  io: SocketIOServer,
  tournamentInfo: any,
): Promise<void> {
  const participantUserIds = await getTournamentParticipantUserIds(tournamentInfo.id);
  const totalRounds = Math.log2(tournamentInfo.maxPlayers);

  participantUserIds.forEach((userId) => {
    io.to(`user:${userId}`).emit("tournament_started", {
      tournamentId: tournamentInfo.id,
      tournamentName: tournamentInfo.name,
      currentRound: 1,
      totalRounds,
    });
  });
}

/* Issue #159 — Event: tournament_your_turn
   Notifies both players in a match that it's their turn to play.
   Each player receives their opponent's info in the payload. */
async function notifyYourTurn(
  io: SocketIOServer,
  tournamentId: number,
  tournamentName: string,
  match: {
    id: number;
    round: number;
    player1Id: number | null;
    player2Id: number | null;
  },
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

  io.to(`user:${player1.id}`).emit("tournament_your_turn", {
    tournamentId,
    tournamentName,
    matchId: match.id,
    round: match.round,
    roundName,
    opponent: {
      id: player2.id,
      username: player2.username,
      avatarUrl: player2.avatarUrl,
    },
  });

  io.to(`user:${player2.id}`).emit("tournament_your_turn", {
    tournamentId,
    tournamentName,
    matchId: match.id,
    round: match.round,
    roundName,
    opponent: {
      id: player1.id,
      username: player1.username,
      avatarUrl: player1.avatarUrl,
    },
  });
}

/* Issue #159 — Event: tournament_match_completed
   Notifies all participants that a match has been completed.
   Includes winner/loser info and the round number. */
async function notifyMatchCompleted(
  io: SocketIOServer,
  tournamentId: number,
  tournamentName: string,
  match: {
    id: number;
    round: number;
    player1Id: number | null;
    player2Id: number | null;
  },
  winnerId: number,
): Promise<void> {
  const loserId = match.player1Id === winnerId ? match.player2Id : match.player1Id;

  const [winner, loser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: winnerId },
      select: { id: true, username: true },
    }),
    loserId
      ? prisma.user.findUnique({
          where: { id: loserId },
          select: { id: true, username: true },
        })
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

/* Issue #159 — Event: tournament_eliminated
   Notifies the eliminated player that they have been knocked out. */
function notifyEliminated(
  io: SocketIOServer,
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

/* Issue #159 — Event: tournament_completed
   Notifies ALL participants that the tournament is over and a champion is crowned. */
async function notifyTournamentCompleted(
  io: SocketIOServer,
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
      champion: {
        id: champion.id,
        username: champion.username,
        avatarUrl: champion.avatarUrl,
      },
    });
  });
}

/* Maps a round number to a human-readable name based on tournament size. */
function getRoundName(round: number, maxPlayers: number): string {
  const totalRounds = Math.log2(maxPlayers);
  if (round === totalRounds) return "Finals";
  if (round === totalRounds - 1) return "Semifinals";
  if (round === totalRounds - 2) return "Quarterfinals";
  return `Round ${round}`;
}

// ─── POST /api/tournaments ─────────────────────────────────────────────────

export async function createTournamentController(req: AuthRequest, res: Response) {
  try {
    const { name, maxPlayers } = req.body;

    // ── Validation ──
    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "Name is required" });
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 3 || trimmedName.length > 50) {
      return res
        .status(400)
        .json({ message: "Name must be between 3 and 50 characters" });
    }

    const mp = Number(maxPlayers);

    if (![4, 8].includes(mp)) {
      return res.status(400).json({ message: "maxPlayers must be 4 or 8" });
    }

    const tournament = await createTournament(trimmedName, mp as 4 | 8, req.user.id);

    /* Issue #159 — Broadcast tournament_created to everyone EXCEPT the
       creator so the Tournaments list page updates in real-time. The
       creator already navigates to the detail page after creating. */
    const io = req.app.get("io") as SocketIOServer | undefined;
    if (io) {
      const creatorRoom = `user:${req.user.id}`;
      io.except(creatorRoom).emit("tournament_created", {
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        creator: { id: req.user.id, username: tournament.creator.username },
        maxPlayers: tournament.maxPlayers,
      });
    }

    return res.status(201).json(tournament);
  } catch (error) {
    console.error("[CreateTournament]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── POST /api/tournaments/:id/join ────────────────────────────────────────
export async function joinTournamentController(req: AuthRequest, res: Response) {
  try {
    const tournamentId = parseInt(req.params.id as string, 10);

    if (isNaN(tournamentId)) {
      return res.status(400).json({ message: "Invalid tournament ID" });
    }

    const result = await joinTournament(tournamentId, req.user.id);

    /* ── Socket notifications (Issue #159) ──
    Fire-and-forget: notifications must not block the HTTP response */
    const io = req.app.get("io") as SocketIOServer | undefined;
    if (io) {
      try {
        // Always notify existing participants about the new joiner
        await notifyTournamentPlayerJoined(io, result, req.user.id);
        // If this join filled the tournament, it auto-started — notify everyone
        if (result.tournamentInfo.status === "IN_PROGRESS") {
          await notifyTournamentStarted(io, result.tournamentInfo);
          // Round 1 matches are now ready — notify each pair of opponents
          const round1Matches = await prisma.tournamentMatch.findMany({
            where: { tournamentId, round: 1 },
          });

          for (const match of round1Matches) {
            await notifyYourTurn(
              io,
              tournamentId,
              result.tournamentInfo.name,
              match,
              result.tournamentInfo.maxPlayers,
            );
          }
        }
      } catch (err) {
        console.error("[JoinTournament] Socket notification error:", err);
      }
    }

    return res.status(200).json({
      message: "Successfully joined tournament",
      participant: result.participant,
      tournament: result.tournamentInfo,
    });
  } catch (error) {
    if (error instanceof TournamentError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("[JoinTournament]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── GET /api/tournaments ──────────────────────────────────────────────────

export async function getTournamentsController(req: AuthRequest, res: Response) {
  try {
    const status = req.query.status as string | undefined;

    if (status) {
      const validStatuses = Object.values(TournamentStatus);

      if (!validStatuses.includes(status as TournamentStatus)) {
        return res.status(400).json({
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }
    }

    const tournaments = await getTournaments(status as TournamentStatus | undefined);

    return res.status(200).json({ tournaments });
  } catch (error) {
    console.error("[GetTournaments]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── GET /api/tournaments/:id ──────────────────────────────────────────────

export async function getTournamentByIdController(req: AuthRequest, res: Response) {
  try {
    const id = parseInt(req.params.id as string, 10);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid tournament ID" });
    }

    const tournament = await getTournamentById(id);

    return res.status(200).json(tournament);
  } catch (error) {
    if (error instanceof TournamentError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("[GetTournamentById]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── POST /api/tournaments/:id/matches/:matchId/result ─────────────────────
// Records a match result and advances the winner (Issue #156)

export async function recordMatchResultController(req: AuthRequest, res: Response) {
  try {
    const tournamentId = parseInt(req.params.id as string, 10);
    const matchId = parseInt(req.params.matchId as string, 10);

    if (isNaN(tournamentId) || isNaN(matchId)) {
      return res.status(400).json({ message: "Invalid tournament ID or match ID" });
    }

    const { winnerId, gameId } = req.body;

    // ── Validation ──
    if (!winnerId || typeof winnerId !== "number") {
      return res
        .status(400)
        .json({ message: "winnerId is required and must be a number" });
    }

    if (!gameId || typeof gameId !== "number") {
      return res.status(400).json({ message: "gameId is required and must be a number" });
    }

    const result = await recordMatchResult(
      tournamentId,
      matchId,
      winnerId,
      gameId,
      req.user.id,
    );

    // ── Socket notifications (Issue #159) ──
    // Emit match result events after the DB transaction has committed
    const io = req.app.get("io") as SocketIOServer | undefined;
    if (io) {
      try {
        // Fetch tournament info for notification payloads
        const tournament = await prisma.tournament.findUnique({
          where: { id: tournamentId },
          select: { name: true, maxPlayers: true, status: true, winnerId: true },
        });

        if (tournament) {
          const loserId =
            result.match.player1Id === winnerId
              ? result.match.player2Id
              : result.match.player1Id;

          // Notify all participants that a match finished
          await notifyMatchCompleted(
            io,
            tournamentId,
            tournament.name,
            result.match,
            winnerId,
          );

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
      } catch (err) {
        console.error("[RecordMatchResult] Socket notification error:", err);
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof TournamentError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("[RecordMatchResult]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── GET /api/tournaments/:id/bracket ──────────────────────────────────────
// Returns the full bracket with all matches (Issue #156)

export async function getTournamentBracketController(req: AuthRequest, res: Response) {
  try {
    const tournamentId = parseInt(req.params.id as string, 10);

    if (isNaN(tournamentId)) {
      return res.status(400).json({ message: "Invalid tournament ID" });
    }

    const bracket = await getTournamentBracket(tournamentId);

    return res.status(200).json(bracket);
  } catch (error) {
    if (error instanceof TournamentError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("[GetTournamentBracket]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
