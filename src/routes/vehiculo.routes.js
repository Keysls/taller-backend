import { Router } from 'express';
import * as ctrl from '../controllers/vehiculo.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);
router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getById);
router.get('/:id/historial', ctrl.getHistorial);
router.put('/:id', ctrl.update);
export default router;
