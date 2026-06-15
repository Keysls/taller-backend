import * as svc from '../services/pago.service.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';

export const getAll = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await svc.getAll({ page: +page || 1, limit: +limit || 20 });
    sendPaginated(res, result.data, { total: result.total, page: result.page, limit: result.limit });
  } catch(e) { next(e); }
};

export const getOrdenesPendientes = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await svc.getOrdenesPendientes({ page: +page || 1, limit: +limit || 20 });
    sendPaginated(res, result.data, { total: result.total, page: result.page, limit: result.limit });
  } catch(e) { next(e); }
};

export const getByOrden = async (req, res, next) => {
  try { sendSuccess(res, await svc.getByOrden(req.params.ordenId)); } catch(e) { next(e); }
};

export const create = async (req, res, next) => {
  try { sendSuccess(res, await svc.create(req.params.ordenId, req.body), 'Pago registrado', 201); } catch(e) { next(e); }
};

export const remove = async (req, res, next) => {
  try { sendSuccess(res, await svc.remove(req.params.id)); } catch(e) { next(e); }
};