// Shared TypeScript types for the frontend
// These should match the backend Prisma models

export interface User {
  id: number;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isOnline: boolean;
  wins: number;
  losses: number;
  draws: number;
  createdAt: string;
}

export interface Game {
  id: number;
  player1Id: number;
  player2Id: number | null;
  winnerId: number | null;
  boardState: (string | null)[];
  boardSize: number;
  currentTurn: string;
  gameType: "CLASSIC" | "CUSTOM" | "TOURNAMENT" | "AI";
  status: "WAITING" | "IN_PROGRESS" | "FINISHED" | "DRAW" | "CANCELLED";
  settings: Record<string, unknown> | null;
  createdAt: string;
  finishedAt: string | null;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
}

export interface Friend {
  id: number;
  requesterId: number;
  addresseeId: number;
  status: "PENDING" | "ACCEPTED" | "BLOCKED";
  createdAt: string;
}

export interface FriendInfo {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isOnline: boolean;
}

export interface Tournament {
  id: number;
  name: string;
  status: "REGISTERING" | "IN_PROGRESS" | "FINISHED" | "CANCELLED";
  maxPlayers: number;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}
