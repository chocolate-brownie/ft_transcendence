// Friends service — business logic for friend operations
// Send request, accept, reject, remove, list friends

import prisma from "../lib/prisma";
import { AppError } from "../lib/app-error";

// ──────────────────────────────────────────────
//                FRIENDSHIP STATUS
// ──────────────────────────────────────────────

export type FriendshipStatus = "none" | "pending_sent" | "pending_received" | "friends";

export async function getFriendshipStatus(
  currentUserId: number,
  targetUserId: number,
): Promise<FriendshipStatus> {
  if (currentUserId === targetUserId) return "none";

  const friendship = await prisma.friend.findFirst({
    where: {
      OR: [
        { requesterId: currentUserId, addresseeId: targetUserId },
        { requesterId: targetUserId, addresseeId: currentUserId },
      ],
      status: { in: ["PENDING", "ACCEPTED"] },
    },
  });

  if (!friendship) return "none";
  if (friendship.status === "ACCEPTED") return "friends";
  if (friendship.status === "PENDING") {
    return friendship.requesterId === currentUserId ? "pending_sent" : "pending_received";
  }
  return "none";
}

// ──────────────────────────────────────────────
//             SEND FRIEND REQUEST
// ──────────────────────────────────────────────
// Uses pg_advisory_xact_lock to prevent race conditions
// on simultaneous mutual friend requests (A→B and B→A).
//
// If the other user already sent a PENDING request,
// auto-accepts instead of returning 409.
// ──────────────────────────────────────────────

export async function createFriendRequest(requesterId: number, addresseeId: number) {
  // Self-request check
  if (requesterId === addresseeId) {
    throw new AppError(400, "You cannot send a friend request to yourself");
  }

  // Check target user exists (no lock needed for this)
  const addressee = await prisma.user.findUnique({
    where: { id: addresseeId },
  });

  if (!addressee) {
    throw new AppError(404, "User not found");
  }

  // Normalize IDs so (1,2) and (2,1) acquire the same lock
  const smallId = Math.min(requesterId, addresseeId);
  const bigId = Math.max(requesterId, addresseeId);

  return await prisma.$transaction(async (tx) => {
    // Advisory lock on the user pair — released on commit/rollback
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${smallId}::integer, ${bigId}::integer)`;

    // Check existing relationship (now protected by the lock)
    const existing = await tx.friend.findFirst({
      where: {
        OR: [
          { requesterId: requesterId, addresseeId: addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId },
        ],
        status: { in: ["PENDING", "ACCEPTED"] },
      },
    });

    if (existing) {
      if (existing.status === "ACCEPTED") {
        throw new AppError(409, "You are already friends with this user");
      }

      // The other user already sent us a request → auto-accept
      if (existing.requesterId === addresseeId && existing.status === "PENDING") {
        const accepted = await tx.friend.update({
          where: { id: existing.id },
          data: { status: "ACCEPTED" },
          include: {
            requester: { select: { id: true, username: true } },
            addressee: { select: { id: true, username: true } },
          },
        });
        return accepted;
      }

      // We already sent a request to this user
      throw new AppError(409, "A friend request already exists between you and this user");
    }

    // No existing relationship → create the friend request
    const friendRequest = await tx.friend.create({
      data: {
        requester: { connect: { id: requesterId } },
        addressee: { connect: { id: addresseeId } },
        status: "PENDING",
      },
      include: {
        requester: { select: { id: true, username: true } },
        addressee: { select: { id: true, username: true } },
      },
    });

    return friendRequest;
  });
}

// ──────────────────────────────────────────────
//            ACCEPT FRIEND REQUEST
// ──────────────────────────────────────────────

export async function acceptFriendRequest(requestId: number, currentUserId: number) {
  const friendRequest = await prisma.friend.findUnique({
    where: { id: requestId },
  });

  if (!friendRequest) {
    throw new AppError(404, "Friend request not found");
  }

  if (friendRequest.addresseeId !== currentUserId) {
    throw new AppError(403, "You can only accept requests sent to you");
  }

  if (friendRequest.status !== "PENDING") {
    throw new AppError(400, `Friend request is already ${friendRequest.status.toLowerCase()}`);
  }

  const updatedRequest = await prisma.friend.update({
    where: { id: requestId },
    data: { status: "ACCEPTED" },
    include: {
      requester: { select: { id: true, username: true } },
      addressee: { select: { id: true, username: true } },
    },
  });

  return updatedRequest;
}

// ──────────────────────────────────────────────
//               REMOVE FRIEND
// ──────────────────────────────────────────────

export async function removeFriend(friendUserId: number, currentUserId: number) {
  if (friendUserId === currentUserId) {
    throw new AppError(400, "Invalid friend ID");
  }

  const friendship = await prisma.friend.findFirst({
    where: {
      OR: [
        { requesterId: currentUserId, addresseeId: friendUserId },
        { requesterId: friendUserId, addresseeId: currentUserId },
      ],
    },
  });

  if (!friendship) {
    throw new AppError(404, "Friendship or friend request not found");
  }

  await prisma.friend.delete({
    where: { id: friendship.id },
  });
}

// ──────────────────────────────────────────────
//           REJECT FRIEND REQUEST
// ──────────────────────────────────────────────

export async function rejectFriendRequest(senderId: number, currentUserId: number) {
  if (senderId === currentUserId) {
    throw new AppError(400, "Invalid sender ID");
  }

  const request = await prisma.friend.findFirst({
    where: {
      requesterId: senderId,
      addresseeId: currentUserId,
      status: "PENDING",
    },
  });

  if (!request) {
    throw new AppError(404, "Pending friend request not found");
  }

  await prisma.friend.delete({
    where: { id: request.id },
  });
}

// ──────────────────────────────────────────────
//           GET ACCEPTED FRIENDS LIST
// ──────────────────────────────────────────────

interface FriendInfo {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isOnline: boolean;
}

export async function getAcceptedFriends(currentUserId: number) {
  const friendships = await prisma.friend.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: currentUserId }, { addresseeId: currentUserId }],
    },
    include: {
      requester: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          isOnline: true,
        },
      },
      addressee: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          isOnline: true,
        },
      },
    },
  });

  const friends: FriendInfo[] = friendships.map(
    (friendship: (typeof friendships)[number]) => {
      return friendship.requesterId === currentUserId
        ? friendship.addressee
        : friendship.requester;
    },
  );

  // Online first, then alphabetical
  friends.sort((a: FriendInfo, b: FriendInfo) => {
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
    return a.username.localeCompare(b.username);
  });

  return friends;
}

// ──────────────────────────────────────────────
//         GET PENDING FRIEND REQUESTS
// ──────────────────────────────────────────────

export async function getPendingRequests(currentUserId: number) {
  const requests = await prisma.friend.findMany({
    where: {
      addresseeId: currentUserId,
      status: "PENDING",
    },
    select: {
      id: true,
      requesterId: true,
      createdAt: true,
      requester: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          isOnline: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return requests.map((req: (typeof requests)[number]) => ({
    id: req.id,
    senderId: req.requesterId,
    sender: req.requester,
    createdAt: req.createdAt,
  }));
}
