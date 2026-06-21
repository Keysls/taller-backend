import * as svc from '../services/auditoria.service.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';

export const getAll = async (req, res, next) => {
  try {
    const { usuarioId, modulo, accion, desde, hasta, page, limit } = req.query;
    const result = await svc.getAll({
      usuarioId, modulo, accion, desde, hasta,
      page:  +page  || 1,
      limit: +limit || 30,
    });
    sendPaginated(res, result.data, { total: result.total, page: result.page, limit: result.limit });
  } catch (e) { next(e); }
};

export const getById = async (req, res, next) => {
  try { sendSuccess(res, await svc.getById(req.params.id)); } catch (e) { next(e); }
};

export const getModulos = async (req, res, next) => {
  try { sendSuccess(res, await svc.getModulos()); } catch (e) { next(e); }
};