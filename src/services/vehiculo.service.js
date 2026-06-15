import prisma from '../config/database.js';

export const getAll = async ({ search = '', page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const where = search ? { OR: [{ placa: { contains: search, mode: 'insensitive' } }, { marca: { contains: search, mode: 'insensitive' } }] } : {};
  const [data, total] = await Promise.all([
    prisma.vehiculo.findMany({ where, skip, take: limit, include: { cliente: true }, orderBy: { creadoEn: 'desc' } }),
    prisma.vehiculo.count({ where }),
  ]);
  return { data, total, page, limit };
};

export const getById = async (id) => {
  const v = await prisma.vehiculo.findUnique({ where: { id }, include: { cliente: true } });
  if (!v) throw Object.assign(new Error('Vehículo no encontrado'), { status: 404 });
  return v;
};

export const getHistorial = async (id) =>
  prisma.ordenTrabajo.findMany({
    where: { vehiculoId: id },
    include: { servicios: { include: { servicio: true } }, repuestos: { include: { repuesto: true } }, mecanico: true },
    orderBy: { fecha: 'desc' },
  });

export const create = async (data) => prisma.vehiculo.create({ data, include: { cliente: true } });
export const update = async (id, data) => prisma.vehiculo.update({ where: { id }, data });
