import prisma from '../config/database.js';

export const getAll = async () => prisma.mecanico.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } });
export const getById = async (id) => prisma.mecanico.findUnique({ where: { id } });
export const create = async (data) => prisma.mecanico.create({ data });
export const update = async (id, data) => prisma.mecanico.update({ where: { id }, data });
export const cambiarEstado = async (id, estado) => prisma.mecanico.update({ where: { id }, data: { estado } });
