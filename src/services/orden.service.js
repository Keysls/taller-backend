import prisma from '../config/database.js';
import { generarNumeroOrden } from '../utils/generateNumero.js';

const include = {
  vehiculo: { include: { cliente: true } },
  mecanico: true,
  servicios: { include: { servicio: true } },
  repuestos: { include: { repuesto: true } },
  pagos: true,
  cotizacion: true,
};

export const getAll = async ({ estado, page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const where = estado ? { estado } : {};
  const [data, total] = await Promise.all([
    prisma.ordenTrabajo.findMany({ where, skip, take: limit, include, orderBy: { fecha: 'desc' } }),
    prisma.ordenTrabajo.count({ where }),
  ]);
  return { data, total, page, limit };
};

export const getById = async (id) => {
  const orden = await prisma.ordenTrabajo.findUnique({ where: { id }, include });
  if (!orden) throw Object.assign(new Error('Orden no encontrada'), { status: 404 });
  return orden;
};

export const create = async (data) => {
  const numeroOrden = await generarNumeroOrden();
  const {
    clienteId, facturarA, direccion, dniRuc, correo,
    telefono, contacto, telefono2, asesor,
    vehiculoId, placa, marca, modelo, anio, color, motor, chasis, km2, km1, tipoOrden,
    mecanicoId, metodoPago, diagnostico, observaciones, nota1, nota2, prioridad,
    servicios = [], repuestos = [],
  } = data;

  const descPctSvc     = Number(data.descuentoSvc || 0);
  const descPctRep     = Number(data.descuentoRep || 0);
  const subSvc         = servicios.reduce((s, i) => s + Number(i.precio || 0), 0);
  const subRep         = repuestos.reduce((s, i) => s + Number(i.subtotal || 0), 0);
  const totalServicios = Math.max(0, subSvc * (1 - descPctSvc / 100));
  const totalRepuestos = Math.max(0, subRep * (1 - descPctRep / 100));
  const totalGeneral   = totalServicios + totalRepuestos;

  const orden = await prisma.ordenTrabajo.create({
    data: {
      numeroOrden,
      clienteId:    clienteId    || null,
      facturarA:    facturarA    || null,
      direccion:    direccion    || null,
      dniRuc:       dniRuc       || null,
      correo:       correo       || null,
      telefono:     telefono     || null,
      contacto:     contacto     || null,
      telefono2:    telefono2    || null,
      asesor:       asesor       || null,
      vehiculoId:   vehiculoId   || null,
      placa:        placa        || null,
      marca:        marca        || null,
      modelo:       modelo       || null,
      anio:         anio         ? parseInt(anio)  : null,
      color:        color        || null,
      motor:        motor        || null,
      chasis:       chasis       || null,
      km2:          km2          ? parseInt(km2)   : null,
      km1:          km1          ? parseInt(km1)   : null,
      tipoOrden:    tipoOrden    || null,
      mecanicoId:   mecanicoId   || null,
      metodoPago:   metodoPago   || null,
      diagnostico:  diagnostico  || null,
      observaciones:observaciones|| null,
      nota1:        nota1        || null,
      nota2:        nota2        || null,
      prioridad:    prioridad    || 'NORMAL',
      descuentoSvc: descPctSvc,
      descuentoRep: descPctRep,
      totalServicios,
      totalRepuestos,
      totalGeneral,
    },
    include,
  });

  for (const svc of servicios) {
    await prisma.ordenServicio.create({
      data: {
        ordenId:    orden.id,
        servicioId: svc.servicioId || null,
        tipo:       svc.tipo       || 'servicio',
        precio:     Number(svc.precio),
        descripcion:svc.descripcion || null,
      }
    });
  }

  for (const rep of repuestos) {
    if (!rep.repuestoId) continue;
    const repuesto = await prisma.repuesto.findUnique({ where: { id: rep.repuestoId } });
    if (!repuesto) continue;
    await prisma.ordenRepuesto.create({
      data: {
        ordenId:    orden.id,
        repuestoId: rep.repuestoId,
        cantidad:   Number(rep.cantidad),
        precioUnit: Number(rep.precioUnit),
        subtotal:   Number(rep.subtotal),
      }
    });
  }

  return prisma.ordenTrabajo.findUnique({ where: { id: orden.id }, include });
};

export const cambiarEstado = async (id, estado) =>
  prisma.ordenTrabajo.update({ where: { id }, data: { estado }, include });

export const agregarServicio = async (ordenId, { servicioId, precio, descripcion }) => {
  await prisma.ordenServicio.create({ data: { ordenId, servicioId, precio, descripcion } });
  return recalcularTotales(ordenId);
};

export const agregarRepuesto = async (ordenId, { repuestoId, cantidad, precioUnit }) => {
  const subtotal = Number(cantidad) * Number(precioUnit);
  const repuesto = await prisma.repuesto.findUnique({ where: { id: repuestoId } });
  if (!repuesto || repuesto.stock < cantidad) {
    throw Object.assign(new Error('Stock insuficiente'), { status: 400 });
  }
  await prisma.$transaction([
    prisma.ordenRepuesto.create({ data: { ordenId, repuestoId, cantidad, precioUnit, subtotal } }),
    prisma.repuesto.update({ where: { id: repuestoId }, data: { stock: { decrement: cantidad } } }),
  ]);
  return recalcularTotales(ordenId);
};

const recalcularTotales = async (ordenId) => {
  const [servicios, repuestos] = await Promise.all([
    prisma.ordenServicio.aggregate({ where: { ordenId }, _sum: { precio: true } }),
    prisma.ordenRepuesto.aggregate({ where: { ordenId }, _sum: { subtotal: true } }),
  ]);
  const totalServicios = Number(servicios._sum.precio || 0);
  const totalRepuestos = Number(repuestos._sum.subtotal || 0);
  const totalGeneral = totalServicios + totalRepuestos;
  return prisma.ordenTrabajo.update({ where: { id: ordenId }, data: { totalServicios, totalRepuestos, totalGeneral }, include });
};

export const update = async (id, data) => {
  const { mecanicoId, diagnostico, observaciones, prioridad } = data;
  return prisma.ordenTrabajo.update({
    where: { id },
    data: {
      ...(mecanicoId    !== undefined && { mecanicoId: mecanicoId || null }),
      ...(diagnostico   !== undefined && { diagnostico }),
      ...(observaciones !== undefined && { observaciones }),
      ...(prioridad     !== undefined && { prioridad }),
    },
    include,
  });
};

export const updateCompleto = async (id, data) => {
  const {
    clienteId, facturarA, direccion, dniRuc, correo,
    telefono, contacto, telefono2, asesor,
    vehiculoId, placa, marca, modelo, anio, color, motor, chasis, km2, km1, tipoOrden,
    mecanicoId, metodoPago, diagnostico, observaciones, nota1, nota2, prioridad,
    servicios = [], repuestos = [],
  } = data;

  const descPctSvc     = Number(data.descuentoSvc || 0);
  const descPctRep     = Number(data.descuentoRep || 0);
  const subSvc         = servicios.reduce((s, i) => s + Number(i.precio || 0), 0);
  const subRep         = repuestos.reduce((s, i) => s + Number(i.subtotal || 0), 0);
  const totalServicios = Math.max(0, subSvc * (1 - descPctSvc / 100));
  const totalRepuestos = Math.max(0, subRep * (1 - descPctRep / 100));
  const totalGeneral   = totalServicios + totalRepuestos;

  await prisma.ordenTrabajo.update({
    where: { id },
    data: {
      clienteId:    clienteId    || null,
      facturarA:    facturarA    || null,
      direccion:    direccion    || null,
      dniRuc:       dniRuc       || null,
      correo:       correo       || null,
      telefono:     telefono     || null,
      contacto:     contacto     || null,
      telefono2:    telefono2    || null,
      asesor:       asesor       || null,
      vehiculoId:   vehiculoId   || null,
      placa:        placa        || null,
      marca:        marca        || null,
      modelo:       modelo       || null,
      anio:         anio         ? parseInt(anio)  : null,
      color:        color        || null,
      motor:        motor        || null,
      chasis:       chasis       || null,
      km2:          km2          ? parseInt(km2)   : null,
      km1:          km1          ? parseInt(km1)   : null,
      tipoOrden:    tipoOrden    || null,
      mecanicoId:   mecanicoId   || null,
      metodoPago:   metodoPago   || null,
      diagnostico:  diagnostico  || null,
      observaciones:observaciones|| null,
      nota1:        nota1        || null,
      nota2:        nota2        || null,
      prioridad:    prioridad    || 'NORMAL',
      descuentoSvc: descPctSvc,
      descuentoRep: descPctRep,
      totalServicios,
      totalRepuestos,
      totalGeneral,
    },
  });

  await prisma.ordenServicio.deleteMany({ where: { ordenId: id } });
  await prisma.ordenRepuesto.deleteMany({ where: { ordenId: id } });

  for (const svc of servicios) {
    await prisma.ordenServicio.create({
      data: {
        ordenId:    id,
        servicioId: svc.servicioId || null,
        tipo:       svc.tipo       || 'servicio',
        precio:     Number(svc.precio),
        descripcion:svc.descripcion || null,
      }
    });
  }

  for (const rep of repuestos) {
    if (!rep.repuestoId) continue;
    await prisma.ordenRepuesto.create({
      data: {
        ordenId:    id,
        repuestoId: rep.repuestoId,
        cantidad:   Number(rep.cantidad),
        precioUnit: Number(rep.precioUnit),
        subtotal:   Number(rep.subtotal),
      }
    });
  }

  return prisma.ordenTrabajo.findUnique({ where: { id }, include });
};