// Users controller — handles HTTP request/response for user profiles
// Calls users.service.ts for business logic

// backend/src/controllers/users.controller.ts

import { Request, Response } from 'express';
import { getUserById } from '../services/users.service';
import { AuthRequest } from '../middleware/auth';
import { updateUserById } from '../services/users.service';

export const getUser = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);

  // Validation stricte
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid user ID format' });
    return;
  }

  try {
    const user = await getUserById(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//UpdateProfile
export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { displayName } = req.body;

    // Validation métier : displayName 1-50 caractères
    if (
      typeof displayName !== 'string' ||
      displayName.length < 1 ||
      displayName.length > 50
    ) {
      return res.status(400).json({ error: 'displayName must be 1-50 characters' });
    }

    // Appel au service pour mettre à jour
    const updatedUser = await updateUserById(userId, { displayName });

    return res.status(200).json(updatedUser);
  } catch (error: any) {
    console.error('Error updating user profile:', error);

    // Prisma error si user non trouvé
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
};
