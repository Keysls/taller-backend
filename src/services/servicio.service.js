import prisma from '../config/database.js';

export const getAll = async () => prisma.servicio.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } });
export const create = async (data) => prisma.servicio.create({ data });
export const update = async (id, data) => prisma.servicio.update({ where: { id }, data });
export const remove = async (id) => prisma.servicio.update({ where: { id }, data: { activo: false } });
