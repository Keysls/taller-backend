import { Router } from 'express';
import * as ctrl from '../controllers/orden.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = Router();
const NO_MECANICO = authorize('ADMINISTRADOR', 'SUPERVISOR', 'RECEPCION');

router.use(authenticate);

// El mecánico SÍ puede ver órdenes (lista y detalle)
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);

// Todo lo demás (escritura + PDF con precios) queda fuera de su alcance
router.post('/',               NO_MECANICO, ctrl.create);
router.get('/:id/pdf',         NO_MECANICO, ctrl.getPDF);
router.patch('/:id',           NO_MECANICO, ctrl.update);
router.patch('/:id/estado',    NO_MECANICO, ctrl.cambiarEstado);
router.post('/:id/servicios',  NO_MECANICO, ctrl.agregarServicio);
router.post('/:id/repuestos',  NO_MECANICO, ctrl.agregarRepuesto);
router.patch('/:id/completo',  NO_MECANICO, ctrl.updateCompleto);

export default router;