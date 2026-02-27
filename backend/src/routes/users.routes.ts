import { Router } from "express";
import {
  getUser,
  updateMyProfile,
  uploadMyAvatar,
  handleMulterError,
} from "../controllers/users.controller";
import { auth } from "../middleware/auth";
import { uploadAvatar } from "../middleware/upload";

const router = Router();

// GET  /api/users/:id
router.get("/:id", auth, getUser);

// PUT  /api/users/me
router.put("/me", auth, updateMyProfile);

// POST /api/users/me/avatar
// Flow: auth → multer upload → error check → controller
router.post(
  "/me/avatar",
  auth, // 1. Verify JWT token
  (req, res, next) => {
    // 2. Run multer — wrapped to catch its errors
    uploadAvatar(req, res, (err: any) => {
      if (err) {
        // 3. If multer threw an error, handle it
        return handleMulterError(err, req, res, next);
      }
      // 4. No error — proceed to controller
      next();
    });
  },
  uploadMyAvatar, // 5. Process the uploaded file
);

export default router;
