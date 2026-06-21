import { Router } from 'express';
import * as ctrl from '../controllers/auditoria.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/modulos', ctrl.getModulos);
router.get('/:id', ctrl.getById);
router.get('/', ctrl.getAll);

export default router;