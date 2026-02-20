// Users service — business logic for user profiles
// Get profile, update profile, avatar management

import prisma from '../lib/prisma';   // ← importe l'instance partagée

export const getUserById = async (id: number) => {
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

  return user;
};