import { Router } from 'express';
import { auth } from '../middleware/auth';
import { signupController, loginController, getMeController, logoutController } from '../controllers/auth.controller';

const router = Router();

// POST /api/auth/signup
// POST /api/auth/login
// GET  /api/auth/me

router.get('/me', auth, getMeController);
router.post('/logout', auth, logoutController);
router.post('/signup', signupController);
router.post('/login', loginController);

export default router;
