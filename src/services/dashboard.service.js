import prisma from '../config/database.js';

// ─── KPIs ─────────────────────────────────────────────────────────
export const getKPIs = async () => {
  const ahora   = new Date();
  const hoyIni  = new Date(ahora); hoyIni.setHours(0, 0, 0, 0);
  const hoyFin  = new Date(ahora); hoyFin.setHours(23, 59, 59, 999);
  const semIni  = new Date(ahora); semIni.setDate(ahora.getDate() - 7);
  const mesIni  = new Date(ahora); mesIni.setDate(1); mesIni.setHours(0, 0, 0, 0);

  const [ventasHoy, ventasSemana, ventasTotal, ordenesAbiertas, ordenesEnProceso, ordenesTerminadas, stockBajo, mecanicosActivos] = await Promise.all([
    // Ingreso diario: suma totalGeneral de OTs creadas hoy
    prisma.ordenTrabajo.aggregate({ where: { creadoEn: { gte: hoyIni, lte: hoyFin } }, _sum: { totalGeneral: true } }),
    // Ingresos semanales: suma totalGeneral de OTs creadas en los últimos 7 días
    prisma.ordenTrabajo.aggregate({ where: { creadoEn: { gte: semIni } }, _sum: { totalGeneral: true } }),
    // Ingresos totales: suma totalGeneral de TODAS las OTs
    prisma.ordenTrabajo.aggregate({ _sum: { totalGeneral: true } }),
    prisma.ordenTrabajo.count({ where: { estado: 'PENDIENTE' } }),
    prisma.ordenTrabajo.count({ where: { estado: 'EN_REPARACION' } }),
    prisma.ordenTrabajo.count({ where: { estado: 'TERMINADO' } }),
    prisma.repuesto.count({ where: { activo: true, stock: { lte: 5 } } }),
    prisma.mecanico.count({ where: { estado: 'DISPONIBLE', activo: true } }),
  ]);

  return {
    ventasHoy:        Number(ventasHoy._sum.totalGeneral    || 0),
    ventasSemana:     Number(ventasSemana._sum.totalGeneral || 0),
    ventasMes:        Number(ventasTotal._sum.totalGeneral  || 0),
    ordenesAbiertas,
    ordenesEnProceso,
    ordenesTerminadas,
    stockBajo,
    mecanicosActivos,
  };
};

// ─── Analítica (ingresos agrupados) ──────────────────────────────
export const getAnalitica = async (periodo = '3d') => {
  const ahora = new Date();
  const resultado = [];

  if (periodo === '3d' || periodo === '7d' || periodo === '30d') {
    // Agrupar por DÍA
    const dias = periodo === '3d' ? 3 : periodo === '7d' ? 7 : 30;
    for (let i = dias - 1; i >= 0; i--) {
      const ini = new Date(ahora); ini.setDate(ahora.getDate() - i); ini.setHours(0,0,0,0);
      const fin = new Date(ahora); fin.setDate(ahora.getDate() - i); fin.setHours(23,59,59,999);
      const agg = await prisma.ordenTrabajo.aggregate({ where: { creadoEn: { gte: ini, lte: fin } }, _sum: { totalGeneral: true } });
      const label = ini.toLocaleDateString('es-PE', { day:'2-digit', month:'2-digit' });
      resultado.push({ label, monto: Number(agg._sum.totalGeneral || 0) });
    }
  } else if (periodo === '6m') {
    // Agrupar por SEMANA (últimas 26 semanas)
    for (let i = 25; i >= 0; i--) {
      const ini = new Date(ahora); ini.setDate(ahora.getDate() - i * 7 - 6); ini.setHours(0,0,0,0);
      const fin = new Date(ahora); fin.setDate(ahora.getDate() - i * 7);     fin.setHours(23,59,59,999);
      const agg = await prisma.ordenTrabajo.aggregate({ where: { creadoEn: { gte: ini, lte: fin } }, _sum: { totalGeneral: true } });
      const label = `S${26 - i}`;
      resultado.push({ label, monto: Number(agg._sum.totalGeneral || 0) });
    }
  } else if (periodo === '1a') {
    // Agrupar por MES (últimos 12 meses)
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    for (let i = 11; i >= 0; i--) {
      const d   = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const ini = new Date(d.getFullYear(), d.getMonth(), 1);
      const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const agg = await prisma.ordenTrabajo.aggregate({ where: { creadoEn: { gte: ini, lte: fin } }, _sum: { totalGeneral: true } });
      resultado.push({ label: meses[d.getMonth()], monto: Number(agg._sum.totalGeneral || 0) });
    }
  }

  return resultado;
};

// ─── Historial reciente (últimas 5) ───────────────────────────────
export const getHistorial = async () => {
  const ordenes = await prisma.ordenTrabajo.findMany({
    where:   { estado: { in: ['PENDIENTE','TERMINADO', 'ENTREGADO'] } },
    orderBy: { actualizadoEn: 'desc' },
    take:    5,
    include: {
      vehiculo: { include: { cliente: true } },
      mecanico: true,
    },
  });

  return ordenes.map(o => ({
    numeroOrden: o.numeroOrden,
    placa:       o.placa || o.vehiculo?.placa || '—',
    cliente:     o.facturarA || `${o.vehiculo?.cliente?.nombres||''} ${o.vehiculo?.cliente?.apellidos||''}`.trim() || '—',
    tecnico:     o.mecanico?.nombre || '—',
    descripcion: o.diagnostico || o.tipoOrden || '—',
    fecha:       new Date(o.actualizadoEn).toLocaleDateString('es-PE', { day:'2-digit', month:'2-digit', year:'2-digit' }),
    hora:        new Date(o.actualizadoEn).toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' }),
    monto:       Number(o.totalGeneral || 0),
  }));
};