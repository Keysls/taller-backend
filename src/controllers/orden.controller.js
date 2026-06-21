import * as svc from '../services/orden.service.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';

const getActor = (req) => ({ usuarioId: req.user?.id, ip: req.ip });

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
  try { sendSuccess(res, await svc.create(req.body, getActor(req)), 'Orden creada', 201); } catch (err) { next(err); }
};
export const cambiarEstado = async (req, res, next) => {
  try { sendSuccess(res, await svc.cambiarEstado(req.params.id, req.body.estado, getActor(req))); } catch (err) { next(err); }
};
export const agregarServicio = async (req, res, next) => {
  try { sendSuccess(res, await svc.agregarServicio(req.params.id, req.body, getActor(req))); } catch (err) { next(err); }
};
export const agregarRepuesto = async (req, res, next) => {
  try { sendSuccess(res, await svc.agregarRepuesto(req.params.id, req.body, getActor(req))); } catch (err) { next(err); }
};
export const update = async (req, res, next) => {
  try { sendSuccess(res, await svc.update(req.params.id, req.body, getActor(req))); } catch(e) { next(e); }
};
export const updateCompleto = async (req, res, next) => {
  try {
    const orden = await svc.updateCompleto(req.params.id, req.body, getActor(req));
    sendSuccess(res, orden);
  } catch(e) { next(e); }
};

// ─── Detectar ruta de Chrome según entorno ────────────────────────
const getExecutablePath = async () => {
  if (process.env.NODE_ENV === 'production') {
    const chromium = (await import('@sparticuz/chromium')).default;
    return await chromium.executablePath();
  }
  if (process.platform === 'win32') {
    const paths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      `C:\\Users\\${process.env.USERNAME}\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe`,
    ];
    const { existsSync } = await import('fs');
    for (const p of paths) {
      if (existsSync(p)) return p;
    }
    throw new Error('Chrome no encontrado en Windows');
  }
  if (process.platform === 'darwin') {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  }
  return '/usr/bin/google-chrome';
};

