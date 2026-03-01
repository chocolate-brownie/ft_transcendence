// Auth controller — handles HTTP request/response for authentication
// Calls auth.service.ts for business logic

import { Response } from "express";
import { signup, login } from "../services/auth.service";
import type { AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";

export async function signupController(req: AuthRequest, res: Response) {
  try {
    const { email, username, password } = req.body;
    const result = await signup(email, username, password);
    res.status(201).json(result);
  } catch (err: any) {
    switch (err.message) {
      case "Username must be at least 3 characters and password must be at least 8 characters long":
        res.status(400).json({ message: err.message });
        break;
      case "Invalid email format":
        res.status(400).json({ message: err.message });
        break;
      case "A User with this email or username already exists":
        res.status(409).json({ message: err.message });
        break;
      default:
        console.error("[signupController] unexpected error:", err);
        res.status(500).json({ message: "Internal server error" });
        break;
    }
  }
}

export async function loginController(req: AuthRequest, res: Response) {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.status(200).json(result);
  } catch (err: any) {
    switch (err.message) {
      case "Email and password are required":
        res.status(400).json({ message: err.message });
        break;
      case "Invalid email or password":
        res.status(401).json({ message: err.message });
        break;
      default:
        console.error("[loginController] unexpected error:", err);
        res.status(500).json({ message: "Internal server error" });
        break;
    }
  }
}

// Sets isOnline = false immediately on explicit logout instead of waiting
// for the socket to disconnect (which can take several seconds).
export async function logoutController(req: AuthRequest, res: Response) {
  const userId = req.user.id;
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: false },
    });
    res.status(204).send();
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
}

// Returns fresh user data from the database, not just the JWT payload.
// The JWT payload can be stale (e.g. username/avatar changed after token was issued).
export async function getMeController(req: AuthRequest, res: Response) {
  const userId = req.user.id;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true },
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

    res.status(200).json({ user });
  } catch (err: any) {
    // P2025 = record not found — token refers to a deleted user
    if (err?.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}
