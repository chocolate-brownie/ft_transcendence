// Auth controller — handles HTTP request/response for authentication
// Calls auth.service.ts for business logic

import { Response } from 'express';
import { signup, login } from '../services/auth.service';
import type { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export async function signupController(req: AuthRequest, res: Response) {
  const { email, username, password } = req.body;

  try {
    const result = await signup(email, username, password);
    res.status(201).json(result);
  } catch (err: any) {
    switch (err.message) {
      case 'Username must be at least 3 characters and password must be at least 8 characters long':
        res.status(400).json({ message: err.message });
        break;
      case 'Invalid email format':
        res.status(400).json({ message: err.message });
        break;
      case 'A User with this email or username already exists':
        res.status(409).json({ message: err.message });
        break;
      default:
        res.status(500).json({ message: 'Internal server error' });
        break;
    }
  }
}

export async function loginController(req: AuthRequest, res: Response) {
  const { email, password } = req.body;

  try {
    const result = await login(email, password);
    res.status(200).json(result);
  } catch (err: any) {
    switch (err.message) {
      case 'Email and password are required':
        res.status(400).json({ message: err.message });
        break;
      case 'Invalid email or password':
        res.status(401).json({ message: err.message });
        break;
      default:
        res.status(500).json({ message: 'Internal server error' });
        break;
    }
  }
}

// Returns fresh user data from the database, not just the JWT payload.
// The JWT payload can be stale (e.g. username/avatar changed after token was issued).
export async function getMeController(req: AuthRequest, res: Response) {
  const userId = req.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isOnline: true,
        wins: true,
        losses: true,
        draws: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
}
