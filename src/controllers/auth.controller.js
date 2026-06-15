import * as authService from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    sendSuccess(res, result, 'Login exitoso');
  } catch (err) { next(err); }
};

export const me = (req, res) => sendSuccess(res, req.user);
