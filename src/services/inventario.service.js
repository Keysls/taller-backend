import prisma from '../config/database.js';

export const getAll = async ({ search = '', page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const where = search ? { OR: [{ nombre: { contains: search, mode: 'insensitive' } }, { codigo: { contains: search } }] } : {};
  const [data, total] = await Promise.all([
    prisma.repuesto.findMany({ where, skip, take: limit, orderBy: { nombre: 'asc' } }),
    prisma.repuesto.count({ where }),
  ]);
  return { data, total, page, limit };
};

export const getStockBajo = async () =>
  prisma.repuesto.findMany({ where: { activo: true, stock: { lte: 5 } } });

export const create = async (data) => prisma.repuesto.create({ data });

export const update = async (id, data) => prisma.repuesto.update({ where: { id }, data });

export const registrarMovimiento = async (id, { tipo, cantidad, motivo }) => {
  const repuesto = await prisma.repuesto.findUnique({ where: { id } });
  if (!repuesto) throw Object.assign(new Error('Repuesto no encontrado'), { status: 404 });
  const stockAntes = repuesto.stock;
  const stockDespues = tipo === 'ENTRADA' ? stockAntes + cantidad : tipo === 'SALIDA' ? stockAntes - cantidad : cantidad;
  if (stockDespues < 0) throw Object.assign(new Error('Stock insuficiente'), { status: 400 });
  await prisma.$transaction([
    prisma.repuesto.update({ where: { id }, data: { stock: stockDespues } }),
    prisma.movimientoInventario.create({ data: { repuestoId: id, tipo, cantidad, stockAntes, stockDespues, motivo } }),
  ]);
  return prisma.repuesto.findUnique({ where: { id } });
};
