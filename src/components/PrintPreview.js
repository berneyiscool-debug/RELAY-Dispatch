// ============================================
// SIMPRO CLONE — PDF PREVIEW & PRINT
// ============================================

import { escapeHTML } from '../utils/security.js';
import { store } from '../data/store.js';
const logoLarge = new URL('../assets/logo-large.png', import.meta.url).href;


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
  
  const exportButtonsHtml = type === 'form' ? `
    <button class="btn btn-secondary btn-sm" id="btn-export-csv" style="background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(255,255,255,0.2)">
      <span class="material-icons-outlined" style="font-size:16px; margin-right:4px">table_view</span> CSV
    </button>
    <button class="btn btn-secondary btn-sm" id="btn-export-json" style="background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(255,255,255,0.2)">
      <span class="material-icons-outlined" style="font-size:16px; margin-right:4px">code</span> JSON
    </button>
  ` : '';

  toolbar.innerHTML = `
    <span style="font-weight:600;font-size:14px">${type === 'quote' ? 'Quote' : type === 'invoice' ? 'Invoice' : 'Form'} Preview — ${data.number}</span>
    <div style="display:flex;gap:8px;align-items:center">
      ${exportButtonsHtml}
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
  
  const settings = store.getSettings();
  const scopedStyle = document.createElement('style');
  scopedStyle.innerHTML = getPrintStyles(settings).replace(/body\s*{/g, '.print-document {');
  doc.appendChild(scopedStyle);

  const innerDoc = document.createElement('div');
  innerDoc.innerHTML = generateDocument(type, data);
  doc.appendChild(innerDoc);

  wrapper.appendChild(toolbar);
  wrapper.appendChild(doc);
  overlay.appendChild(wrapper);
  document.body.appendChild(overlay);

  // Close
  const close = () => overlay.remove();
  toolbar.querySelector('#btn-close-preview').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // Bind Export Actions if applicable
  if (type === 'form') {
    toolbar.querySelector('#btn-export-csv').addEventListener('click', () => {
      exportFormAsCSV(data);
    });
    toolbar.querySelector('#btn-export-json').addEventListener('click', () => {
      exportFormAsJSON(data);
    });
  }

  // Print
  toolbar.querySelector('#btn-print-pdf').addEventListener('click', () => {
    const settings = store.getSettings();
    const htmlString = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${data.number} — ${type === 'quote' ? 'Quote' : type === 'invoice' ? 'Invoice' : 'Form'}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>${getPrintStyles(settings)}</style>
      </head>
      <body>
        ${generateDocument(type, data)}
      </body>
      </html>
    `;

    // Save to Document System
    const docName = `${type === 'quote' ? 'Quote' : type === 'invoice' ? 'Invoice' : 'Form'} ${data.number}`;
    
    // Check if it already exists to avoid duplicates
    const existingDocs = store.getAll('documents');
    const exists = existingDocs.find(d => d.entityId === data.id && d.name === docName);
    
    if (!exists) {
      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlString)}`;
      store.create('documents', {
        name: docName,
        type: type === 'quote' ? 'Quote PDF' : type === 'invoice' ? 'Invoice PDF' : 'Form PDF',
        size: htmlString.length,
        url: dataUrl,
        folder: type === 'quote' ? 'Quotes' : type === 'invoice' ? 'Invoices' : 'Forms',
        uploadedAt: new Date().toISOString(),
        entityType: type === 'quote' ? 'Quote' : type === 'invoice' ? 'Invoice' : 'Job',
        entityId: data.entityId || data.id,
        entityName: data.customerName || 'Unknown Customer'
      });
      
      import('./Notifications.js').then(({ showToast }) => {
        showToast(`${docName} saved to Documents`, 'success');
      });
    }

    const printWindow = window.open('', '_blank', 'width=800,height=1000');
    printWindow.document.write(htmlString);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  });

  // ESC
  const esc = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } };
  document.addEventListener('keydown', esc);
}

export function generateDocument(type, data) {
  if (type === 'form') {
    return generateFormDocument(data);
  }

  const isQuote = type === 'quote';
  const statusColors = {
    'Draft': '#6B7280', 'Finalised': '#1B6DE0', 'Sent': '#3B82F6', 'Accepted': '#10B981', 'Declined': '#EF4444',
    'Paid': '#10B981', 'Overdue': '#EF4444', 'Void': '#6B7280',
  };
  const statusColor = statusColors[data.status] || '#6B7280';

  const customer = data.customerName || 'Customer';
  const contact = data.contactName || '';
  const lineItems = data.lineItems || [];
  const sections = data.sections || [];

  const settings = store.getSettings();
  const dt = settings.documentTheme || {
    preset: 'relay',
    accentColor: '#1B6DE0',
    headerBg: '#1E2A3A',
    accentTint: '#F8FAFC',
    fontFamily: 'sans-serif',
    invoiceTitle: 'TAX INVOICE',
    invoiceTerms: 'Please pay within 7 days of invoice issue.',
    invoicePaymentTerms: 'Payment via Direct Deposit:\nBSB: 123-456\nAccount: 78901234\nReference: [Invoice Number]',
    quoteTitle: 'PROPOSAL / QUOTE',
    quoteTerms: 'This quote is valid for 30 days. All work is subject to standard conditions.',
    logoAlignment: 'left',
    logoScale: 60,
    hideLogo: false,
    logoSource: 'large',
    paymentStripe: true,
    paymentDirectTransfer: true,
    paymentCash: false,
    quoteSignature: true,
    hideCompanyName: false,
    hideBrandLogo: false,
    footerNote: 'Thank you for your business!'
  };

  const isLocalMode = !store.companyId;
  const hideBrandLogo = isLocalMode ? false : !!dt.hideBrandLogo;

  const logoHeight = dt.logoScale !== undefined ? dt.logoScale : 60;
  const logoUrl = dt.logoSource === 'small' ? (settings.logoSmall || settings.logo) : (settings.logo || settings.logoSmall);
  const logoImgHtml = logoUrl 
    ? `<img class="pdf-logo-img" src="${logoUrl}" style="max-height:${logoHeight}px; max-width:240px; object-fit:contain; display: ${dt.hideLogo ? 'none' : 'block'};" />`
    : `<div class="pdf-logo" style="background: linear-gradient(135deg, ${dt.accentColor || '#1B6DE0'}, ${dt.accentColor || '#1B6DE0'}dd); display: ${dt.hideLogo ? 'none' : 'flex'};">${(settings.name || 'A').charAt(0)}</div>`;

  const textLogoHtml = `<div class="pdf-logo-text" style="font-size:24px; font-weight:800; color:${dt.accentColor || '#1B6DE0'}; display: ${dt.hideLogo ? 'block' : 'none'};">${escapeHTML(settings.name || 'Company Name')}</div>`;

  const companyHeaderHtml = `
    ${logoImgHtml}
    ${textLogoHtml}
  `;

  let headerFlexStyle = 'display:flex; justify-content:space-between; align-items:flex-start;';
  let companyFlexStyle = 'display:flex; gap:14px; align-items:flex-start;';
  let titleBlockStyle = 'text-align: right;';
  
  if (dt.logoAlignment === 'right') {
    companyFlexStyle = 'display:flex; gap:14px; align-items:flex-start; flex-direction: row-reverse; text-align: right;';
  } else if (dt.logoAlignment === 'center') {
    headerFlexStyle = 'display:flex; flex-direction:column; align-items:center; gap:20px; border-bottom: 2px solid #E4E9F0; padding-bottom: 24px; margin-bottom: 32px;';
    companyFlexStyle = 'display:flex; flex-direction:column; align-items:center; text-align:center; gap:8px;';
    titleBlockStyle = 'text-align: center; margin-top: 10px;';
  }

  let tableContent = '';
  if (sections.length > 0) {
    sections.forEach(sec => {
      // Exclude unapproved variations on invoices
      if (type === 'invoice' && sec.isVariation === true && sec.customerApproved !== true) return;

      const varBadge = (type === 'invoice' && sec.isVariation === true) 
        ? ' <span style="background:#F59E0B; color:#fff; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; margin-left:8px; vertical-align:middle; text-transform:uppercase">Variation</span>' 
        : '';

      tableContent += `
        <tr class="pdf-section-header">
          <td colspan="5" style="background:#F1F5F9; font-weight:700; color:#1E293B; border-bottom:2px solid #CBD5E1">${escapeHTML(sec.name || 'Phase')}${varBadge}</td>
        </tr>
      `;
      sec.lineItems.forEach(item => {
        tableContent += `
          <tr>
            <td>${item.description ? escapeHTML(item.description) : '—'}</td>
            <td style="text-align:center"><span class="pdf-type-tag">${(item.type || 'other').charAt(0).toUpperCase() + (item.type || 'other').slice(1)}</span></td>
            <td style="text-align:center">${item.qty || 1}</td>
            <td style="text-align:right">$${(item.rate || 0).toFixed(2)}</td>
            <td style="text-align:right;font-weight:600">$${(item.total || 0).toFixed(2)}</td>
          </tr>
        `;
      });
      tableContent += `
        <tr class="pdf-section-footer">
          <td colspan="4" style="text-align:right; font-size:11px; color:#64748B; padding:6px 12px">Phase Subtotal</td>
          <td style="text-align:right; font-weight:700; color:#1E293B; padding:6px 12px">$${(sec.subtotal || 0).toFixed(2)}</td>
        </tr>
      `;
    });
  } else {
    tableContent = lineItems.map(item => `
      <tr>
        <td>${item.description ? escapeHTML(item.description) : '—'}</td>
        <td style="text-align:center"><span class="pdf-type-tag">${(item.type || 'other').charAt(0).toUpperCase() + (item.type || 'other').slice(1)}</span></td>
        <td style="text-align:center">${item.qty || 1}</td>
        <td style="text-align:right">$${(item.rate || 0).toFixed(2)}</td>
        <td style="text-align:right;font-weight:600">$${(item.total || 0).toFixed(2)}</td>
      </tr>
    `).join('');
  }

  const showPayment = !isQuote && (dt.paymentStripe || dt.paymentDirectTransfer || dt.paymentCash);
  const paymentMethodsHtml = `
    <div class="pdf-payment-methods" style="display: ${showPayment ? 'block' : 'none'};">
      <div class="pdf-payment-title">Payment Options</div>
      <div class="pdf-payment-grid">
        <div class="pdf-payment-option pdf-payment-option-stripe" style="display: ${dt.paymentStripe ? 'block' : 'none'};">
          <strong>Credit Card / Online</strong><br/>
          Pay securely via Stripe Credit Card link.
          <div style="margin-top: 6px;">
            <a href="#" onclick="alert('Payment link mock: Stripe payment would be loaded here.'); return false;" style="display:inline-block; padding: 4px 10px; background:${dt.accentColor || '#1B6DE0'}; color:white; border-radius:4px; font-weight:600; text-decoration:none; font-size:10px;">Pay Invoice Online</a>
          </div>
        </div>
        <div class="pdf-payment-option pdf-payment-option-direct" style="display: ${dt.paymentDirectTransfer ? 'block' : 'none'};">
          <strong>Direct Bank Transfer</strong><br/>
          <span class="pdf-bank-details">${escapeHTML(dt.invoicePaymentTerms || '').replace(/\n/g, '<br/>')}</span>
        </div>
        <div class="pdf-payment-option pdf-payment-option-cash" style="display: ${dt.paymentCash ? 'block' : 'none'};">
          <strong>Cash Payments</strong><br/>
          Cash payment accepted on site. Please request a paper receipt from the attending service technician.
        </div>
      </div>
    </div>
  `;

  const showSig = isQuote && dt.quoteSignature;
  const quoteSignatureHtml = `
    <div class="pdf-signature-block" style="display: ${showSig ? 'flex' : 'none'};">
      <div class="pdf-sig-line">
        <div class="pdf-sig-space"></div>
        <div class="pdf-sig-label">Prepared By (Service Coordinator)</div>
      </div>
      <div class="pdf-sig-line">
        <div class="pdf-sig-space"></div>
        <div class="pdf-sig-label">Accepted By (Customer Representative Signature)</div>
      </div>
    </div>
  `;

  return `
    <div class="pdf-page">
      <!-- Header -->
      <div class="pdf-header" style="${headerFlexStyle}">
        <div class="pdf-company" style="${companyFlexStyle}">
          ${companyHeaderHtml}
          <div>
            <div class="pdf-company-name" style="display: ${dt.hideCompanyName ? 'none' : 'block'};">${escapeHTML(settings.name || 'Company Name')}</div>
            ${settings.abn ? `<div class="pdf-company-detail">ABN: ${escapeHTML(settings.abn)}</div>` : ''}
            ${settings.address ? `<div class="pdf-company-detail">${escapeHTML(settings.address)}</div>` : ''}
            ${settings.phone ? `<div class="pdf-company-detail">Phone: ${escapeHTML(settings.phone)}</div>` : ''}
          </div>
        </div>
        <div class="pdf-title-block" style="${titleBlockStyle}">
          <div class="pdf-doc-type">${isQuote ? escapeHTML(dt.quoteTitle || 'QUOTE') : escapeHTML(dt.invoiceTitle || 'TAX INVOICE')}</div>
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
          ${!isQuote && data.originalQuoteNumber ? `
            <div class="pdf-info-row">
              <span class="pdf-info-label">Linked Quote</span>
              <span class="pdf-info-value">${data.originalQuoteNumber}</span>
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
            <th style="width:40%">Description</th>
            <th style="width:12%;text-align:center">Type</th>
            <th style="width:10%;text-align:center">Qty</th>
            <th style="width:13%;text-align:right">Rate</th>
            <th style="width:15%;text-align:right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${tableContent}
        </tbody>
      </table>

      <!-- Totals -->
      ${type === 'invoice' ? `
        <div class="pdf-totals">
          <div class="pdf-total-row">
            <span>Original Quoted Amount</span>
            <span>$${(data.originalSubtotal !== undefined ? data.originalSubtotal : ((data.subtotal || 0) - (data.approvedVariationsSum || 0))).toFixed(2)}</span>
          </div>
          ${(data.approvedVariationsSum || 0) > 0 ? `
            <div class="pdf-total-row" style="color:#10B981; font-weight:600">
              <span>Approved Variations</span>
              <span>+$${(data.approvedVariationsSum || 0).toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="pdf-total-row" style="border-top:1px dashed #CBD5E1; padding-top:8px; font-weight:600">
            <span>Invoice Subtotal</span>
            <span>$${(data.subtotal || 0).toFixed(2)}</span>
          </div>
          ${settings.taxEnabled !== false ? `
          <div class="pdf-total-row">
            <span>GST (${settings.taxRate !== undefined ? settings.taxRate : 10}%)</span>
            <span>$${(data.tax || 0).toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="pdf-total-row pdf-grand-total">
            <span>Total Payable (AUD)</span>
            <span>$${(data.total || 0).toFixed(2)}</span>
          </div>
        </div>
      ` : `
        <div class="pdf-totals">
          <div class="pdf-total-row">
            <span>Subtotal</span>
            <span>$${(data.subtotal || 0).toFixed(2)}</span>
          </div>
          ${settings.taxEnabled !== false ? `
          <div class="pdf-total-row">
            <span>GST (${settings.taxRate !== undefined ? settings.taxRate : 10}%)</span>
            <span>$${(data.tax || 0).toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="pdf-total-row pdf-grand-total">
            <span>Total (AUD)</span>
            <span>$${(data.total || 0).toFixed(2)}</span>
          </div>
        </div>
      `}


      ${paymentMethodsHtml}

      ${data.notes ? `
        <div class="pdf-notes">
          <div class="pdf-notes-title">Notes</div>
          <div class="pdf-notes-text">${escapeHTML(data.notes).replace(/\n/g, '<br>')}</div>
        </div>
      ` : ''}

      ${quoteSignatureHtml}

      <!-- Footer -->
      <div class="pdf-footer">
        <div class="pdf-footer-line"></div>
        <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 16px;">
          <div style="flex: 1;">
            <div class="pdf-footer-text">
              ${isQuote
                ? escapeHTML(dt.quoteTerms || 'This quote is valid for the period shown above. Prices include GST where applicable. Please contact us to accept this quote or if you have any questions.')
                : escapeHTML(dt.invoiceTerms || 'Payment is due by the date shown above. Please reference the invoice number when making payment. Thank you for your business.')}
            </div>
            <div class="pdf-footer-company">${escapeHTML(settings.name || 'Company Name')}${settings.email ? ` — ${escapeHTML(settings.email)}` : ''}${settings.phone ? ` — ${escapeHTML(settings.phone)}` : ''}</div>
          </div>
          <div class="pdf-footer-branding" style="flex-shrink: 0; display: ${hideBrandLogo ? 'none' : 'flex'}; flex-direction: column; align-items: flex-end; gap: 4px;">
            <span style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; color: #8A97A8; font-weight: 600;">Powered by</span>
            <img src="${logoLarge}" style="height: 18px; max-width: 110px; object-fit: contain; opacity: 0.85; vertical-align: bottom;" alt="Relay Dispatch" />
          </div>
        </div>
        <div class="pdf-footer-note" style="font-size:10px; color:#8A97A8; font-weight:normal; text-align:center; margin-top:8px; display: ${dt.footerNote ? 'block' : 'none'};">${escapeHTML(dt.footerNote || '')}</div>
      </div>
    </div>
  `;
}

function generateFormDocument(data) {
  let formHtml = '';
  (data.template.sections || []).forEach(sec => {
    const secCols = sec.columns || (sec.width === 'half' ? 1 : 2);
    if (sec.isSpacer) {
      const secHeight = sec.height ? (String(sec.height).endsWith('px') ? sec.height : sec.height + 'px') : '50px';
      formHtml += `<div style="width:100%; height:${secHeight}" class="print-spacer"></div>`;
      return;
    }
    formHtml += `
      <div style="margin-bottom:24px; border:1px solid #CBD5E1; border-radius:6px; overflow:hidden; page-break-inside:avoid">
        <div style="background:#F8FAFC; padding:10px 16px; border-bottom:1px solid #CBD5E1; font-weight:700; color:#1E293B; font-size:14px; text-transform:uppercase; letter-spacing:0.5px">
          ${escapeHTML(sec.title)}
        </div>
        <div style="padding:16px; display:grid; grid-template-columns: repeat(${secCols}, 1fr); gap:16px">
    `;
    sec.fields.forEach(f => {
      const fSpan = Math.min(f.colSpan || (f.width === 'half' ? 1 : secCols), secCols);
      if (f.type === 'spacer' || f.type === 'blank') {
        const fHeight = f.height ? (String(f.height).endsWith('px') ? f.height : f.height + 'px') : '50px';
        formHtml += `<div style="grid-column: span ${fSpan}; height:${f.type === 'blank' ? 'auto' : fHeight}" class="print-spacer"></div>`;
        return;
      }
      
      if (f.type === 'info') {
        formHtml += `
          <div style="grid-column: span ${fSpan}; padding:14px; background:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid #64748b; color:#334155; font-size:13px; border-radius:4px; line-height:1.6; page-break-inside:avoid">
            <div style="font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:6px; color:#475569">
              <span class="material-icons-outlined" style="font-size:16px">info</span> Instruction / Info
            </div>
            <div>${escapeHTML(f.label).replace(/\n/g, '<br/>')}</div>
          </div>
        `;
        return;
      }
      
      const val = data.responses[f.id];
      let valHtml = '';
      if (f.type === 'signature') {
        valHtml = val ? `<div style="font-family:'Brush Script MT', cursive; font-size:24px; padding:10px; border:1px solid #E4E9F0; border-radius:4px; text-align:center">${escapeHTML(val)}</div>` : '<div style="padding:10px; border:1px dashed #E4E9F0; color:#8A97A8; font-style:italic; text-align:center">No signature</div>';
      } else if (f.type === 'checkbox') {
        valHtml = `<div style="font-weight:600; color:${val ? '#10B981' : '#EF4444'}">${val ? 'YES / CHECKED' : 'NO / UNCHECKED'}</div>`;
      } else {
        valHtml = `<div style="padding:8px 12px; border:1px solid #E4E9F0; border-radius:4px; background:#F8FAFC; min-height:34px; font-size:12px">${val ? escapeHTML(val).replace(/\n/g, '<br/>') : '<span style="color:#8A97A8;font-style:italic">No response</span>'}</div>`;
      }

      formHtml += `
        <div style="grid-column: span ${fSpan}; display:flex; flex-direction:column; gap:6px">
          <div style="font-size:11px; font-weight:700; color:#5A6B7F; text-transform:uppercase; letter-spacing:0.5px">${escapeHTML(f.label)}</div>
          ${valHtml}
        </div>
      `;
    });
    formHtml += `
        </div>
      </div>
    `;
  });

  return `
    <div class="pdf-page">
      <div style="margin-bottom:28px; padding-bottom:20px; border-bottom:2px solid #E4E9F0">
        <div style="font-size:22px; font-weight:800; color:#1A2332">${escapeHTML(data.template.name)}</div>
        ${data.template.description ? `<div style="font-size:13px; color:#5A6B7F; margin-top:6px; line-height:1.6">${escapeHTML(data.template.description)}</div>` : ''}
      </div>

      <div class="pdf-info-grid" style="margin-bottom:32px">
        <div class="pdf-info-col">
          <div class="pdf-info-label">Job Reference</div>
          <div class="pdf-info-value-lg">${escapeHTML(data.jobNumber)}</div>
          <div class="pdf-info-value">Customer: ${escapeHTML(data.customerName)}</div>
        </div>
        <div class="pdf-info-col">
          <div class="pdf-info-row">
            <span class="pdf-info-label">Submitted By</span>
            <span class="pdf-info-value">${escapeHTML(data.submittedByName || '—')}</span>
          </div>
          <div class="pdf-info-row">
            <span class="pdf-info-label">Date Submitted</span>
            <span class="pdf-info-value">${formatDate(data.submittedAt)}</span>
          </div>
        </div>
      </div>

      ${formHtml}
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

export function getPrintStyles(settings = store.getSettings()) {
  const dt = settings.documentTheme || {
    preset: 'relay',
    accentColor: '#1B6DE0',
    headerBg: '#1E2A3A',
    accentTint: '#F8FAFC',
    fontFamily: 'sans-serif'
  };
  
  let fontImport = '';
  let fontStack = `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  
  if (dt.fontFamily === 'serif') {
    fontImport = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Lora:ital,wght@0,400..700;1,400..700&display=swap');`;
    fontStack = `'Lora', 'Playfair Display', Georgia, serif`;
  } else if (dt.fontFamily === 'monospace') {
    fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300..700&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');`;
    fontStack = `'Fira Code', 'JetBrains Mono', Courier, monospace`;
  } else if (dt.preset === 'electric') {
    fontImport = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');`;
    fontStack = `'Outfit', 'Inter', sans-serif`;
  }
  
  return `
    ${fontImport}
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: ${fontStack}; color: #1A2332; font-size: 12px; line-height: 1.5; }
    .pdf-page { padding: 40px 48px; max-width: 210mm; margin: 0 auto; }

    .pdf-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #E4E9F0; }
    .pdf-company { display: flex; gap: 14px; align-items: flex-start; }
    .pdf-logo { width: 44px; height: 44px; background: linear-gradient(135deg, ${dt.accentColor}, ${dt.accentColor}dd); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 22px; flex-shrink: 0; }
    .pdf-company-name { font-size: 18px; font-weight: 700; color: #1A2332; margin-bottom: 2px; }
    .pdf-company-detail { font-size: 11px; color: #5A6B7F; line-height: 1.6; }

    .pdf-title-block { text-align: right; }
    .pdf-doc-type { font-size: 24px; font-weight: 800; color: ${dt.accentColor}; letter-spacing: 1px; }
    .pdf-doc-number { font-size: 14px; color: #5A6B7F; margin: 2px 0 8px; font-weight: 500; }
    .pdf-status { display: inline-block; padding: 3px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

    .pdf-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 28px; padding: 20px; background: ${dt.accentTint}; border-radius: 8px; }
    .pdf-info-col { display: flex; flex-direction: column; gap: 6px; }
    .pdf-info-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #8A97A8; }
    .pdf-info-value { font-size: 12px; color: #1A2332; }
    .pdf-info-value-lg { font-size: 16px; font-weight: 700; color: #1A2332; }
    .pdf-info-row { display: flex; justify-content: space-between; align-items: center; }

    .pdf-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .pdf-table th { padding: 10px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: white; background: ${dt.headerBg}; text-align: left; }
    .pdf-table th:first-child { border-radius: 6px 0 0 0; }
    .pdf-table th:last-child { border-radius: 0 6px 0 0; }
    .pdf-table td { padding: 10px 12px; border-bottom: 1px solid #E4E9F0; font-size: 12px; }
    .pdf-table tbody tr:last-child td { border-bottom: 2px solid ${dt.headerBg}; }
    .pdf-table tbody tr:nth-child(even) { background: ${dt.accentTint}; }
    .pdf-type-tag { display: inline-block; padding: 1px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; background: ${dt.accentTint}; color: ${dt.accentColor}; border: 1px solid ${dt.accentColor}22; }

    .pdf-totals { margin-left: auto; width: 280px; margin-bottom: 32px; }
    .pdf-total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #5A6B7F; }
    .pdf-grand-total { border-top: 2px solid ${dt.headerBg}; padding-top: 12px; margin-top: 4px; font-size: 18px; font-weight: 800; color: #1A2332; }

    .pdf-notes { margin-bottom: 32px; padding: 16px; background: #FFFBEB; border-radius: 6px; border: 1px solid #FDE68A; }
    .pdf-notes-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #92400E; margin-bottom: 4px; }
    .pdf-notes-text { font-size: 12px; color: #78350F; line-height: 1.6; }

    .pdf-footer { margin-top: 40px; }
    .pdf-footer-line { height: 2px; background: linear-gradient(90deg, ${dt.accentColor}, ${dt.accentColor}88, ${dt.accentColor}); margin-bottom: 16px; border-radius: 1px; }
    .pdf-footer-text { font-size: 11px; color: #5A6B7F; line-height: 1.6; margin-bottom: 8px; }
    .pdf-footer-company { font-size: 10px; color: #8A97A8; font-weight: 500; }

    .pdf-payment-methods { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; padding: 16px; border: 1px solid #E4E9F0; border-radius: 6px; background: #FAFBFD; page-break-inside: avoid; }
    .pdf-payment-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${dt.accentColor}; margin-bottom: 6px; }
    .pdf-payment-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
    .pdf-payment-option { font-size: 11px; line-height: 1.5; color: #5A6B7F; }
    .pdf-payment-option strong { color: #1A2332; }

    .pdf-signature-block { display: flex; justify-content: space-between; margin-top: 32px; padding-top: 24px; border-top: 1px dashed #CBD5E1; page-break-inside: avoid; }
    .pdf-sig-line { width: 45%; }
    .pdf-sig-label { font-size: 10px; color: #8A97A8; margin-top: 4px; text-transform: uppercase; }
    .pdf-sig-space { height: 48px; border-bottom: 1px solid #94A3B8; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .pdf-page { padding: 20px 24px; }
    }
  `;
}

export function downloadFile(content, fileName, contentType) {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportFormAsCSV(data) {
  const rows = [
    ["Compliance Form Report"],
    ["Form Name", data.template.name],
    ["Job Reference", data.jobNumber],
    ["Customer", data.customerName],
    ["Submitted By", data.submittedByName || "—"],
    ["Date Submitted", data.submittedAt ? new Date(data.submittedAt).toLocaleDateString() : "—"],
    [],
    ["Section", "Field Name", "Field Type", "Response / Value"]
  ];

  (data.template.sections || []).forEach(sec => {
    if (sec.isSpacer) return;
    sec.fields.forEach(f => {
      if (f.type === 'spacer' || f.type === 'info' || f.type === 'blank') return;
      const responseVal = data.responses[f.id] ?? '';
      const formattedVal = f.type === 'checkbox' ? (responseVal ? 'Yes' : 'No') : responseVal;
      rows.push([sec.title, f.label, f.type, formattedVal]);
    });
  });

  const csvContent = rows
    .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  
  const fileName = `Form_${data.jobNumber}_${data.template.name.replace(/\s+/g, '_')}.csv`;
  downloadFile(csvContent, fileName, "text/csv;charset=utf-8;");
}

export function exportFormAsJSON(data) {
  const jsonContent = JSON.stringify({
    formInstanceId: data.id,
    jobId: data.jobId,
    jobNumber: data.jobNumber,
    customerName: data.customerName,
    submittedBy: data.submittedByName,
    submittedAt: data.submittedAt,
    formTemplate: {
      id: data.template.id,
      name: data.template.name,
      description: data.template.description,
      sections: data.template.sections
    },
    responses: data.responses
  }, null, 2);

  const fileName = `Form_${data.jobNumber}_${data.template.name.replace(/\s+/g, '_')}.json`;
  downloadFile(jsonContent, fileName, "application/json;charset=utf-8;");
}
