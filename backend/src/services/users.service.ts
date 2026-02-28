// Users service — business logic for user profiles
// Get profile, update profile, avatar management

import prisma from "../lib/prisma";
import fs from "fs";
import path from "path";

type UpdateUserData = {
  displayName?: string;
};

//      Get User profile
export const getUserById = async (id: number, viewerId?: number) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      isOnline: true,
      createdAt: true,
    },
  });

  if (!user) {
    return null;
  }

  const hasCustomAvatar =
    !!user.avatarUrl &&
    user.avatarUrl.startsWith("/uploads/") &&
    !user.avatarUrl.includes("default.png");

  let canViewAvatar = false;
  if (viewerId && viewerId === id) {
    canViewAvatar = true;
  } else if (viewerId) {
    const friendship = await prisma.friend.findFirst({
      where: {
        OR: [
          { requesterId: viewerId, addresseeId: id },
          { requesterId: id, addresseeId: viewerId },
        ],
        status: "ACCEPTED",
      },
    });
    canViewAvatar = !!friendship;
  }

  const cleanedAvatar = hasCustomAvatar && canViewAvatar ? user.avatarUrl : null;

  // Return a new object to keep a nullable avatarUrl type without mutating the Prisma result
  return {
    ...user,
    avatarUrl: cleanedAvatar,
  };
};

//      MAJ User profile
export const updateUserById = async (userId: number, data: UpdateUserData) => {
  // Ne mettre à jour que les champs autorisés
  const allowedFields: UpdateUserData = {
    displayName: data.displayName,
  };

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: allowedFields,
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  });

  return updatedUser;
};

//      Update User Avatar
export const updateUserAvatar = async (userId: number, newAvatarUrl: string) => {
  // 1. Get the current user to find old avatar path
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  });

  // 2. Delete old avatar file from disk (if it exists and isn't the default)
  if (currentUser?.avatarUrl && !currentUser.avatarUrl.includes("default.png")) {
    const oldFilePath = path.join(process.cwd(), currentUser.avatarUrl);
    // Use fs.unlink with a try/catch — if file doesn't exist, just ignore
    try {
      await fs.promises.unlink(oldFilePath);
      console.log(`Deleted old avatar: ${oldFilePath}`);
    } catch {
      // File might already be deleted — that's fine, just log it
      console.warn(`Could not delete old avatar: ${oldFilePath}`);
    }
  }

  // 3. Update the database with the new avatar URL
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: newAvatarUrl },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  });

  return updatedUser;
};

export const searchUsers = async (currentUserId: number, query: string) => {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      id: { not: currentUserId },
      username: { contains: trimmed, mode: "insensitive" },
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      isOnline: true,
    },
    take: 10,
    orderBy: {
      username: "asc",
    },
  });

  return users;
}