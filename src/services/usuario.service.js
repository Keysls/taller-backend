import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';

export const getAll = async () =>
  prisma.usuario.findMany({
    include: { rol: true },
    orderBy: { creadoEn: 'desc' },
  });

export const getById = async (id) =>
  prisma.usuario.findUnique({ where: { id }, include: { rol: true } });

export const create = async ({ nombre, email, password, rolId }) => {
  const hash = await bcrypt.hash(password, 12);
  return prisma.usuario.create({
    data: { nombre, email, password: hash, rolId },
    include: { rol: true },
  });
};

export const update = async (id, { nombre, email, rolId }) =>
  prisma.usuario.update({
    where: { id },
    data:  { nombre, email, rolId },
    include: { rol: true },
  });

export const toggleActivo = async (id, activo) =>
  prisma.usuario.update({ where: { id }, data: { activo } });

export const cambiarPassword = async (id, password) => {
  const hash = await bcrypt.hash(password, 12);
  return prisma.usuario.update({ where: { id }, data: { password: hash } });
};