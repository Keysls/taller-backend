import { Router } from 'express';
import * as ctrl from '../controllers/cotizacion.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/',               ctrl.getAll);
router.get('/:id/pdf',        ctrl.getPDF);        // ← NUEVO
router.get('/:id',            ctrl.getById);
router.post('/',              ctrl.create);
router.post('/:id/convertir', ctrl.convertirAOrden);

export default router;