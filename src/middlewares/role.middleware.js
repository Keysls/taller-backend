import { sendError } from '../utils/response.js';

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return sendError(res, 401, 'No autenticado');
  if (!roles.includes(req.user.rol.nombre)) {
    return sendError(res, 403, 'Sin permisos para esta acción');
  }
  next();
};
