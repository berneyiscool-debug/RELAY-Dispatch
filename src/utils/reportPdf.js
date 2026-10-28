// ============================================
// RELAY — REPORT PDF
// ============================================
// Draws report content (the blocks from pages/reports/reportSpec.js) straight
// into an A4 PDF with jsPDF: real text, so it can be selected and searched, and
// long tables break across pages with their header repeated. Unlike
// documentPdf.js there is no screenshot of the page, so the PDF doesn't depend
// on what's on screen and stays small. Works in the browser and in Node (tests).

const PAGE_W = 210, PAGE_H = 297;
const M = 15;                    // margin
const W = PAGE_W - 2 * M;        // content width
const FOOT = 12;                 // space kept for the footer
const INK = [17, 17, 17];
const MUTED = [105, 105, 100];
const RULE = [221, 220, 214];
const ZEBRA = [247, 246, 243];
const CARD = [244, 243, 239];
const BAR = [235, 104, 52];      // chart slot 1 (brand orange)
const TRACK = [234, 233, 228];

// The built-in PDF fonts only cover Latin-1, so swap the typographic characters
// the app uses for plain ones, and anything else outside Latin-1 for '?'.
const SWAPS = { '—': '-', '–': '-', '‘': "'", '’': "'", '“': '"', '”': '"', '→': '->', '…': '...', '•': '-' };
export function pdfText(v) {
  return String(v == null ? '' : v)
    .replace(/[—–‘’“”→…•]/g, c => SWAPS[c])
    .replace(/[^\x00-\xFF]/g, '?');
}

function safeName(s) {
  return String(s || '').replace(/[\\/:*?"<>|\s]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

// A small layout cursor over a jsPDF document.
function writer(doc) {
  let y = M;
  const w = {
    get y() { return y; },
    set y(v) { y = v; },
    // Start a new page when `h` more millimetres won't fit.
    ensure(h) {
      if (y + h > PAGE_H - FOOT - M / 2) { doc.addPage(); y = M; return true; }
      return false;
    },
    font(size, style = 'normal', color = INK) {
      doc.setFont('helvetica', style);
      doc.setFontSize(size);
      doc.setTextColor(...color);
    },
    // Wrapped text; returns the height used.
    para(text, x, width, size, style = 'normal', color = INK, lineH = 1.35) {
      w.font(size, style, color);
      const lines = doc.splitTextToSize(pdfText(text), width);
      const lh = size * 0.3528 * lineH;     // pt → mm, with leading
      const ascent = size * 0.3528 * 0.85;
      lines.forEach(line => {
        w.ensure(lh);
        doc.text(line, x, y + ascent);
        y += lh;
      });
      return lines.length * lh;
    },
    // One line, cut with "..." to fit `width`.
    fit(text, width) {
      const s = pdfText(text);
      if (doc.getTextWidth(s) <= width) return s;
      let lo = 0, hi = s.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (doc.getTextWidth(s.slice(0, mid) + '...') <= width) lo = mid; else hi = mid - 1;
      }
      return s.slice(0, lo) + '...';
    },
  };
  return w;
}

function blockTitle(doc, w, title) {
  w.ensure(14);
  w.y += 3;
  w.font(10.5, 'bold');
  doc.text(pdfText(title), M, w.y + 3.5);
  w.y += 7;
}

function drawKpis(doc, w, block) {
  blockTitle(doc, w, block.title);
  const cols = block.items.length <= 3 ? block.items.length : 4;
  const gap = 4, cw = (W - gap * (cols - 1)) / cols, ch = 21;
  for (let i = 0; i < block.items.length; i += cols) {
    w.ensure(ch + gap);
    block.items.slice(i, i + cols).forEach((it, j) => {
      const x = M + j * (cw + gap);
      doc.setFillColor(...CARD);
      doc.roundedRect(x, w.y, cw, ch, 2, 2, 'F');
      w.font(7, 'normal', MUTED);
      doc.text(w.fit(String(it.label).toUpperCase(), cw - 6), x + 3, w.y + 5.5);
      w.font(13, 'bold');
      doc.text(w.fit(it.value, cw - 6), x + 3, w.y + 12.5);
      if (it.sub) {
        w.font(7, 'normal', MUTED);
        doc.text(w.fit(it.sub, cw - 6), x + 3, w.y + 17.5);
      }
    });
    w.y += ch + gap;
  }
}

function drawChart(doc, w, block) {
  blockTitle(doc, w, block.title);
  if (block.note) { w.para(block.note, M, W, 8, 'normal', MUTED); w.y += 1; }
  if (!block.rows.length) { w.para('No data in this range', M, W, 9, 'normal', MUTED); return; }
  const labelW = 48, valueW = 26, barX = M + labelW + 3, barW = W - labelW - valueW - 6, rowH = 6.5;
  const max = block.max != null ? block.max : Math.max(0, ...block.rows.map(r => r.value));
  block.rows.forEach(row => {
    w.ensure(rowH);
    w.font(8.5, 'normal', MUTED);
    doc.text(w.fit(row.label, labelW), M + labelW, w.y + 4.3, { align: 'right' });
    doc.setFillColor(...TRACK);
    doc.roundedRect(barX, w.y + 1, barW, 4, 1, 1, 'F');
    const len = max > 0 ? Math.max(0, row.value) / max * barW : 0;
    if (len > 0.5) {
      doc.setFillColor(...BAR);
      doc.roundedRect(barX, w.y + 1, len, 4, 1, 1, 'F');
    }
    w.font(8.5, 'bold');
    doc.text(pdfText(row.display), M + W, w.y + 4.3, { align: 'right' });
    w.y += rowH;
  });
}

// Column widths from the longest text in each column, within limits.
function columnWidths(doc, block) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const want = block.columns.map((c, i) => {
    const lens = [c.label, ...block.rows.slice(0, 200).map(r => r[i])].map(v => doc.getTextWidth(pdfText(v)));
    return Math.min(Math.max(...lens) + 4, 70);
  });
  const total = want.reduce((s, x) => s + x, 0);
  return want.map(x => x * W / total);
}

function drawTable(doc, w, block) {
  blockTitle(doc, w, block.title);
  if (!block.rows.length) { w.para(block.empty || 'Nothing in this range', M, W, 9, 'normal', MUTED); return; }
  const widths = columnWidths(doc, block);
  const rowH = 5.6, pad = 1.6;
  const cellX = (i) => M + widths.slice(0, i).reduce((s, x) => s + x, 0);
  const header = () => {
    doc.setDrawColor(...INK);
    doc.setLineWidth(0.3);
    w.font(7.5, 'bold', MUTED);
    block.columns.forEach((c, i) => {
      const right = c.align === 'right';
      doc.text(w.fit(c.label, widths[i] - 2 * pad), right ? cellX(i) + widths[i] - pad : cellX(i) + pad, w.y + 3.9, right ? { align: 'right' } : undefined);
    });
    w.y += rowH;
    doc.line(M, w.y, M + W, w.y);
  };
  w.ensure(rowH * 2);
  header();
  block.rows.forEach((row, n) => {
    if (w.ensure(rowH)) header();
    if (n % 2) { doc.setFillColor(...ZEBRA); doc.rect(M, w.y, W, rowH, 'F'); }
    w.font(8, 'normal');
    block.columns.forEach((c, i) => {
      const right = c.align === 'right';
      const text = w.fit(row[i], widths[i] - 2 * pad);
      doc.text(text, right ? cellX(i) + widths[i] - pad : cellX(i) + pad, w.y + 3.9, right ? { align: 'right' } : undefined);
    });
    w.y += rowH;
  });
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.2);
  doc.line(M, w.y, M + W, w.y);
  w.y += 1;
}

