import { Router } from 'express';
import { auth } from '../middleware/auth';
import { generateAIGame, RequestAIMove, getAIGame } from '../controllers/ai.controller';
import { get } from 'http';

const router = Router();

// POST /api/ai/games
router.post('/ai/games', auth, generateAIGame);
router.post('/ai/games/:id/move', auth, RequestAIMove);
router.get('/ai/games/:id', auth, getAIGame);

export default router;
