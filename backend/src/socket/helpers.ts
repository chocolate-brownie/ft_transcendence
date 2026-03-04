import type { Socket } from "socket.io";

export type SocketUser = {
  id: number;
  username: string;
  avatarUrl?: string;
};

export function getSocketUser(socket: Socket): SocketUser {
  const user = socket.data.user as Partial<SocketUser> | undefined;

  if (!user || typeof user.id !== "number" || typeof user.username !== "string") {
    throw new Error("Unauthorized");
  }

  return {
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
  };
}

export function getGameRoomName(gameId: number): string {
  if (!gameId || isNaN(gameId)) {
    throw new Error("Attempted to get room name for invalid gameId");
  }
  return `game-${gameId}`;
}

export function assertGameId(value: unknown): number {
  if (!Number.isInteger(value) || Number(value) <= 0) {
    throw new Error("Invalid gameId");
  }
  return Number(value);
}
