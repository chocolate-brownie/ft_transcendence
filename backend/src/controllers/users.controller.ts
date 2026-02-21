// Users controller — handles HTTP request/response for user profiles
// Calls users.service.ts for business logic

// backend/src/controllers/users.controller.ts

import { Request, Response } from 'express';
import { getUserById } from '../services/users.service';

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
