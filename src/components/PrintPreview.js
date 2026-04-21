// ============================================
// SIMPRO CLONE — PDF PREVIEW & PRINT
// ============================================

import { escapeHTML } from '../utils/security.js';

export function showPrintPreview({ type, data }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'print-preview-overlay';
  overlay.style.cssText = 'z-index:500;background:rgba(0,0,0,0.7)';

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'background:white;width:210mm;max-width:95vw;max-height:95vh;overflow-y:auto;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.3);position:relative;';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.style.cssText = 'position:sticky;top:0;z-index:2;background:var(--sidebar-bg);color:white;display:flex;align-items:center;justify-content:space-between;padding:12px 24px;border-radius:8px 8px 0 0;';
  toolbar.innerHTML = `
    <span style="font-weight:600;font-size:14px">${type === 'quote' ? 'Quote' : 'Invoice'} Preview — ${data.number}</span>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary btn-sm" id="btn-print-pdf" style="background:#10B981;border-color:#10B981">
        <span class="material-icons-outlined" style="font-size:16px">print</span> Print / Save PDF
      </button>
      <button class="btn btn-ghost btn-sm" id="btn-close-preview" style="color:white">
        <span class="material-icons-outlined" style="font-size:18px">close</span>
      </button>
    </div>
  `;

  // Document content
  const doc = document.createElement('div');
  doc.id = 'print-document';
  doc.className = 'print-document';
  doc.innerHTML = generateDocument(type, data);

  wrapper.appendChild(toolbar);
  wrapper.appendChild(doc);
  overlay.appendChild(wrapper);
  document.body.appendChild(overlay);

  // Close
  const close = () => overlay.remove();
  toolbar.querySelector('#btn-close-preview').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // Print
  toolbar.querySelector('#btn-print-pdf').addEventListener('click', () => {
    const printWindow = window.open('', '_blank', 'width=800,height=1000');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${data.number} — ${type === 'quote' ? 'Quote' : 'Invoice'}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>${getPrintStyles()}</style>
      </head>
      <body>
        ${generateDocument(type, data)}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  });

  // ESC
  const esc = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } };
  document.addEventListener('keydown', esc);
}

