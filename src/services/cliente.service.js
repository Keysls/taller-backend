import prisma from '../config/database.js';

export const getAll = async ({ search = '', page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const where = search
    ? { OR: [{ nombres: { contains: search, mode: 'insensitive' } }, { apellidos: { contains: search, mode: 'insensitive' } }, { dniRuc: { contains: search } }] }
    : {};
  const [data, total] = await Promise.all([
    prisma.cliente.findMany({ where, skip, take: limit, orderBy: { fechaRegistro: 'desc' } }),
    prisma.cliente.count({ where }),
  ]);
  return { data, total, page, limit };
};

export const getById = async (id) => {
  const cliente = await prisma.cliente.findUnique({ where: { id }, include: { vehiculos: true } });
  if (!cliente) throw Object.assign(new Error('Cliente no encontrado'), { status: 404 });
  return cliente;
};

export const create = async (data) => prisma.cliente.create({ data });

export const update = async (id, data) => prisma.cliente.update({ where: { id }, data });

export const remove = async (id) => prisma.cliente.update({ where: { id }, data: { activo: false } });
