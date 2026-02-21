// Users service — business logic for user profiles
// Get profile, update profile, avatar management

import prisma from '../lib/prisma';   // ← importe l'instance partagée

type UpdateUserData = {
  displayName?: string; // facultatif si tu veux pouvoir mettre à jour partiellement
};

//Get User profile
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

//MAJ User profile
export const updateUserById = async (
  userId: number,
  data: UpdateUserData
) => {
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
