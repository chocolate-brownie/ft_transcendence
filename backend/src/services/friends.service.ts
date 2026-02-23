// Friends service — business logic for friend operations
// Send request, accept, reject, remove, list friends

import prisma from '../lib/prisma';

//     SEND FRIEND REQUEST
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
    throw { status: 404, message: "User not found" };
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

//          ACCEPT FRIEND REQUEST

//Accept Friend Request
export async function acceptFriendRequest(requestId: number, currentUserId: number) {

  //Check Friend Request available
  const friendRequest = await prisma.friend.findUnique({
    where: { id: requestId },
  });

  if (!friendRequest) {
    throw { status: 404, message: "Friend request not found" };
  }

  //Check destinataire
  if (friendRequest.addresseeId !== currentUserId) {
    throw { status: 403, message: "You can only accept requests sent to you" };
  }

  //Check "PENDING" Etat
  if (friendRequest.status !== "PENDING") {
    throw { status: 400, message: `Friend request is already ${friendRequest.status.toLowerCase()}` };
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
    throw { status: 400, message: "Invalid friend ID" };
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
    throw { status: 404, message: "Friendship or friend request not found" };
  }

  // Hard delete
  await prisma.friend.delete({
    where: { id: friendship.id },
  });
}
