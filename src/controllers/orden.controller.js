import * as svc from '../services/orden.service.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';

export const getAll = async (req, res, next) => {
  try {
    const { estado, page, limit } = req.query;
    const result = await svc.getAll({ estado, page: +page || 1, limit: +limit || 20 });
    sendPaginated(res, result.data, { total: result.total, page: result.page, limit: result.limit });
  } catch (err) { next(err); }
};
export const getById = async (req, res, next) => {
  try { sendSuccess(res, await svc.getById(req.params.id)); } catch (err) { next(err); }
};
export const create = async (req, res, next) => {
  try { sendSuccess(res, await svc.create(req.body), 'Orden creada', 201); } catch (err) { next(err); }
};
export const cambiarEstado = async (req, res, next) => {
  try { sendSuccess(res, await svc.cambiarEstado(req.params.id, req.body.estado)); } catch (err) { next(err); }
};
export const agregarServicio = async (req, res, next) => {
  try { sendSuccess(res, await svc.agregarServicio(req.params.id, req.body)); } catch (err) { next(err); }
};
export const agregarRepuesto = async (req, res, next) => {
  try { sendSuccess(res, await svc.agregarRepuesto(req.params.id, req.body)); } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const { mecanicoId, diagnostico, observaciones, prioridad } = req.body;
    const orden = await prisma.ordenTrabajo.update({
      where: { id: req.params.id },
      data: { 
        mecanicoId:    mecanicoId    || undefined,
        diagnostico:   diagnostico   ?? undefined,
        observaciones: observaciones ?? undefined,
        prioridad:     prioridad     || undefined,
      },
    });
    sendSuccess(res, orden);
  } catch(e) { next(e); }
};

export const updateCompleto = async (req, res, next) => {
  try {
    const orden = await svc.updateCompleto(req.params.id, req.body);
    sendSuccess(res, orden);
  } catch(e) { next(e); }
};

export const getPDF = async (req, res, next) => {
  try {
    const orden = await svc.getById(req.params.id);
    
    // Mismo HTML que genera el frontend
    const html = generarHTMLOrden(orden);
    
    const chromium  = (await import('@sparticuz/chromium')).default;
    const puppeteer = (await import('puppeteer-core')).default;
    
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: 'new',
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top:'10mm', right:'10mm', bottom:'10mm', left:'10mm' },
      printBackground: true,
    });
    await browser.close();
    
    const nombre = `${orden.numeroOrden}_${orden.placa || 'OT'}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
    res.send(pdf);
  } catch(e) { next(e); }
};