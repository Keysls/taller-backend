import prisma from '../config/database.js';

// genera COT-00001, COT-00002, etc.
async function generarNumeroCot() {
  const last = await prisma.cotizacion.findFirst({ orderBy: { creadoEn: 'desc' }, select: { numeroCot: true } });
  const n = last ? parseInt(last.numeroCot.replace('COT-', '')) + 1 : 1;
  return `COT-${String(n).padStart(5, '0')}`;
}

const include = {
  cliente:  true,
  vehiculo: true,
  mecanico: true,
  items: { include: { servicio: true, repuesto: true } },
};

// ── GET ALL ──────────────────────────────────────────────────────
export const getAll = () =>
  prisma.cotizacion.findMany({ include, orderBy: { creadoEn: 'desc' } });

// ── GET BY ID ────────────────────────────────────────────────────
export const getById = (id) =>
  prisma.cotizacion.findUnique({ where: { id }, include });

// ── CREATE ───────────────────────────────────────────────────────
export const create = async (data) => {
  const numeroCot = await generarNumeroCot();
  const {
    // Cliente
    clienteId, facturarA, direccion, dniRuc, correo,
    telefono, contacto, telefono2, asesor,
    // Orden
    metodoPago, fechaApertura, km1,
    // Vehículo
    vehiculoId, placa, marca, modelo, anio, color,
    motor, chasis, km2, tipoOrden,
    // Técnico
    mecanicoId,
    // Notas
    nota1, nota2,
    // Items y totales
    items = [], descuentoSvc = 0, descuentoRep = 0, total = 0,
  } = data;

  return prisma.cotizacion.create({
    data: {
      numeroCot,
      // Cliente
      clienteId:    clienteId    || null,
      facturarA:    facturarA    || null,
      direccion:    direccion    || null,
      dniRuc:       dniRuc       || null,
      correo:       correo       || null,
      telefono:     telefono     || null,
      contacto:     contacto     || null,
      telefono2:    telefono2    || null,
      asesor:       asesor       || null,
      // Orden
      metodoPago:   metodoPago   || null,
      fechaApertura: new Date(),
      km1:          km1 ? parseInt(km1) : null,
      // Vehículo
      vehiculoId:   vehiculoId   || null,
      placa:        placa        || null,
      marca:        marca        || null,
      modelo:       modelo       || null,
      anio:         anio ? parseInt(anio) : null,
      color:        color        || null,
      motor:        motor        || null,
      chasis:       chasis       || null,
      km2:          km2 ? parseInt(km2) : null,
      tipoOrden:    tipoOrden    || null,
      // Técnico
      mecanicoId:   mecanicoId   || null,
      // Notas
      nota1:        nota1        || null,
      nota2:        nota2        || null,
      // Totales
      descuentoSvc: parseFloat(descuentoSvc) || 0,
      descuentoRep: parseFloat(descuentoRep) || 0,
      total:        parseFloat(total)        || 0,
      // Items
      items: {
        create: items.map(i => ({
          tipo:        i.tipo,
          descripcion: i.descripcion,
          cantidad:    parseInt(i.cantidad)    || 1,
          precioUnit:  parseFloat(i.precioUnit)|| 0,
          subtotal:    parseFloat(i.subtotal)  || 0,
          servicioId:  i.tipo === 'servicio' ? (i.refId || null) : null,
          repuestoId:  i.tipo === 'repuesto' ? (i.refId || null) : null,
        })),
      },
    },
    include,
  });
};

// ── CONVERTIR A OT ───────────────────────────────────────────────
export const convertirAOrden = async (id, { mecanicoId, diagnostico, observaciones }) => {
  const cot = await prisma.cotizacion.findUnique({ where: { id }, include });
  if (!cot) throw Object.assign(new Error('Cotización no encontrada'), { status: 404 });

  const count = await prisma.ordenTrabajo.count();
  const year  = new Date().getFullYear();
  const numeroOrden = `OT-${year}-${String(count + 1).padStart(5, '0')}`;

  return prisma.$transaction(async (tx) => {
    const o = await tx.ordenTrabajo.create({
      data: {
        numeroOrden,
        vehiculoId:    cot.vehiculoId   || null,
        mecanicoId:    mecanicoId       || cot.mecanicoId || null,
        diagnostico:   diagnostico      || '',
        observaciones: observaciones    || '',
        totalGeneral:  cot.total,
        cotizacionId:  cot.id,
      },
    });
    await tx.cotizacion.update({ where: { id }, data: { estado: 'APROBADA' } });
    return o;
  });
};