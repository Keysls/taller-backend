export const errorMiddleware = (err, req, res, next) => {
  console.error(err);
  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') return res.status(409).json({ ok: false, message: 'Registro duplicado' });
    if (err.code === 'P2025') return res.status(404).json({ ok: false, message: 'Registro no encontrado' });
  }
  res.status(err.status || 500).json({ ok: false, message: err.message || 'Error interno del servidor' });
};
