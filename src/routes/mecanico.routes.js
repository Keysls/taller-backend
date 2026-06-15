import { Router } from 'express';
import * as ctrl from '../controllers/mecanico.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);
router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.patch('/:id/estado', ctrl.cambiarEstado);
export default router;
