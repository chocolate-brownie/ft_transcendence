// Multer configuration for avatar file uploads
// Handles: storage location, filename generation, file type validation, size limit

import multer, { FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";
import { AuthRequest } from "./auth";

// ─── Storage config ────────────────────────────────────────────────────────
// Defines WHERE files are saved and HOW they are named
const storage = multer.diskStorage({
  // Save files to backend/uploads/avatars/
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, path.join(process.cwd(), "uploads", "avatars"));
  },

  // Generate unique filename: {userId}-{timestamp}.{extension}
  // Example: 42-1709049600000.jpg
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id || "unknown";
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${userId}-${timestamp}${ext}`);
  },
});

// ─── File filter ───────────────────────────────────────────────────────────
// Only allow image files: .jpg, .jpeg, .png, .gif
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif"];

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = ALLOWED_TYPES.includes(file.mimetype);
  const extOk = ALLOWED_EXTENSIONS.includes(ext);

  if (mimeOk && extOk) {
    cb(null, true);
  } else {
    cb(new Error("INVALID_FILE_TYPE"));
  }
};

// ─── Export configured multer instance ─────────────────────────────────────
// - limits.fileSize: max 5MB (5 * 1024 * 1024 bytes)
// - single('avatar'): expects ONE file with form field name "avatar"
export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
}).single("avatar");
