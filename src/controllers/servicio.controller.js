import * as svc from '../services/servicio.service.js';
import { sendSuccess } from '../utils/response.js';

export const getAll = async (req, res, next) => {
  try { sendSuccess(res, await svc.getAll()); } catch (err) { next(err); }
};
export const create = async (req, res, next) => {
  try { sendSuccess(res, await svc.create(req.body), 'Servicio creado', 201); } catch (err) { next(err); }
};
export const update = async (req, res, next) => {
  try { sendSuccess(res, await svc.update(req.params.id, req.body)); } catch (err) { next(err); }
};
export const remove = async (req, res, next) => {
  try { sendSuccess(res, await svc.remove(req.params.id)); } catch (err) { next(err); }
};
