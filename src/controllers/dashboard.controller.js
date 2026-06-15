import * as svc from '../services/dashboard.service.js';
import { sendSuccess } from '../utils/response.js';

export const getKPIs     = async (req, res, next) => { try { sendSuccess(res, await svc.getKPIs()); }                              catch(e) { next(e); } };
export const getAnalitica = async (req, res, next) => { 
  try { sendSuccess(res, await svc.getAnalitica(req.query.periodo || '7d')); } 
  catch(e) { next(e); } 
};
export const getHistorial= async (req, res, next) => { try { sendSuccess(res, await svc.getHistorial()); }                         catch(e) { next(e); } };