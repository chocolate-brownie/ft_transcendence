import type { Server, Socket } from "socket.io";
import prisma from "../../lib/prisma";
import { matchmakingService } from "../services/matchmaking.service";

async function notifyFriends(
  io: Server,
  userId: number,
  event: "user_online" | "user_offline",
) {
  const friends = await prisma.friend.findMany({
    where: {
      OR: [{ requesterId: userId }, { addresseeId: userId }],
      status: "ACCEPTED",
    },
  });

  friends.forEach((friend) => {
    const friendId =
      friend.requesterId === userId ? friend.addresseeId : friend.requesterId;
    io.to(`user:${friendId}`).emit(event, { userId });
  });
}

export function registerPresenceHandlers(io: Server, socket: Socket) {
  const userId: number = socket.data.user.id;

  void socket.join(`user:${userId}`);

  prisma.user
    .update({ where: { id: userId }, data: { isOnline: true } })
    .catch((error) => console.error("Failed to set user online:", error));

  notifyFriends(io, userId, "user_online").catch(console.error);
}

export function handlePresenceDisconnect(io: Server, socket: Socket) {
  const userId: number = socket.data.user.id;

  matchmakingService.removeFromQueue(userId);

  prisma.user
    .update({ where: { id: userId }, data: { isOnline: false } })
    .catch((error) => console.error("Failed to set user offline:", error));

  notifyFriends(io, userId, "user_offline").catch(console.error);
}
