import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import { authRateLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();
const authController = new AuthController();

router.post('/login',authRateLimiter, authController.login);
router.post('/register', authController.register);

export default router;