import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { sendSuccess }  from '../utils/response.js';
import prisma           from '../config/database.js';

const router = Router();
router.use(authenticate);
router.get('/', async (req, res, next) => {
  try { sendSuccess(res, await prisma.rol.findMany({ orderBy: { nombre: 'asc' } })); }
  catch(e) { next(e); }
});
export default router;