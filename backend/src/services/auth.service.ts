// Auth service — business logic for authentication
// Signup, login, password hashing, JWT generation
// No HTTP concepts here — just plain functions

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();
const saltRounds = 12;
const jwtSecret = process.env.JWT_SECRET || 'default-secret-key';


export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, saltRounds);
}

export function generateToken(id: number, email: string, username: string): string {
  return jwt.sign(
    { id, email, username },
    jwtSecret,
    { expiresIn: '1m' }
  );
}

export async function signup(email: string, username: string, password: string): Promise<string> {
  if (username.length < 3 ||password.length < 8) {
	  throw new Error('Username must be at least 3 characters and password must be at least 8 characters long');
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
	  throw new Error('Invalid email format');
  }

  const checkMail = await prisma.user.findUnique({
	  where: { email },
  });

  const checkUsername = await prisma.user.findUnique({
	  where: { username },
  });

  if (checkMail || checkUsername) {
	  throw new Error('A User with this email or username already exists');
  }

  const hashedPassword = await hashPassword(password);
  const date = new Date();

  const user = await prisma.user.create({
	data: {
	  email: email,
	  username: username,
	  passwordHash: hashedPassword,
    createdAt: date,
	},
  });

  return generateToken(user.id, user.email, user.username);
}

export async function login(email: string, password: string): Promise<string> {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  const user = await prisma.user.findUnique({
	  where: { email },
  });

  const passwordMatch = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !passwordMatch) {
    throw new Error('Invalid email or password');
  }

  /** Find the user with this ID and set their isOnline to true */
  await prisma.user.update({
    where: { id: user.id },
    data: { isOnline: true, updatedAt: new Date() },
  });

  return generateToken(user.id, user.email, user.username);
}
