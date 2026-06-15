import * as svc from '../services/servicioTercero.service.js';
import { sendSuccess } from '../utils/response.js';
 
export const getAll = async (req, res, next) => { try { sendSuccess(res, await svc.getAll()); } catch(e) { next(e); } };
export const create = async (req, res, next) => { try { sendSuccess(res, await svc.create(req.body), 'Creado', 201); } catch(e) { next(e); } };
export const update = async (req, res, next) => { try { sendSuccess(res, await svc.update(req.params.id, req.body)); } catch(e) { next(e); } };
export const remove = async (req, res, next) => { try { sendSuccess(res, await svc.remove(req.params.id)); } catch(e) { next(e); } };