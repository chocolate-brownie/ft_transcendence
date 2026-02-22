// Auth service — business logic for authentication
// Signup, login, password hashing, JWT generation
// No HTTP concepts here — just plain functions

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const saltRounds = 12;
const jwtSecret = process.env.JWT_SECRET || "default-secret-key";

type AuthUser = {
  id: number;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isOnline: boolean;
  wins: number;
  losses: number;
  draws: number;
  createdAt: Date;
};

export type AuthResult = {
  token: string;
  user: AuthUser;
};

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, saltRounds);
}

export function generateToken(id: number, email: string, username: string): string {
  return jwt.sign({ id, email, username }, jwtSecret, { expiresIn: "24h" });
}

export async function signup(
  email: string,
  username: string,
  password: string,
): Promise<AuthResult> {
  if (username.length < 3 || password.length < 8) {
    throw new Error(
      "Username must be at least 3 characters and password must be at least 8 characters long",
    );
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    throw new Error("Invalid email format");
  }

  const checkMail = await prisma.user.findUnique({ where: { email } });
  const checkUsername = await prisma.user.findUnique({ where: { username } });

  if (checkMail || checkUsername) {
    throw new Error("A User with this email or username already exists");
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, username, passwordHash: hashedPassword },
  });

  const token = generateToken(user.id, user.email, user.username);
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      isOnline: user.isOnline,
      wins: user.wins,
      losses: user.losses,
      draws: user.draws,
      createdAt: user.createdAt,
    },
  };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const user = await prisma.user.findUnique({ where: { email } });

  const passwordMatch = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !passwordMatch) {
    throw new Error("Invalid email or password");
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { isOnline: true },
  });

  const token = generateToken(updated.id, updated.email, updated.username);
  return {
    token,
    user: {
      id: updated.id,
      email: updated.email,
      username: updated.username,
      displayName: updated.displayName,
      avatarUrl: updated.avatarUrl,
      isOnline: updated.isOnline,
      wins: updated.wins,
      losses: updated.losses,
      draws: updated.draws,
      createdAt: updated.createdAt,
    },
  };
}
