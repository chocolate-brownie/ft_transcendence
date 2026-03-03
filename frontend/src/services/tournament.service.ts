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
}

export interface TournamentParticipant {
  id: number;
  userId: number;
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
};
