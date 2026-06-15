import { Router } from 'express';
import * as ctrl from '../controllers/usuario.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize }    from '../middlewares/role.middleware.js';

const router = Router();
router.use(authenticate);
router.use(authorize('ADMINISTRADOR'));

router.get('/',                    ctrl.getAll);
router.post('/',                   ctrl.create);
router.put('/:id',                 ctrl.update);
router.patch('/:id/activo',        ctrl.toggleActivo);
router.patch('/:id/password',      ctrl.cambiarPassword);

export default router;