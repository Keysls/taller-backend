import { Router } from 'express';
import * as ctrl from '../controllers/pago.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/',                        ctrl.getAll);
router.get('/pendientes',              ctrl.getOrdenesPendientes);
router.get('/orden/:ordenId',          ctrl.getByOrden);
router.post('/orden/:ordenId',         ctrl.create);
router.delete('/:id',                  ctrl.remove);

export default router;