import { apiClient } from "../lib/apiClient";

export type TournamentStatus = "REGISTERING" | "IN_PROGRESS" | "FINISHED" | "CANCELLED";

export interface TournamentListItem {
  id: number;
  name: string;
  maxPlayers: number;
  currentParticipants: number;
  status: TournamentStatus;
  currentRound: number | null;
  createdAt: string;
  creator: {
    id: number;
    username: string;
  };
  winner: {
    id: number;
    username: string;
  } | null;
}

export interface TournamentParticipant {
  id: number;
  userId: number;
  seed: number;
  eliminatedInRound: number | null;
  user: {
    id: number;
    username: string;
    avatarUrl: string | null;
  };
}

export interface TournamentDetails {
  id: number;
  name: string;
  maxPlayers: number;
  status: TournamentStatus;
  createdAt: string;
  creator: {
    id: number;
    username: string;
  };
  participants: TournamentParticipant[];
  winner: {
    id: number;
    username: string;
  } | null;
}

export interface BracketPlayer {
  id: number;
  username: string;
  avatarUrl: string | null;
}

export interface BracketMatch {
  id: number;
  round: number;
  matchNumber: number;
  player1: BracketPlayer | null;
  player2: BracketPlayer | null;
  winner: { id: number; username: string } | null;
  gameId: number | null;
  completedAt: string | null;
}

export interface BracketResponse {
  tournamentId: number;
  name: string;
  status: TournamentStatus;
  totalRounds: number;
  currentRound: number | null;
  matches: BracketMatch[];
}

interface TournamentsResponse {
  tournaments: TournamentListItem[];
}

interface JoinTournamentResponse {
  message: string;
  participant: {
    id: number;
    userId: number;
  };
  tournament: {
    id: number;
    name: string;
    currentParticipants: number;
    maxPlayers: number;
    status: TournamentStatus;
  };
}

export const tournamentService = {
  getTournaments(status?: TournamentStatus): Promise<TournamentsResponse> {
    const query = status ? `?status=${status}` : "";
    return apiClient.get<TournamentsResponse>(`/api/tournaments${query}`);
  },

  getTournament(id: number): Promise<TournamentDetails> {
    return apiClient.get<TournamentDetails>(`/api/tournaments/${id}`);
  },

  createTournament(name: string, maxPlayers: 4 | 8): Promise<TournamentDetails> {
    return apiClient.post<TournamentDetails>("/api/tournaments", { name, maxPlayers });
  },

  joinTournament(tournamentId: number): Promise<JoinTournamentResponse> {
    return apiClient.post<JoinTournamentResponse>(
      `/api/tournaments/${tournamentId}/join`,
      {},
    );
  },

  getBracket(id: number): Promise<BracketResponse> {
    return apiClient.get<BracketResponse>(`/api/tournaments/${id}/bracket`);
  },
};
