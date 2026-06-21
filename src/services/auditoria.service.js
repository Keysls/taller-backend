import prisma from '../config/database.js';

/**
 * Registra una entrada de auditoría. Diseñado para nunca tirar la operación
 * principal: si falla el registro de auditoría, solo se loguea en consola.
 *
 * @param {Object} params
 * @param {string} params.usuarioId   - id del usuario que ejecuta la acción (req.user.id)
 * @param {string} params.accion      - 'CREAR' | 'EDITAR' | 'ELIMINAR' | 'CAMBIO_ESTADO' | etc.
 * @param {string} params.modulo      - 'OrdenTrabajo' | 'Cotizacion' | 'Cliente' | 'Repuesto' | ...
 * @param {string} [params.descripcion] - texto legible, ej: "Cambió estado de PENDIENTE a EN_REPARACION"
 * @param {string} [params.ip]        - req.ip
 * @param {Object} [params.metadata]  - JSON libre: { entidadId, antes, despues, ... }
 */
export const registrar = async ({ usuarioId, accion, modulo, descripcion = null, ip = null, metadata = null }) => {
  try {
    if (!usuarioId || !accion || !modulo) {
      console.error('[Auditoria] Parámetros incompletos, no se registró:', { usuarioId, accion, modulo });
      return null;
    }
    return await prisma.auditoria.create({
      data: { usuarioId, accion, modulo, descripcion, ip, metadata: metadata ?? undefined },
    });
  } catch (e) {
    // La auditoría nunca debe romper el flujo principal de negocio.
    console.error('[Auditoria] Error al registrar:', e.message);
    return null;
  }
};

/**
 * Compara dos objetos plano (antes/después) y devuelve solo los campos que
 * cambiaron, listos para guardar en `metadata`. Útil para ediciones (EDITAR).
 *
 * @param {Object} antes   - snapshot previo a la operación
 * @param {Object} despues - snapshot posterior a la operación
 * @param {string[]} [campos] - lista blanca de campos a comparar; si se omite, se usan las claves de `despues`
 */
export const diffCampos = (antes = {}, despues = {}, campos = null) => {
  const claves = campos || Object.keys(despues);
  const cambios = {};
  for (const k of claves) {
    const v1 = antes?.[k] ?? null;
    const v2 = despues?.[k] ?? null;
    // Decimal de Prisma y fechas no son comparables directo con !==, normalizamos a string
    const s1 = v1 instanceof Date ? v1.toISOString() : String(v1);
    const s2 = v2 instanceof Date ? v2.toISOString() : String(v2);
    if (s1 !== s2) cambios[k] = { antes: v1, despues: v2 };
  }
  return cambios;
};

// ── GET ALL con filtros + paginación ──────────────────────────────
export const getAll = async ({ usuarioId, modulo, accion, desde, hasta, page = 1, limit = 30 } = {}) => {
  const skip = (page - 1) * limit;
  const where = {
    ...(usuarioId && { usuarioId }),
    ...(modulo    && { modulo }),
    ...(accion    && { accion }),
    ...((desde || hasta) && {
      fecha: {
        ...(desde && { gte: new Date(desde) }),
        ...(hasta && { lte: new Date(hasta) }),
      },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.auditoria.findMany({
      where,
      skip,
      take: limit,
      orderBy: { fecha: 'desc' },
      include: { usuario: { select: { id: true, nombre: true, email: true, rol: { select: { nombre: true } } } } },
    }),
    prisma.auditoria.count({ where }),
  ]);

  return { data, total, page, limit };
};

// ── GET BY ID ──────────────────────────────────────────────────────
export const getById = (id) =>
  prisma.auditoria.findUnique({
    where: { id },
    include: { usuario: { select: { id: true, nombre: true, email: true, rol: { select: { nombre: true } } } } },
  });

// ── Lista de módulos distintos ya registrados (para poblar el filtro en el frontend) ──
export const getModulos = async () => {
  const rows = await prisma.auditoria.findMany({ distinct: ['modulo'], select: { modulo: true } });
  return rows.map(r => r.modulo).sort();
};