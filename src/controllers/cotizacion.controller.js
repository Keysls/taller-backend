import * as svc from '../services/cotizacion.service.js';
import { sendSuccess } from '../utils/response.js';

export const getAll          = async (req, res, next) => { try { sendSuccess(res, await svc.getAll()); }                                      catch(e) { next(e); } };
export const getById         = async (req, res, next) => { try { sendSuccess(res, await svc.getById(req.params.id)); }                         catch(e) { next(e); } };
export const create          = async (req, res, next) => { try { sendSuccess(res, await svc.create(req.body), 'Cotización creada', 201); }     catch(e) { next(e); } };
export const convertirAOrden = async (req, res, next) => { try { sendSuccess(res, await svc.convertirAOrden(req.params.id, req.body)); }       catch(e) { next(e); } };

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
    const logoPath = join(__dirname, '../public/logo_pdf.png');  // ← esta línea
    const data = readFileSync(logoPath);
    return `data:image/png;base64,${data.toString('base64')}`;
  } catch (e) {
    console.error('Logo no encontrado:', e.message);
    return '';
  }
};

// ─── Generar y descargar PDF de cotización ────────────────────────
export const getPDF = async (req, res, next) => {
  try {
    const cot = await svc.getById(req.params.id);
    if (!cot) return res.status(404).json({ message: 'Cotización no encontrada' });

    const html = generarHTMLCotizacion(cot, await getLogoBase64());
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

    const placa    = (cot.placa || cot.vehiculo?.placa || 'SIN-PLACA').replace(/[^a-zA-Z0-9]/g, '-');
    const numero   = (cot.numeroCot || 'COT').replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `${numero}_${placa}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length);
    res.send(pdf);
  } catch(e) { next(e); }
};

// ─── HTML de la cotización para PDF ──────────────────────────────
function generarHTMLCotizacion(cot, logoSrc = '') {
  const fmtS     = n => `S/ ${Number(n||0).toFixed(2)}`;
  const fmtFecha = d => d ? new Date(d).toLocaleDateString('es-PE', { day:'2-digit', month:'2-digit', year:'2-digit' }) : '—';

  const items       = cot.items || [];
  const servicios   = items.filter(i => i.tipo === 'servicio');
  const terceros    = items.filter(i => i.tipo === 'tercero');
  const repuestos   = items.filter(i => i.tipo === 'repuesto');

  const totalSvc = servicios.reduce((s,i) => s + Number(i.precioUnit||0), 0);
  const totalTer = terceros.reduce((s,i)  => s + Number(i.precioUnit||0), 0);
  const totalRep = repuestos.reduce((s,i) => s + Number(i.subtotal||i.precioUnit||0), 0);
  const descPctSvc = Number(cot.descuentoSvc || 0);
  const descPctRep = Number(cot.descuentoRep || 0);

  const tablaSeccion = (titulo, items, subtotal, descPct = 0) => {
    if (!items || items.length === 0) return '';
    const totalConDesc = Math.max(0, subtotal * (1 - descPct / 100));
    const filas = items.map((item, idx) => {
      const cant = item.cantidad || 1;
      const pu   = Number(item.precioUnit || 0);
      const sub  = Number(item.subtotal || item.precioUnit || 0);
      return `<tr>
        <td class="center" style="color:#64748b">${idx+1}</td>
        <td>${item.descripcion||''}</td>
        <td class="right">S/${pu.toFixed(2)}</td>
        <td class="center">${cant}</td>
        <td class="right">S/${sub.toFixed(2)}</td>
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
            <div class="sf-val">S/${totalConDesc.toFixed(2)}</div>
          </div>
        </div>
      </div>`;
  };

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 10mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; margin:0; padding:0; font-size:11px; }
  table { width:100%; border-collapse:collapse; }
  .header-table { margin-bottom:14px; }
  .header-info { width:40%; vertical-align:top; padding-left:10px; font-size:10px; line-height:1.6; }
  .header-title-cell { width:30%; vertical-align:top; text-align:right; }
  .header-title { font-size:30px; font-weight:bold; line-height:1; }
  .header-code  { font-size:12px; color:#64748b; margin-top:2px; }
  .datos-table  { margin-bottom:10px; font-size:11px; }
  .datos-section-label { font-size:10px; font-weight:bold; color:#64748b; text-transform:uppercase; letter-spacing:.05em; margin-bottom:5px; }
  .datos-row { display:table; width:100%; margin-bottom:2px; }
  .datos-label { display:table-cell; color:#64748b; width:85px; }
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
    <div class="header-title">Cotización</div>
    <div class="header-code">${cot.numeroCot||''}</div>
  </td>
</tr></table>

<table class="datos-table"><tr>
  <td width="50%" style="vertical-align:top;padding-right:20px">
    <div class="datos-section-label">Datos de Cliente</div>
    <div class="datos-row"><div class="datos-label">Propietario:</div><div class="datos-value">${cot.facturarA || ((cot.cliente?.nombres||'') + ' ' + (cot.cliente?.apellidos||''))}</div></div>
    <div class="datos-row"><div class="datos-label">DNI/RUC</div><div class="datos-value">${cot.dniRuc || cot.cliente?.dniRuc || '—'}</div></div>
    <div class="datos-row"><div class="datos-label">Teléfono</div><div class="datos-value">${cot.telefono || cot.cliente?.telefono || '—'}</div></div>
    <div class="datos-row"><div class="datos-label">Método pago</div><div class="datos-value">${cot.metodoPago || '—'}</div></div>
    <div class="datos-row"><div class="datos-label">Asesor</div><div class="datos-value">${cot.asesor || '—'}</div></div>
    <div class="datos-row"><div class="datos-label">F. Apertura</div><div class="datos-value">${fmtFecha(cot.fechaApertura || cot.creadoEn)}</div></div>
  </td>
  <td width="50%" style="vertical-align:top;padding-left:20px">
    <div class="datos-section-label">Datos de Vehículo</div>
    <div class="datos-row"><div class="datos-label">Placa</div><div class="datos-value">${cot.placa || cot.vehiculo?.placa || '—'}</div></div>
    <div class="datos-row"><div class="datos-label">Marca</div><div class="datos-value">${cot.marca || cot.vehiculo?.marca || '—'}</div></div>
    <div class="datos-row"><div class="datos-label">Modelo</div><div class="datos-value">${cot.modelo || cot.vehiculo?.modelo || '—'}</div></div>
    <div class="datos-row"><div class="datos-label">Motor</div><div class="datos-value">${cot.motor || '—'}</div></div>
    <div class="datos-row"><div class="datos-label">Km</div><div class="datos-value">${cot.km2 ? Number(cot.km2).toLocaleString() : (cot.vehiculo?.kilometraje?.toLocaleString() || '—')}</div></div>
  </td>
</tr></table>

${cot.tipoOrden ? `<div style="font-size:11px;margin-bottom:10px">Servicio Aplicado: <strong>${cot.tipoOrden}</strong></div>` : ''}

${tablaSeccion('Servicios', servicios, totalSvc, descPctSvc)}
${tablaSeccion('Servicios Terceros', terceros, totalTer, 0)}
${tablaSeccion('Repuestos / Insumos', repuestos, totalRep, descPctRep)}

<table style="margin-top:18px"><tr>
  <td class="bottom-notes-cell">
    <div class="nota-label">Nota 1</div>
    <div class="nota-box">${cot.nota1 || ''}</div>
    <div class="nota-label" style="margin-top:8px">Nota 2</div>
    <div class="nota-box">${cot.nota2 || ''}</div>
  </td>
  <td class="bottom-total-cell">
    <div class="total-final-box">
      <div class="total-final-label">Total</div>
      <div class="total-final-amount">S/ ${Number(cot.total||0).toFixed(2)}</div>
      <div class="total-final-igv">INCLUYE IGV*</div>
    </div>
  </td>
</tr></table>

<div class="doc-footer">
  <strong>Términos aplicables*</strong><br/><br/>
  - Cotización y precios válidos por 7 días para repuestos en stock y 5 días por importación.<br/>
  - Venta sujeta a disponibilidad de repuestos.<br/>
  - Precio total incluye I.G.V.
</div>

</body></html>`;
}