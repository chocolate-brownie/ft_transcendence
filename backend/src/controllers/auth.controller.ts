// Auth controller — handles HTTP request/response for authentication
// Calls auth.service.ts for business logic

import { Request, Response } from 'express';
import { signup, login } from '../services/auth.service';
import type { AuthRequest } from '../middleware/auth';

export async function signupController(req: Request, res: Response) {
  const { email, username, password } = req.body;

  try {
    const token = await signup(email, username, password);
    res.status(201).json({ token });
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

export async function loginController(req: Request, res: Response) {
  const { email, password } = req.body;

  try {
    const token = await login(email, password);
    res.status(200).json({ token });
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

export async function getMeController(req: AuthRequest, res: Response) {
  const user = req.user;
  const { id, email, username } = user;
  res.status(200).json({ user: { id, email, username } });
}
