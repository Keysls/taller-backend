import { Router } from 'express';
import * as ctrl from '../controllers/inventario.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/stock-bajo', ctrl.getStockBajo);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.post('/:id/movimiento', ctrl.registrarMovimiento);
export default router;
