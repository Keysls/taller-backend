import prisma from '../config/database.js';
 
export const getAll  = ()         => prisma.servicioTercero.findMany({ orderBy: { nombre: 'asc' } });
export const create  = (data)     => prisma.servicioTercero.create({ data });
export const update  = (id, data) => prisma.servicioTercero.update({ where: { id }, data });
export const remove  = (id)       => prisma.servicioTercero.update({ where: { id }, data: { activo: false } });