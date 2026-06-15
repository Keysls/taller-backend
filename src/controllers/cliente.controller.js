import * as svc from '../services/cliente.service.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';

export const getAll = async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;
    const result = await svc.getAll({ search, page: +page || 1, limit: +limit || 20 });
    sendPaginated(res, result.data, { total: result.total, page: result.page, limit: result.limit });
  } catch (err) { next(err); }
};
export const getById = async (req, res, next) => {
  try { sendSuccess(res, await svc.getById(req.params.id)); } catch (err) { next(err); }
};
export const create = async (req, res, next) => {
  try { sendSuccess(res, await svc.create(req.body), 'Cliente creado', 201); } catch (err) { next(err); }
};
export const update = async (req, res, next) => {
  try { sendSuccess(res, await svc.update(req.params.id, req.body), 'Cliente actualizado'); } catch (err) { next(err); }
};
export const remove = async (req, res, next) => {
  try { sendSuccess(res, await svc.remove(req.params.id), 'Cliente eliminado'); } catch (err) { next(err); }
};
