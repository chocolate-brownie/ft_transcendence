import { Router } from 'express';
import { auth } from '../middleware/auth';
import { generateAIGame, RequestAIMove, getAIGame } from '../controllers/ai.controller';
import { get } from 'http';

const router = Router();

// POST /api/ai/games
router.post('/games', auth, generateAIGame);
router.post('/games/:id/move', auth, RequestAIMove);
router.get('/games/:id', auth, getAIGame);

export default router;