// ─── Leer logo como base64 ────────────────────────────────────────
const getLogoBase64 = async () => {
  try {
    const { readFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const logoPath = join(__dirname, '../public/logo_pdf.png');
    const data = readFileSync(logoPath);
    return `data:image/png;base64,${data.toString('base64')}`;
  } catch (e) {
    console.error('Logo no encontrado:', e.message);
    return '';
  }
};

// ─── Generar y descargar PDF de orden de trabajo ─────────────────
export const getPDF = async (req, res, next) => {
  try {
    const orden = await svc.getById(req.params.id);
    if (!orden) return res.status(404).json({ message: 'Orden de trabajo no encontrada' });

    const html = generarHTMLOrden(orden, await getLogoBase64());
    const puppeteer = (await import('puppeteer-core')).default;
    const chromium  = process.env.NODE_ENV === 'production'
      ? (await import('@sparticuz/chromium')).default
      : null;

    const browser = await puppeteer.launch({
      executablePath: await getExecutablePath(),
      headless:       'new',
      args:           chromium?.args ?? ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format:          'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    });
    await browser.close();

    const placa    = (orden.placa || orden.vehiculo?.placa || 'SIN-PLACA').replace(/[^a-zA-Z0-9]/g, '-');
    const numero   = (orden.numeroOrden || 'OT').replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `${numero}_${placa}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length);
    res.send(pdf);
  } catch(e) { next(e); }
};

// ─── HTML de la orden de trabajo para PDF ────────────────────────
function generarHTMLOrden(ot, logoSrc = '') {
  const fmtS     = n => `S/ ${Number(n||0).toFixed(2)}`;
  const fmtFecha = d => d ? new Date(d).toLocaleDateString('es-PE', { day:'2-digit', month:'2-digit', year:'2-digit' }) : '—';

  const ESTADO_CFG = {
    PENDIENTE:           { bg:'#FFF7ED', color:'#C2410C', label:'Pendiente'      },
    DIAGNOSTICANDO:      { bg:'#EFF6FF', color:'#1D4ED8', label:'Diagnosticando' },
    EN_REPARACION:       { bg:'#FFFBEB', color:'#B45309', label:'En reparación'  },
    ESPERANDO_REPUESTOS: { bg:'#FDF4FF', color:'#7C3AED', label:'Esp. repuestos' },
    TERMINADO:           { bg:'#F0FDF4', color:'#15803D', label:'Terminado'      },
    ENTREGADO:           { bg:'#ECFDF5', color:'#047857', label:'Entregado'      },
    CANCELADO:           { bg:'#FEF2F2', color:'#DC2626', label:'Cancelado'      },
  };
  const est = ESTADO_CFG[ot?.estado] || ESTADO_CFG.PENDIENTE;

  const serviciosItems = ot?.servicios || [];
  const repuestosItems = ot?.repuestos || [];
  const descPctSvc = Number(ot?.descuentoSvc || 0);
  const descPctRep = Number(ot?.descuentoRep || 0);
  const subSvc   = serviciosItems.reduce((s,i) => s + Number(i.precio||0), 0);
  const subRep   = repuestosItems.reduce((s,i) => s + Number(i.subtotal||0), 0);
  const totalSvc = Math.max(0, subSvc * (1 - descPctSvc / 100));
  const totalRep = Math.max(0, subRep * (1 - descPctRep / 100));

  const tablaSeccion = (titulo, items, subtotalCalc, descPct, cols) => {
    if (!items || items.length === 0) return '';
    const filas = items.map((item, idx) => {
      if (cols === 'svc') {
        return `<tr>
          <td class="center" style="color:#64748b">${idx+1}</td>
          <td>${item.servicio?.nombre || item.descripcion || ''}</td>
          <td class="right">${fmtS(item.precio)}</td>
          <td class="center">1</td>
          <td class="right">${fmtS(item.precio)}</td>
        </tr>`;
      }
      const pu  = Number(item.precioUnit || 0);
      const sub = Number(item.subtotal || 0);
      return `<tr>
        <td class="center" style="color:#64748b">${idx+1}</td>
        <td>${item.repuesto?.nombre || item.descripcion || ''}</td>
        <td class="right">${fmtS(pu)}</td>
        <td class="center">${item.cantidad||1}</td>
        <td class="right">${fmtS(sub)}</td>
      </tr>`;
    }).join('');
    return `
      <div class="section-block">
        <table class="cotiz-table">
          <thead><tr>
            <th class="center" style="width:5%">Nº</th>
            <th style="width:47%">${titulo}</th>
            <th class="right" style="width:18%">Precio unit</th>
            <th class="center" style="width:10%">Cantidad</th>
            <th class="right" style="width:20%">Precio</th>
          </tr></thead>
          <tbody>${filas}</tbody>
        </table>
        <div class="section-footer">
          <div class="section-footer-inner">
            <div class="sf-igv">Precio en soles incluido I.G.V.</div>
            <div class="sf-desc">${descPct > 0 ? `Descuento: ${descPct}%` : ''}</div>
            <div class="sf-lbl">Total</div>
            <div class="sf-val">${fmtS(subtotalCalc)}</div>
          </div>
        </div>
      </div>`;
  };

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>OT ${ot?.numeroOrden||''}</title>
<style>
  @page { size: A4; margin: 10mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; margin:0; padding:0; font-size:11px; }
  table { width:100%; border-collapse:collapse; }
  .header-table { margin-bottom:14px; }
  .header-info  { width:40%; vertical-align:top; padding-left:10px; font-size:10px; line-height:1.6; }
  .header-title-cell { width:30%; vertical-align:top; text-align:right; }
  .header-title { font-size:30px; font-weight:bold; line-height:1; }
  .header-code  { font-size:12px; color:#64748b; margin-top:2px; }
  .header-badge { margin-top:6px; display:inline-block; padding:3px 12px; border-radius:20px; font-size:10px; font-weight:bold; }
  .datos-table  { margin-bottom:10px; font-size:11px; }
  .datos-section-label { font-size:10px; font-weight:bold; color:#64748b; text-transform:uppercase; letter-spacing:.05em; margin-bottom:5px; }
  .datos-row { display:table; width:100%; margin-bottom:2px; }
  .datos-label { display:table-cell; color:#64748b; width:90px; }
  .datos-value { display:table-cell; font-weight:500; }
  .section-block { margin-bottom:14px; }
  .cotiz-table { font-size:11px; }
  .cotiz-table thead tr { background:#f1f5f9; }
  .cotiz-table thead th { padding:6px 8px; text-align:left; font-weight:normal; color:#64748b; font-size:10px; border-bottom:1px solid #e2e8f0; }
  .cotiz-table thead th.right { text-align:right; }
  .cotiz-table thead th.center { text-align:center; }
  .cotiz-table tbody td { padding:4px 8px; border-bottom:1px solid #f1f5f9; }
  .cotiz-table tbody td.right { text-align:right; }
  .cotiz-table tbody td.center { text-align:center; }
  .section-footer { background:#f8fafc; border:1px solid #e2e8f0; border-top:none; }
  .section-footer-inner { display:table; width:100%; }
  .sf-igv  { display:table-cell; padding:7px 10px; font-size:10px; font-weight:bold; text-transform:uppercase; width:40%; vertical-align:middle; }
  .sf-desc { display:table-cell; padding:7px 8px; font-size:10px; color:#64748b; text-align:right; width:40%; vertical-align:middle; }
  .sf-lbl  { display:table-cell; padding:7px 6px; font-weight:bold; text-align:right; font-size:12px; width:10%; vertical-align:middle; }
  .sf-val  { display:table-cell; padding:7px 10px; font-weight:bold; text-align:right; font-size:12px; width:10%; vertical-align:middle; }
  .bottom-notes-cell { vertical-align:top; width:60%; padding-right:16px; }
  .bottom-total-cell { vertical-align:top; width:40%; text-align:right; }
  .nota-label { font-size:10px; font-weight:bold; margin-bottom:3px; text-transform:uppercase; }
  .nota-box   { border:1px solid #cbd5e1; min-height:36px; padding:6px 8px; font-size:10px; color:#475569; margin-bottom:10px; }
  .total-final-box    { display:inline-block; border:1px solid #cbd5e1; padding:14px 20px; text-align:right; min-width:170px; }
  .total-final-label  { font-size:11px; font-weight:bold; color:#94a3b8; text-transform:uppercase; letter-spacing:.1em; margin-bottom:4px; }
  .total-final-amount { font-size:32px; font-weight:bold; line-height:1.1; }
  .total-final-igv    { font-size:10px; color:#64748b; font-style:italic; margin-top:4px; }
  .doc-footer { margin-top:16px; font-size:10px; color:#94a3b8; line-height:1.6; }
  .doc-footer strong { color:#64748b; }
</style>
</head>
<body>

<table class="header-table"><tr>
  <td style="width:30%;vertical-align:top">
    ${logoSrc ? `<img src="${logoSrc}" style="width:120px;height:auto;object-fit:contain"/>` : ''}
  </td>
  <td class="header-info">
    <div style="font-weight:bold;font-size:11px;">R.U.C.: 10462333221</div>
    <div>BBVA: 0011-0814-0210100186</div>
    <div>BCP: 570-02689923-0-47</div>
    <div style="font-size:10px;">Av. Metropolitana II Mz.H - Lte.05 - Las Orquideas - San Isidro</div>
  </td>
  <td class="header-title-cell">
    <div class="header-title">Orden de Trabajo</div>
    <div class="header-code">${ot?.numeroOrden||''}</div>
    <div style="font-size:10px;color:#94a3b8;margin-top:4px">${fmtFecha(ot?.fecha||ot?.creadoEn)}</div>
    <div class="header-badge" style="background:${est.bg};color:${est.color};">${est.label}</div>
  </td>
</tr></table>

<table class="datos-table"><tr>
  <td width="50%" style="vertical-align:top;padding-right:20px">
    <div class="datos-section-label">Datos del Cliente</div>
    <div class="datos-row"><div class="datos-label">Propietario:</div><div class="datos-value">${ot?.facturarA || ((ot?.vehiculo?.cliente?.nombres||'') + ' ' + (ot?.vehiculo?.cliente?.apellidos||''))}</div></div>
    <div class="datos-row"><div class="datos-label">DNI/RUC</div><div class="datos-value">${ot?.dniRuc || ot?.vehiculo?.cliente?.dniRuc || '—'}</div></div>
    <div class="datos-row"><div class="datos-label">Teléfono</div><div class="datos-value">${ot?.telefono || ot?.vehiculo?.cliente?.telefono || '—'}</div></div>
    <div class="datos-row"><div class="datos-label">Técnico</div><div class="datos-value">${ot?.mecanico?.nombre || '—'}</div></div>
    <div class="datos-row"><div class="datos-label">Método pago</div><div class="datos-value">${ot?.metodoPago || '—'}</div></div>
  </td>
  <td width="50%" style="vertical-align:top;padding-left:20px">
    <div class="datos-section-label">Datos del Vehículo</div>
    <div class="datos-row"><div class="datos-label">Placa</div><div class="datos-value">${ot?.placa || ot?.vehiculo?.placa || '—'}</div></div>
    <div class="datos-row"><div class="datos-label">Marca</div><div class="datos-value">${ot?.marca || ot?.vehiculo?.marca || '—'}</div></div>
    <div class="datos-row"><div class="datos-label">Modelo</div><div class="datos-value">${ot?.modelo || ot?.vehiculo?.modelo || '—'}</div></div>
    <div class="datos-row"><div class="datos-label">Motor</div><div class="datos-value">${ot?.motor || '—'}</div></div>
    <div class="datos-row"><div class="datos-label">Km</div><div class="datos-value">${ot?.km2 ? Number(ot.km2).toLocaleString() : (ot?.vehiculo?.kilometraje?.toLocaleString() || '—')}</div></div>
  </td>
</tr></table>

${ot?.tipoOrden ? `<div style="font-size:11px;margin-bottom:10px">Servicio Aplicado: <strong>${ot.tipoOrden}</strong></div>` : ''}

${tablaSeccion('Servicios', serviciosItems, totalSvc, descPctSvc, 'svc')}
${tablaSeccion('Repuestos / Insumos', repuestosItems, totalRep, descPctRep, 'rep')}

<table style="margin-top:18px"><tr>
  <td class="bottom-notes-cell">
    <div class="nota-label">Diagnóstico</div>
    <div class="nota-box">${ot?.diagnostico || ''}</div>
    <div class="nota-label" style="margin-top:8px">Observaciones</div>
    <div class="nota-box">${ot?.observaciones || ot?.nota2 || ''}</div>
  </td>
  <td class="bottom-total-cell">
    <div class="total-final-box">
      <div class="total-final-label">Total</div>
      <div class="total-final-amount">S/ ${Number(ot?.totalGeneral||0).toFixed(2)}</div>
      <div class="total-final-igv">INCLUYE IGV*</div>
    </div>
  </td>
</tr></table>

<div class="doc-footer">
  <strong>Términos aplicables*</strong><br/><br/>
  - Garantía de 30 días en mano de obra.<br/>
  - Garantía de repuestos según fabricante.<br/>
  - Revisión incluida en el precio.
</div>

</body></html>`;
}