function drawInsights(doc, w, block) {
  blockTitle(doc, w, block.title);
  if (!block.items.length) { w.para('Nothing stands out in this range.', M, W, 9, 'normal', MUTED); return; }
  block.items.forEach(it => {
    w.ensure(16);
    w.font(9, 'bold', BAR);
    doc.text('-', M, w.y + 3.2);
    w.para(`${it.headline}${it.confidence ? `  (${it.confidence} confidence)` : ''}`, M + 4, W - 4, 9, 'bold');
    if (it.detail) w.para(it.detail, M + 4, W - 4, 8.5, 'normal', MUTED);
    if (it.action) w.para(`Now what: ${it.action}`, M + 4, W - 4, 8.5, 'normal');
    w.y += 2;
  });
}

const DRAW = { kpis: drawKpis, chart: drawChart, table: drawTable, insights: drawInsights };

/**
 * Build the PDF.
 * @param {object} opts
 * @param {string} opts.company       business name for the header
 * @param {string} opts.rangeLabel    e.g. "1 Jul 2026 – 28 Oct 2026"
 * @param {string[]} [opts.filterLines] the filters in use, one per line
 * @param {Array<{title: string, blocks: object[]}>} opts.sections  reportSpec() results, already trimmed to the selection
 * @param {Date} [opts.generatedAt]
 * @returns {Promise<{doc: object, filename: string, pages: number}>}
 */
export async function buildReportPdf({ company = '', rangeLabel = '', filterLines = [], sections = [], generatedAt = new Date() }) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  doc.setProperties({ title: pdfText(`${company} report`), creator: 'RELAY Dispatch' });
  const w = writer(doc);

  // Title block
  w.font(9, 'normal', MUTED);
  doc.text(pdfText(company || 'RELAY Dispatch'), M, w.y + 3);
  w.y += 6;
  w.font(18, 'bold');
  doc.text(pdfText(sections.length === 1 ? sections[0].title : 'Business report'), M, w.y + 6);
  w.y += 10;
  w.para(rangeLabel, M, W, 10, 'normal');
  filterLines.forEach(line => w.para(line, M, W, 8.5, 'normal', MUTED));
  w.para('All money is GST-exclusive.', M, W, 8.5, 'normal', MUTED);
  w.y += 2;
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.3);
  doc.line(M, w.y, M + W, w.y);
  w.y += 4;

  sections.forEach((s, i) => {
    if (sections.length > 1) {
      if (i > 0) w.ensure(40) || (w.y += 6);
      else w.ensure(30);
      w.font(14, 'bold');
      doc.text(pdfText(s.title), M, w.y + 5);
      w.y += 9;
    }
    s.blocks.forEach(b => { if (DRAW[b.kind]) DRAW[b.kind](doc, w, b); w.y += 2; });
  });

  // Footer on every page.
  const pages = doc.getNumberOfPages();
  const stamp = generatedAt.toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  for (let n = 1; n <= pages; n++) {
    doc.setPage(n);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(pdfText(`Generated ${stamp} by RELAY Dispatch`), M, PAGE_H - 8);
    doc.text(`Page ${n} of ${pages}`, PAGE_W - M, PAGE_H - 8, { align: 'right' });
  }

  const day = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const base = sections.length === 1 ? sections[0].title : 'report';
  const filename = `${safeName(`${company || 'relay'}_${base}`)}_${day(generatedAt)}.pdf`;
  return { doc, filename, pages };
}
