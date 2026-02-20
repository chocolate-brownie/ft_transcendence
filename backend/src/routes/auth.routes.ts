import { Router } from 'express';
import { auth } from '../middleware/auth';
import { signupController, loginController, getMeController } from '../controllers/auth.controller';

const router = Router();

// POST /api/auth/signup
// POST /api/auth/login
// GET  /api/auth/me

router.get('/api/auth/me', auth, getMeController);
router.post('/api/auth/signup', signupController);
router.post('/api/auth/login', loginController);

export default router;
