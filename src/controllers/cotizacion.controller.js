import * as svc from '../services/cotizacion.service.js';
import { sendSuccess } from '../utils/response.js';

export const getAll          = async (req, res, next) => { try { sendSuccess(res, await svc.getAll()); }                                      catch(e) { next(e); } };
export const getById         = async (req, res, next) => { try { sendSuccess(res, await svc.getById(req.params.id)); }                         catch(e) { next(e); } };
export const create          = async (req, res, next) => { try { sendSuccess(res, await svc.create(req.body), 'Cotización creada', 201); }     catch(e) { next(e); } };
export const convertirAOrden = async (req, res, next) => { try { sendSuccess(res, await svc.convertirAOrden(req.params.id, req.body)); }       catch(e) { next(e); } };