import * as svc from '../services/mecanico.service.js';
import { sendSuccess } from '../utils/response.js';

export const getAll = async (req, res, next) => {
  try { sendSuccess(res, await svc.getAll()); } catch (err) { next(err); }
};
export const create = async (req, res, next) => {
  try { sendSuccess(res, await svc.create(req.body), 'Mecánico creado', 201); } catch (err) { next(err); }
};
export const update = async (req, res, next) => {
  try { sendSuccess(res, await svc.update(req.params.id, req.body)); } catch (err) { next(err); }
};
export const cambiarEstado = async (req, res, next) => {
  try { sendSuccess(res, await svc.cambiarEstado(req.params.id, req.body.estado)); } catch (err) { next(err); }
};
