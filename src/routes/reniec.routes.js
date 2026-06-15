import { Router } from 'express';
// ❌ Borra esta línea → const response = await fetch(apiUrl);

const router = Router();
const APIS_TOKEN = process.env.APIS_TOKEN;

router.get('/dni/:numero', async (req, res) => {
  try {
    const r = await fetch(`https://api.decolecta.com/v1/reniec/dni?numero=${req.params.numero}`, {
      headers: { Authorization: `Bearer ${process.env.APIS_TOKEN}`, Accept: 'application/json' },
    });
    console.log('Status RENIEC:', r.status);
    const body = await r.json();
    console.log('Body RENIEC:', body);
    if (!r.ok) return res.status(404).json({ message: 'No encontrado' });
    res.json(body);
  } catch (e) {
    console.error('Error:', e);
    res.status(500).json({ message: 'Error al consultar RENIEC' });
  }
});

router.get('/ruc/:numero', async (req, res) => {
  try {
    const r = await fetch(`https://api.decolecta.com/v1/sunat/ruc?numero=${req.params.numero}`, {
      headers: { Authorization: `Bearer ${process.env.APIS_TOKEN}`, Accept: 'application/json' },
    });
    const body = await r.json();
    if (!r.ok) return res.status(404).json({ message: 'No encontrado' });
    res.json(body);
  } catch (e) {
    res.status(500).json({ message: 'Error al consultar SUNAT' });
  }
});


export default router;