function generateDocument(type, data) {
  const isQuote = type === 'quote';
  const statusColors = {
    'Draft': '#6B7280', 'Sent': '#3B82F6', 'Accepted': '#10B981', 'Declined': '#EF4444',
    'Paid': '#10B981', 'Overdue': '#EF4444', 'Void': '#6B7280',
  };
  const statusColor = statusColors[data.status] || '#6B7280';

  const customer = data.customerName || 'Customer';
  const contact = data.contactName || '';
  const lineItems = data.lineItems || [];

  return `
    <div class="pdf-page">
      <!-- Header -->
      <div class="pdf-header">
        <div class="pdf-company">
          <div class="pdf-logo">S</div>
          <div>
            <div class="pdf-company-name">SimPro Demo Company</div>
            <div class="pdf-company-detail">ABN: 12 345 678 901</div>
            <div class="pdf-company-detail">123 Business St, Melbourne VIC 3000</div>
            <div class="pdf-company-detail">Phone: 1300 123 456</div>
          </div>
        </div>
        <div class="pdf-title-block">
          <div class="pdf-doc-type">${isQuote ? 'QUOTE' : 'TAX INVOICE'}</div>
          <div class="pdf-doc-number">${data.number}</div>
          <div class="pdf-status" style="background:${statusColor}15;color:${statusColor};border:1px solid ${statusColor}40">${data.status}</div>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="pdf-info-grid">
        <div class="pdf-info-col">
          <div class="pdf-info-label">${isQuote ? 'Quote For' : 'Bill To'}</div>
          <div class="pdf-info-value-lg">${customer}</div>
          ${contact ? `<div class="pdf-info-value">Attn: ${contact}</div>` : ''}
        </div>
        <div class="pdf-info-col">
          <div class="pdf-info-row">
            <span class="pdf-info-label">${isQuote ? 'Quote Date' : 'Issue Date'}</span>
            <span class="pdf-info-value">${formatDate(isQuote ? data.createdAt : data.issueDate)}</span>
          </div>
          ${isQuote ? `
            <div class="pdf-info-row">
              <span class="pdf-info-label">Valid Until</span>
              <span class="pdf-info-value">${formatDate(data.validUntil)}</span>
            </div>
          ` : `
            <div class="pdf-info-row">
              <span class="pdf-info-label">Due Date</span>
              <span class="pdf-info-value">${formatDate(data.dueDate)}</span>
            </div>
          `}
          ${!isQuote && data.jobNumber ? `
            <div class="pdf-info-row">
              <span class="pdf-info-label">Job Reference</span>
              <span class="pdf-info-value">${data.jobNumber}</span>
            </div>
          ` : ''}
          ${isQuote && data.title ? `
            <div class="pdf-info-row">
              <span class="pdf-info-label">Description</span>
              <span class="pdf-info-value">${data.title}</span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Line Items Table -->
      <table class="pdf-table">
        <thead>
          <tr>
            <th style="width:50%">Description</th>
            ${isQuote ? `
              <th style="width:12%;text-align:center">Type</th>
              <th style="width:10%;text-align:center">Qty</th>
              <th style="width:13%;text-align:right">Rate</th>
            ` : ''}
            <th style="width:${isQuote ? '15' : '25'}%;text-align:right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${lineItems.map(item => `
            <tr>
              <td>${item.description ? escapeHTML(item.description) : '—'}</td>
              ${isQuote ? `
                <td style="text-align:center"><span class="pdf-type-tag">${(item.type || 'other').charAt(0).toUpperCase() + (item.type || 'other').slice(1)}</span></td>
                <td style="text-align:center">${item.qty || 1}</td>
                <td style="text-align:right">$${(item.rate || 0).toFixed(2)}</td>
              ` : ''}
              <td style="text-align:right;font-weight:600">$${(isQuote ? (item.total || 0) : (item.amount || 0)).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Totals -->
      <div class="pdf-totals">
        <div class="pdf-total-row">
          <span>Subtotal</span>
          <span>$${(data.subtotal || 0).toFixed(2)}</span>
        </div>
        <div class="pdf-total-row">
          <span>GST (10%)</span>
          <span>$${(data.tax || 0).toFixed(2)}</span>
        </div>
        <div class="pdf-total-row pdf-grand-total">
          <span>Total (AUD)</span>
          <span>$${(data.total || 0).toFixed(2)}</span>
        </div>
      </div>

      ${data.notes ? `
        <div class="pdf-notes">
          <div class="pdf-notes-title">Notes</div>
          <div class="pdf-notes-text">${escapeHTML(data.notes).replace(/\n/g, '<br>')}</div>
        </div>
      ` : ''}

      <!-- Footer -->
      <div class="pdf-footer">
        <div class="pdf-footer-line"></div>
        <div class="pdf-footer-text">
          ${isQuote
            ? 'This quote is valid for the period shown above. Prices include GST where applicable. Please contact us to accept this quote or if you have any questions.'
            : 'Payment is due by the date shown above. Please reference the invoice number when making payment. Thank you for your business.'}
        </div>
        <div class="pdf-footer-company">SimPro Demo Company — admin@simprogroup.com — 1300 123 456</div>
      </div>
    </div>
  `;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getPrintStyles() {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1A2332; font-size: 12px; line-height: 1.5; }
    .pdf-page { padding: 40px 48px; max-width: 210mm; margin: 0 auto; }

    .pdf-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #E4E9F0; }
    .pdf-company { display: flex; gap: 14px; align-items: flex-start; }
    .pdf-logo { width: 44px; height: 44px; background: linear-gradient(135deg, #1B6DE0, #3B95FF); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 22px; flex-shrink: 0; }
    .pdf-company-name { font-size: 18px; font-weight: 700; color: #1A2332; margin-bottom: 2px; }
    .pdf-company-detail { font-size: 11px; color: #5A6B7F; line-height: 1.6; }

    .pdf-title-block { text-align: right; }
    .pdf-doc-type { font-size: 24px; font-weight: 800; color: #1B6DE0; letter-spacing: 1px; }
    .pdf-doc-number { font-size: 14px; color: #5A6B7F; margin: 2px 0 8px; font-weight: 500; }
    .pdf-status { display: inline-block; padding: 3px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

    .pdf-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 28px; padding: 20px; background: #F8FAFC; border-radius: 8px; }
    .pdf-info-col { display: flex; flex-direction: column; gap: 6px; }
    .pdf-info-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #8A97A8; }
    .pdf-info-value { font-size: 12px; color: #1A2332; }
    .pdf-info-value-lg { font-size: 16px; font-weight: 700; color: #1A2332; }
    .pdf-info-row { display: flex; justify-content: space-between; align-items: center; }

    .pdf-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .pdf-table th { padding: 10px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: white; background: #1E2A3A; text-align: left; }
    .pdf-table th:first-child { border-radius: 6px 0 0 0; }
    .pdf-table th:last-child { border-radius: 0 6px 0 0; }
    .pdf-table td { padding: 10px 12px; border-bottom: 1px solid #E4E9F0; font-size: 12px; }
    .pdf-table tbody tr:last-child td { border-bottom: 2px solid #1E2A3A; }
    .pdf-table tbody tr:nth-child(even) { background: #F8FAFC; }
    .pdf-type-tag { display: inline-block; padding: 1px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; background: #E8F1FC; color: #1B6DE0; }

    .pdf-totals { margin-left: auto; width: 280px; margin-bottom: 32px; }
    .pdf-total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #5A6B7F; }
    .pdf-grand-total { border-top: 2px solid #1E2A3A; padding-top: 12px; margin-top: 4px; font-size: 18px; font-weight: 800; color: #1A2332; }

    .pdf-notes { margin-bottom: 32px; padding: 16px; background: #FFFBEB; border-radius: 6px; border: 1px solid #FDE68A; }
    .pdf-notes-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #92400E; margin-bottom: 4px; }
    .pdf-notes-text { font-size: 12px; color: #78350F; line-height: 1.6; }

    .pdf-footer { margin-top: 40px; }
    .pdf-footer-line { height: 2px; background: linear-gradient(90deg, #1B6DE0, #3B95FF, #1B6DE0); margin-bottom: 16px; border-radius: 1px; }
    .pdf-footer-text { font-size: 11px; color: #5A6B7F; line-height: 1.6; margin-bottom: 8px; }
    .pdf-footer-company { font-size: 10px; color: #8A97A8; font-weight: 500; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .pdf-page { padding: 20px 24px; }
    }
  `;
}
