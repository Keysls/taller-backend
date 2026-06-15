import prisma from '../config/database.js';

export const generarNumeroOrden = async () => {
  const count = await prisma.ordenTrabajo.count();
  const year = new Date().getFullYear();
  return `OT-${year}-${String(count + 1).padStart(5, '0')}`;
};

export const generarNumeroCotizacion = async () => {
  const count = await prisma.cotizacion.count();
  const year = new Date().getFullYear();
  return `COT-${year}-${String(count + 1).padStart(5, '0')}`;
};
