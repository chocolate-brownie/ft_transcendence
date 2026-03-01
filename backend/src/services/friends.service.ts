// Friends service — business logic for friend operations
// Send request, accept, reject, remove, list friends

import prisma from "../lib/prisma";
import { AppError } from "../lib/app-error";

/* Get Friendship Status */
export type FriendshipStatus = "none" | "pending_sent" | "pending_received" | "friends";
export async function getFriendshipStatus(
  currentUserId: number,
  targetUserId: number,
): Promise<FriendshipStatus> {
  // Self check: nothing to do
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

//     SEND FRIEND REQUEST
export async function createFriendRequest(requesterId: number, addresseeId: number) {
  //Self-FriendRequest Check
  if (requesterId === addresseeId) {
    throw new AppError(400, "You cannot send a friend request to yourself");
  }

  //Check User
  const addressee = await prisma.user.findUnique({
    where: { id: addresseeId },
  });

  if (!addressee) {
    throw new AppError(404, "User not found");
  }

  //Check if FriendRequest available (A→B ou B→A, pending/accepted)
  const existing = await prisma.friend.findFirst({
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
    throw new AppError(409, "A friend request already exists between you and this user");
  }

  //Create FriendRequest
  const friendRequest = await prisma.friend.create({
    data: {
      requester: { connect: { id: requesterId } },
      addressee: { connect: { id: addresseeId } },
      status: "PENDING",
    },
    include: {
      requester: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, isOnline: true },
      },
      addressee: {
        select: { id: true, username: true },
      },
    },
  });

  return friendRequest;
}

//          ACCEPT FRIEND REQUEST

//Accept Friend Request
export async function acceptFriendRequest(requestId: number, currentUserId: number) {
  //Check Friend Request available
  const friendRequest = await prisma.friend.findUnique({
    where: { id: requestId },
  });

  if (!friendRequest) {
    throw new AppError(404, "Friend request not found");
  }

  //Check destinataire
  if (friendRequest.addresseeId !== currentUserId) {
    throw new AppError(403, "You can only accept requests sent to you");
  }

  //Check "PENDING" Etat
  if (friendRequest.status !== "PENDING") {
    throw new AppError(400, `Friend request is already ${friendRequest.status.toLowerCase()}`);
  }

  //Switch "PENDING" to "ACCEPTED"
  const updatedRequest = await prisma.friend.update({
    where: { id: requestId },
    data: {
      status: "ACCEPTED",
    },
    include: {
      requester: {
        select: { id: true, username: true },
      },
      addressee: {
        select: { id: true, username: true },
      },
    },
  });

  return updatedRequest;
}

//          DELETE FRIEND / REJECT REQUEST

export async function removeFriend(friendUserId: number, currentUserId: number) {
  // Self-check
  if (friendUserId === currentUserId) {
    throw new AppError(400, "Invalid friend ID");
  }

  // Seek the relationship between two users
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

  // Hard delete
  await prisma.friend.delete({
    where: { id: friendship.id },
  });
}

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

//          GET ACCEPTED FRIENDS LIST

// Type for Friend return
interface FriendInfo {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isOnline: boolean;
}

export async function getAcceptedFriends(currentUserId: number) {
  // Seek ACCEPTED status
  const friendships = await prisma.friend.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: currentUserId }, { addresseeId: currentUserId }],
    },
    // Include related user details for each friendship
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

  // Map friendships to get the other user in each friendship
  const friends: FriendInfo[] = friendships.map(
    (friendship: (typeof friendships)[number]) => {
      if (friendship.requesterId === currentUserId) {
        return friendship.addressee;
      } else {
        return friendship.requester;
      }
    },
  );

  // Sort : online priority
  friends.sort((a: FriendInfo, b: FriendInfo) => {
    if (a.isOnline !== b.isOnline) {
      return a.isOnline ? -1 : 1;
    }
    // Sort : string compare
    return a.username.localeCompare(b.username);
  });

  return friends;
}

//          GET PENDING FRIEND REQUESTS (incoming)

export async function getPendingRequests(currentUserId: number) {
  // Seek PENDING status
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
    // Recently first
    orderBy: {
      createdAt: "desc",
    },
  });

  // Build request
  return requests.map((req: (typeof requests)[number]) => ({
    id: req.id,
    senderId: req.requesterId,
    sender: req.requester,
    createdAt: req.createdAt,
  }));
}
