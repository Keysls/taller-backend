export const sendSuccess = (res, data, message = 'OK', status = 200) =>
  res.status(status).json({ ok: true, message, data });

export const sendError = (res, status, message) =>
  res.status(status).json({ ok: false, message });

export const sendPaginated = (res, data, meta) =>
  res.status(200).json({ ok: true, data, meta });
