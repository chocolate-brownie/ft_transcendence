import { Router } from "express";
import { getUser, updateMyProfile } from '../controllers/users.controller';
import { auth } from '../middleware/auth';

const router = Router();

// GET  /api/users/:id
router.get('/:id', getUser);

// PUT  /api/users/me
router.put('/me', auth, updateMyProfile);

// POST /api/users/me/avatar

export default router;
