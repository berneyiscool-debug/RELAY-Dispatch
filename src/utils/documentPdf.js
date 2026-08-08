// ============================================
// RELAY — DOCUMENT PDF
// ============================================
// Renders the real quote / invoice document — the exact layout the Document
// Studio designs and the print preview shows — into an A4 PDF, so a send can
// attach the full detailed paperwork alongside the short summary email.
//
// The document is laid out in a hidden A4-width iframe (so getPrintStyles()'s
// global `*` and `body` rules can't leak into the app), captured with
// html2canvas at 2x, then paged into a PDF with jsPDF. Both libraries are
// dynamically imported so they only load when someone actually sends something.
//
// Trade-off: the page is an image inside the PDF, so the text is not
// selectable. In exchange it is pixel-identical to the on-screen design with no
// second layout to maintain.

import { store } from '../data/store.js';
import { getPrintStyles, generateDocument } from '../components/PrintPreview.js';

// A4 at 96dpi, which is what the print stylesheet is authored against.
const A4_PX_W = 794;
const A4_PX_H = 1123;

function safeName(s) {
  return String(s || '').replace(/[\\/:*?"<>|\s]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

// Resolve once the iframe has painted: document ready, webfonts settled, images
// decoded. Without this html2canvas can capture a half-styled page.
async function waitForFrame(frame, timeoutMs = 8000) {
  const doc = frame.contentDocument;
  const deadline = Date.now() + timeoutMs;

  const withTimeout = (p) => Promise.race([
    p,
    new Promise((resolve) => setTimeout(resolve, Math.max(0, deadline - Date.now()))),
  ]);

  if (doc.readyState !== 'complete') {
    await withTimeout(new Promise((resolve) => frame.addEventListener('load', resolve, { once: true })));
  }
  if (doc.fonts && doc.fonts.ready) await withTimeout(doc.fonts.ready);

  const images = [...doc.images].filter(img => !img.complete);
  if (images.length) {
    await withTimeout(Promise.all(images.map(img => new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    }))));
  }
  // One more frame so layout settles after fonts swap in. Raced against a timer
  // because a backgrounded or hidden tab stops firing animation frames, and a
  // send must not hang waiting for one.
  await Promise.race([
    new Promise(requestAnimationFrame),
    new Promise((resolve) => setTimeout(resolve, 60)),
  ]);
}

/**
 * Render a document to a PDF.
 * @param {'quote'|'invoice'} type
 * @param {object} data  the quote/invoice record, as passed to generateDocument
 * @param {{filename?: string}} [opts]
 * @returns {Promise<{filename: string, base64: string, bytes: number}>}
 */
export async function renderDocumentPdf(type, data, opts = {}) {
  if (typeof document === 'undefined') throw new Error('PDF rendering needs a browser.');

  const [{ jsPDF }, html2canvasModule] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);
  const html2canvas = html2canvasModule.default || html2canvasModule;

  const settings = store.getSettings() || {};
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.setAttribute('title', 'Document render');
  frame.style.cssText = `position:fixed;left:-10000px;top:0;width:${A4_PX_W}px;height:${A4_PX_H}px;border:0;opacity:0;pointer-events:none;`;
  document.body.appendChild(frame);

  try {
    const doc = frame.contentDocument;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>
        ${getPrintStyles(settings)}
        html, body { background:#ffffff; margin:0; padding:0; }
        .pdf-page { width:${A4_PX_W}px; max-width:${A4_PX_W}px; margin:0 auto; }
      </style>
    </head><body>${generateDocument(type, data)}</body></html>`);
    doc.close();

    await waitForFrame(frame);

    const target = doc.querySelector('.pdf-page') || doc.body;
    const canvas = await html2canvas(target, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      width: A4_PX_W,
      windowWidth: A4_PX_W,
      height: Math.max(target.scrollHeight, A4_PX_H),
      windowHeight: Math.max(target.scrollHeight, A4_PX_H),
    });

    const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgH = (canvas.height * pageW) / canvas.width;
    // JPEG rather than PNG: a mostly-white document compresses to a fraction of
    // the size with no visible loss at 2x.
    const img = canvas.toDataURL('image/jpeg', 0.95);

    pdf.addImage(img, 'JPEG', 0, 0, pageW, imgH, undefined, 'FAST');
    let printed = pageH;
    let offset = 0;
    while (printed < imgH - 1) {
      offset -= pageH;
      pdf.addPage();
      pdf.addImage(img, 'JPEG', 0, offset, pageW, imgH, undefined, 'FAST');
      printed += pageH;
    }

    const base64 = pdf.output('datauristring').split(',')[1] || '';
    const label = type === 'quote' ? 'Quote' : 'Invoice';
    const filename = opts.filename
      || `${safeName(label)}_${safeName(data.number || data.id || 'document')}.pdf`;

    return { filename, base64, bytes: Math.floor(base64.length * 0.75) };
  } finally {
    frame.remove();
  }
}

/**
 * Attachment array for sendEmail(), or [] if the document can't be rendered.
 * Attaching is a nice-to-have on top of the email — a rendering failure must
 * never stop the message going out, so this swallows errors and warns.
 * @returns {Promise<Array<{filename:string, content:string}>>}
 */
export async function documentAttachment(type, data, opts = {}) {
  try {
    // Hard ceiling so a wedged render (hidden tab, blocked webfont, huge
    // document) can never stop the email itself from going out.
    const rendered = await Promise.race([
      renderDocumentPdf(type, data, opts),
      new Promise((_, reject) => setTimeout(() => reject(new Error('PDF render timed out')), 25000)),
    ]);
    if (!rendered?.base64) return failed(type, 'the document rendered empty');
    return [{ filename: rendered.filename, content: rendered.base64 }];
  } catch (err) {
    return failed(type, err?.message || String(err), err);
  }
}

// Degrading to "no attachment" must stay non-fatal, but it must not be silent.
// A render failure used to only console.warn, so the email went out with no PDF
// and nothing said so — indistinguishable from the feature not existing. Tell
// the user, and hang the reason off the returned array for callers that want it.
function failed(type, reason, err) {
  console.warn(`Could not attach the ${type} PDF; sending the email without it.`, err || reason);
  const empty = [];
  Object.defineProperty(empty, 'error', { value: reason, enumerable: false });
  import('../components/Notifications.js')
    .then(({ showToast }) => showToast(`The ${type} PDF could not be attached — ${reason}. The email was still sent.`, 'error'))
    .catch(() => { /* toast is best-effort */ });
  return empty;
}
