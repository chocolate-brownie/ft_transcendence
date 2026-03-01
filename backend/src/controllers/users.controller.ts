// Users controller — handles HTTP request/response for user profiles
// Calls users.service.ts for business logic

// backend/src/controllers/users.controller.ts

import { Request, Response } from "express";
import multer from "multer";
import { AuthRequest } from "../middleware/auth";
import { getUserById, updateUserById, updateUserAvatar, searchUsers } from "../services/users.service";

export const getUser = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);

  // Validation stricte
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid user ID format" });
    return;
  }

  try {
    const user = await getUserById(id);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//UpdateProfile
export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { displayName } = req.body;

    // Validation métier : displayName 3-50 caractères
    const trimmedName = typeof displayName === "string" ? displayName.trim() : "";
    const sanitizedName = trimmedName.replace(/<[^>]*>/g, "");
    if (sanitizedName.length < 3 || sanitizedName.length > 50) {
      return res.status(400).json({ error: "displayName must be 3-50 characters" });
    }

    // Appel au service pour mettre à jour
    const updatedUser = await updateUserById(userId, { displayName: sanitizedName });

    return res.status(200).json(updatedUser);
  } catch (error: any) {
    console.error("Error updating user profile:", error);

    // Prisma error si user non trouvé
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};

//        Upload Avatar

export const uploadMyAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Multer already ran as middleware before this handler.
    // If we reach here, the file passed validation.
    // req.file is set by multer's .single('avatar')

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Build the public URL path:  /uploads/avatars/42-1709049600000.jpg
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Update database + delete old file
    const updatedUser = await updateUserAvatar(userId, avatarUrl);

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Multer error handler ──────────────────────────────────────────────────
// Multer throws specific errors that we need to catch and translate
// into proper HTTP responses. This middleware wraps the multer upload.
export const handleMulterError = (
  err: any,
  req: AuthRequest,
  res: Response,
  next: Function,
) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "File too large. Maximum size is 5MB" });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  if (err?.message === "INVALID_FILE_TYPE") {
    return res.status(400).json({
      error: "Invalid file type. Only .jpg, .jpeg, .png, .gif are allowed",
    });
  }

  // Unknown error — pass to global error handler
  next(err);
};

export const searchUsersController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId || typeof currentUserId !== "number") {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const rawQuery = req.query.q;
    let q = "";
    if (typeof rawQuery === "string") {
      q = rawQuery.trim();
    }

    if (q.length === 0) {
      res.status(200).json([]);
      return;
    }

     if (q.length > 50) {
      res.status(400).json({ error: "Query too long" });
      return;
    }

    const users = await searchUsers(currentUserId, q);
    res.status(200).json(users);
  } catch (error) {
    console.error("[searchUsersController] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
