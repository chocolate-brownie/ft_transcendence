// Friends service — business logic for friend operations
// Send request, accept, reject, remove, list friends

import prisma from '../lib/prisma';

//Send Friend Request
export async function createFriendRequest(requesterId: number, addresseeId: number) {

  //Self-FriendRequest Check
  if (requesterId === addresseeId) {
    throw { status: 400, message: "You cannot send a friend request to yourself" };
  }

  //Check User
  const addressee = await prisma.user.findUnique({
    where: { id: addresseeId },
  });

  if (!addressee) {
    throw { status: 400, message: "User not found" };
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
      throw { status: 409, message: "You are already friends with this user" };
    }
    throw { status: 409, message: "A friend request already exists between you and this user" };
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
        select: { id: true, username: true },
      },
      addressee: {
        select: { id: true, username: true },
      },
    },
  });

  return friendRequest;
}
