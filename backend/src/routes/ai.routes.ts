import { Router } from 'express';
import { auth } from '../middleware/auth';
import { generateAIGame } from '../controllers/ai.controller';

const router = Router();

// POST /api/ai/games
router.post('/ai/games', auth, generateAIGame);
router.post('/ai/games/:id/move', auth, generateAIGame);

export default router;
