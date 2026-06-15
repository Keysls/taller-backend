import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { env } from '../config/env.js';

export const login = async ({ email, password }) => {
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: { rol: true },
  });
  if (!usuario || !usuario.activo) {
    throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });
  }
  const valida = await bcrypt.compare(password, usuario.password);
  if (!valida) {
    throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });
  }
  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol.nombre },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
  const { password: _, ...user } = usuario;
  return { token, user };
};
