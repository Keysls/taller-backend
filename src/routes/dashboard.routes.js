import { Router } from 'express';
import * as ctrl from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);
router.get('/kpis',      ctrl.getKPIs);
router.get('/analitica', ctrl.getAnalitica);
router.get('/historial', ctrl.getHistorial);
export default router;