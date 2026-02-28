// Shared TypeScript types for the frontend
// These should match the backend Prisma models

export type FriendshipStatus = "none" | "pending_sent" | "pending_received" | "friends";

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

export interface MessageWithSender {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  read: boolean;
  sender: {
    username: string;
    avatarUrl: string | null;
  };
}

export interface ChatHistoryResponse {
  messages: MessageWithSender[];
  hasMore: boolean;
  nextCursor: number | null;
}

export interface ConversationSummary {
  user: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    isOnline: boolean;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: number;
  };
  unreadCount: number;
}

export interface Friend {
  id: number;
  requesterId: number;
  addresseeId: number;
  status: "PENDING" | "ACCEPTED" | "BLOCKED";
  createdAt: string;
}

export interface PendingRequest {
  id: number;
  senderId: number;
  sender: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    isOnline: boolean;
  };
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
