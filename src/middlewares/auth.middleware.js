import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { env } from '../config/env.js';
import { sendError } from '../utils/response.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return sendError(res, 401, 'Token requerido');
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.id },
      include: { rol: true },
    });
    if (!usuario || !usuario.activo) {
      return sendError(res, 401, 'Usuario inactivo o no encontrado');
    }
    req.user = usuario;
    next();
  } catch {
    return sendError(res, 401, 'Token inválido o expirado');
  }
};
