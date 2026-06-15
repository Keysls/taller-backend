import prisma from '../config/database.js';

const includeOrden = {
  orden: {
    include: {
      vehiculo: { include: { cliente: true } },
      mecanico: true,
      pagos: true,
    }
  }
};

// ─── Listar todos los pagos (con info de OT) ──────────────────────
export const getAll = async ({ page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.pago.findMany({
      skip, take: limit,
      orderBy: { fecha: 'desc' },
      include: includeOrden.orden,
    }),
    prisma.pago.count(),
  ]);
  return { data, total, page, limit };
};

// ─── Pagos de una OT ──────────────────────────────────────────────
export const getByOrden = async (ordenId) =>
  prisma.pago.findMany({ where: { ordenId }, orderBy: { fecha: 'desc' } });

// ─── OTs con saldo pendiente ──────────────────────────────────────
export const getOrdenesPendientes = async ({ page = 1, limit = 20 } = {}) => {
  const ordenes = await prisma.ordenTrabajo.findMany({
    where: {
      estado:       { notIn: ['CANCELADO'] },   // ← solo excluye canceladas
      totalGeneral: { gt: 0 },
      // SIN filtro de pagos — muestra todas aunque no tengan pagos aún
    },
    include: {
      vehiculo: { include: { cliente: true } },
      mecanico: true,
      pagos:    true,
    },
    orderBy: { creadoEn: 'desc' },
  });

  const mapeadas = ordenes.map(o => {
    const pagado = o.pagos.reduce((s, p) => s + Number(p.monto), 0);
    const saldo  = Number(o.totalGeneral) - pagado;
    return { ...o, totalPagado: pagado, saldo };
  });

  // Pendientes de cobro primero, luego las ya pagadas
  mapeadas.sort((a, b) => {
    if (a.saldo > 0 && b.saldo <= 0) return -1;
    if (a.saldo <= 0 && b.saldo > 0) return 1;
    return new Date(b.creadoEn) - new Date(a.creadoEn);
  });

  const total = mapeadas.length;
  const skip  = (page - 1) * limit;
  const data  = mapeadas.slice(skip, skip + limit);
  return { data, total, page, limit };
};

// ─── Registrar pago ───────────────────────────────────────────────
export const create = async (ordenId, { metodo, monto, referencia, notas, fecha }) => {
  const orden = await prisma.ordenTrabajo.findUnique({
    where:   { id: ordenId },
    include: { pagos: true },
  });
  if (!orden) throw Object.assign(new Error('Orden no encontrada'), { status: 404 });

  const pagado = orden.pagos.reduce((s, p) => s + Number(p.monto), 0);
  const saldo  = Number(orden.totalGeneral) - pagado;

  if (Number(monto) > saldo + 0.01)
    throw Object.assign(new Error(`Monto supera el saldo (S/ ${saldo.toFixed(2)})`), { status: 400 });

  const pago = await prisma.pago.create({
    data: {
      ordenId,
      metodo,
      monto:      Number(monto),
      referencia: referencia || null,
      notas:      notas      || null,
      fecha:      fecha ? new Date(fecha) : new Date(),
    },
  });

  // Si saldo queda en 0 → cambiar estado a ENTREGADO automáticamente
  const nuevoPagado = pagado + Number(monto);
  if (Math.abs(nuevoPagado - Number(orden.totalGeneral)) < 0.01) {
    await prisma.ordenTrabajo.update({
      where: { id: ordenId },
      data:  { estado: 'ENTREGADO' },
    });
  }

  return pago;
};

// ─── Eliminar pago ────────────────────────────────────────────────
export const remove = async (id) => {
  const pago = await prisma.pago.findUnique({ where: { id } });
  if (!pago) throw Object.assign(new Error('Pago no encontrado'), { status: 404 });
  return prisma.pago.delete({ where: { id } });
};