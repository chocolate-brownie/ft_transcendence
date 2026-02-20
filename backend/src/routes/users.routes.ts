import { Router } from "express";
import { getUser } from '../controllers/users.controller';


const router = Router();

// GET  /api/users/:id

router.get('/:id', getUser);

// PUT  /api/users/me
// POST /api/users/me/avatar

export default router;
