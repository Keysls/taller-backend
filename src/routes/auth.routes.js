import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
router.post('/login', ctrl.login);
router.get('/me', authenticate, ctrl.me);
export default router;
