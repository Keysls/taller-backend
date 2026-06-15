import * as svc from '../services/usuario.service.js';
import { sendSuccess } from '../utils/response.js';

export const getAll   = async (req, res, next) => { try { sendSuccess(res, await svc.getAll()); } catch(e) { next(e); } };
export const create   = async (req, res, next) => { try { sendSuccess(res, await svc.create(req.body), 'Usuario creado', 201); } catch(e) { next(e); } };
export const update   = async (req, res, next) => { try { sendSuccess(res, await svc.update(req.params.id, req.body)); } catch(e) { next(e); } };
export const toggleActivo = async (req, res, next) => { try { sendSuccess(res, await svc.toggleActivo(req.params.id, req.body.activo)); } catch(e) { next(e); } };
export const cambiarPassword = async (req, res, next) => { try { sendSuccess(res, await svc.cambiarPassword(req.params.id, req.body.password)); } catch(e) { next(e); } };