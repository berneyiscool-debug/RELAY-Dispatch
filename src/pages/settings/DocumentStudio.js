// ============================================
// RELAY — DOCUMENT STUDIO
// ============================================
// Full-width editor for the look of quotes and tax invoices. The controls live
// in a Word-style ribbon across the top; the document itself is the workspace —
// an A4 sheet on a grey canvas that repaints as you edit.
//
// Replaces the old Settings → "Quotes & Invoices" two-column control panel.

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';
import { getPrintStyles, generateDocument } from '../../components/PrintPreview.js';
import {
  enterEditorChrome, group, btn, valueBtn, seg, swatch, field, select, slider,
  tabStrip, bindTabs, openPopover, closePopover, textPopoverHTML, bindTextPopover,
  colorPopoverHTML, bindColorPopover, applyZoom, zoomControlHTML,
} from '../../components/DocEditor.js';

const PRESETS = [
  { key: 'relay', name: 'Relay', accentColor: '#FF5C00', headerBg: '#1E2A3A', accentTint: '#F8FAFC', fontFamily: 'sans-serif' },
  { key: 'classic', name: 'Classic', accentColor: '#0F172A', headerBg: '#1E293B', accentTint: '#F8FAFC', fontFamily: 'serif' },
  { key: 'forest', name: 'Forest', accentColor: '#16A34A', headerBg: '#1F2937', accentTint: '#F9FAFB', fontFamily: 'sans-serif' },
  { key: 'electric', name: 'Electric', accentColor: '#7C3AED', headerBg: '#111827', accentTint: '#F9FAFB', fontFamily: 'sans-serif' },
  { key: 'obsidian', name: 'Obsidian', accentColor: '#1E293B', headerBg: '#0F172A', accentTint: '#FAFBFB', fontFamily: 'monospace' },
  { key: 'terracotta', name: 'Terracotta', accentColor: '#C2410C', headerBg: '#451A03', accentTint: '#FFF7ED', fontFamily: 'sans-serif' },
  { key: 'nordic', name: 'Nordic', accentColor: '#0891B2', headerBg: '#0F172A', accentTint: '#F0FDFA', fontFamily: 'sans-serif' },
  { key: 'luxury', name: 'Velvet', accentColor: '#D97706', headerBg: '#311005', accentTint: '#FEF3C7', fontFamily: 'serif' },
  { key: 'steel', name: 'Steel', accentColor: '#475569', headerBg: '#1E293B', accentTint: '#F1F5F9', fontFamily: 'monospace' },
  { key: 'ballet', name: 'Ballet', accentColor: '#e58799', headerBg: '#5c2c36', accentTint: '#fff5f6', fontFamily: 'serif' },
];

const DEFAULTS = {
  preset: 'relay',
  accentColor: '#FF5C00',
  headerBg: '#1E2A3A',
  accentTint: '#F8FAFC',
  fontFamily: 'sans-serif',
  invoiceTerms: 'Please pay within 7 days of invoice issue.',
  invoicePaymentTerms: 'Payment via Direct Deposit:\nBSB: 123-456\nAccount: 78901234\nReference: [Invoice Number]',
  quoteTitle: 'PROPOSAL / QUOTE',
  quoteTerms: 'This quote is valid for 30 days. All work is subject to standard conditions.',
  logoAlignment: 'left',
  logoScale: 60,
  hideLogo: false,
  logoSource: 'large',
  hideCompanyName: false,
  hideBrandLogo: false,
  paymentStripe: true,
  paymentDirectTransfer: true,
  paymentCash: false,
  quoteSignature: true,
  footerNote: 'Thank you for your business!',
  invoicePrefix: 'INV-',
  invoiceStartingNumber: 1,
  quotePrefix: 'Q-',
  quoteStartingNumber: 1,
};

// Representative content so the sheet always shows a realistic document.
function sampleDoc() {
  const now = Date.now();
  return {
    number: 'INV-00023',
    status: 'Sent',
    customerName: 'Acme Developments Pty Ltd',
    contactName: 'Jane Smith',
    issueDate: new Date(now).toISOString(),
    validUntil: new Date(now + 30 * 864e5).toISOString(),
    dueDate: new Date(now + 7 * 864e5).toISOString(),
    jobNumber: 'J-00129',
    originalQuoteNumber: 'Q-00412',
    title: 'Emergency Electrical & Cabling Installation',
    notes: 'Please review all measurements. Standard technician notes and variations have been compiled accordingly.',
    subtotal: 1250.0,
    tax: 125.0,
    total: 1375.0,
    lineItems: [
      { description: 'Emergency Call-out Service Rate', type: 'labor', qty: 1, rate: 195.0, total: 195.0 },
      { description: 'Electrical Cabling Installation & Termination', type: 'labor', qty: 4, rate: 85.0, total: 340.0 },
      { description: 'Premium Circuit Breakers & Switchboards', type: 'material', qty: 3, rate: 150.0, total: 450.0 },
      { description: 'Sundry Fixings, Consumables & Conduit', type: 'material', qty: 1, rate: 265.0, total: 265.0 },
    ],
  };
}

export function renderDocumentStudio(container) {
  enterEditorChrome(container);

  const isLocalMode = !store.companyId || String(store.companyId).startsWith('acct_');
  const settings = store.getSettings() || {};
  const mockData = sampleDoc();

  let dt = { ...DEFAULTS, ...JSON.parse(JSON.stringify(settings.documentTheme || {})) };
  let saved = JSON.stringify(dt);
  let activeTab = 'design';
  let docType = 'invoice';
  let zoom = 100;

  const isDirty = () => JSON.stringify(dt) !== saved;

  // ── Ribbon content ──────────────────────────

  // Miniature of the document, so the gallery previews the result rather than
  // naming it. Mirrors the real layout: header band, title rule, body, totals.
  function presetThumb(p) {
    return `<span class="rde-gal-thumb" aria-hidden="true">
      <span style="display:block;height:9px;border-radius:2px;background:${p.headerBg}"></span>
      <span style="display:block;height:3px;width:42%;margin-top:5px;border-radius:1px;background:${p.accentColor}"></span>
      <span style="display:block;height:2px;width:84%;margin-top:4px;border-radius:1px;background:#dde2e8"></span>
      <span style="display:block;height:7px;margin-top:4px;border-radius:1px;background:${p.accentTint};border:1px solid #e7ebf0"></span>
    </span>`;
  }

  function galleryHTML() {
    const items = PRESETS.map(p => `
      <button type="button" class="rde-gal-item" data-preset="${p.key}"
        aria-pressed="${dt.preset === p.key ? 'true' : 'false'}" title="${escapeHTML(p.name)} theme">
        ${presetThumb(p)}<span class="rde-gal-name">${escapeHTML(p.name)}</span>
      </button>`).join('');
    const custom = `
      <button type="button" class="rde-gal-item" data-preset="custom"
        aria-pressed="${dt.preset === 'custom' ? 'true' : 'false'}" title="Your own colours and typeface">
        ${presetThumb(dt)}<span class="rde-gal-name">Custom</span>
      </button>`;
    return `<div class="rde-gal" id="ds-gallery">${items}${custom}</div>`;
  }

  function designTab() {
    return group('Document theme', galleryHTML())
      + group('Colours',
        swatch({ id: 'ds-c-accent', label: 'Accent', value: dt.accentColor })
        + swatch({ id: 'ds-c-header', label: 'Header', value: dt.headerBg })
        + swatch({ id: 'ds-c-tint', label: 'Tint', value: dt.accentTint }))
      + group('Typeface', seg({
        id: 'ds-font',
        value: dt.fontFamily,
        options: [
          { value: 'sans-serif', label: 'Aa', title: 'Sans-serif — Inter', style: "font-family:'Inter',sans-serif;font-size:14px" },
          { value: 'serif', label: 'Aa', title: 'Serif — Lora', style: 'font-family:Georgia,serif;font-size:14px' },
          { value: 'monospace', label: 'Aa', title: 'Monospace — Fira Code', style: 'font-family:monospace;font-size:13px' },
        ],
      }));
  }

  function brandingTab() {
    return group('Logo',
      btn({ id: 'ds-showlogo', label: 'Show logo', iconName: 'image', pressed: !dt.hideLogo })
      + btn({ id: 'ds-showname', label: 'Company name', iconName: 'title', pressed: !dt.hideCompanyName, disabled: !!dt.hideLogo })
      + select({ id: 'ds-logosrc', label: 'Variation', value: dt.logoSource || 'large', width: 118, disabled: !!dt.hideLogo,
        options: [{ value: 'large', label: 'Standard' }, { value: 'small', label: 'Small' }] }))
      + group('Placement', seg({
        id: 'ds-align',
        value: dt.logoAlignment || 'left',
        disabled: !!dt.hideLogo,
        options: [
          { value: 'left', iconName: 'format_align_left', title: 'Align left' },
          { value: 'center', iconName: 'format_align_center', title: 'Centre' },
          { value: 'right', iconName: 'format_align_right', title: 'Align right' },
        ],
      }) + slider({ id: 'ds-scale', label: 'Logo height', value: dt.logoScale || 60, min: 40, max: 120, suffix: 'px' }))
      + group('Footer', btn({
        id: 'ds-brandlogo',
        label: isLocalMode ? 'Relay badge' : (dt.hideBrandLogo ? 'Badge hidden' : 'Relay badge'),
        iconName: dt.hideBrandLogo ? 'visibility_off' : 'verified',
        pressed: !dt.hideBrandLogo,
        disabled: isLocalMode,
        title: isLocalMode ? 'Removing the Relay badge requires a cloud account' : 'Show or hide the Relay badge in document footers',
      }));
  }

  function contentTab() {
    return group('Document titles',
      field({ id: 'ds-quote-title', label: 'Quote', value: dt.quoteTitle, placeholder: 'PROPOSAL / QUOTE', width: 168 }))
      + group('Numbering',
        field({ id: 'ds-inv-prefix', label: 'Inv. prefix', value: dt.invoicePrefix, placeholder: 'INV-', width: 86 })
        + field({ id: 'ds-inv-start', label: 'Next no.', value: dt.invoiceStartingNumber, type: 'number', min: 1, width: 78 })
        + field({ id: 'ds-quote-prefix', label: 'Quote prefix', value: dt.quotePrefix, placeholder: 'Q-', width: 86 })
        + field({ id: 'ds-quote-start', label: 'Next no.', value: dt.quoteStartingNumber, type: 'number', min: 1, width: 78 }))
      + group('Terms & notes',
        valueBtn({ id: 'ds-inv-terms', iconName: 'gavel', label: 'Invoice terms', value: dt.invoiceTerms, placeholder: 'Standard wording' })
        + valueBtn({ id: 'ds-quote-terms', iconName: 'schedule', label: 'Quote terms', value: dt.quoteTerms, placeholder: 'Standard wording' })
        + valueBtn({ id: 'ds-footer-note', iconName: 'notes', label: 'Footer note', value: dt.footerNote, placeholder: 'None' }));
  }

  function paymentsTab() {
    return group('Accepted on invoices',
      btn({ id: 'ds-pay-card', label: 'Card', iconName: 'credit_card', pressed: !!dt.paymentStripe, title: 'Include an online card payment link' })
      + btn({ id: 'ds-pay-bank', label: 'Bank transfer', iconName: 'account_balance', pressed: !!dt.paymentDirectTransfer })
      + btn({ id: 'ds-pay-cash', label: 'Cash', iconName: 'payments', pressed: !!dt.paymentCash }))
      + group('Bank details', valueBtn({
        id: 'ds-bank', iconName: 'account_balance_wallet', label: 'Deposit details',
        value: dt.invoicePaymentTerms, placeholder: 'Not shown',
      }))
      + group('Quote sign-off', btn({
        id: 'ds-quote-sig', label: 'Signature block', iconName: 'draw', pressed: !!dt.quoteSignature,
        title: 'Add customer acceptance signature blocks to quotes',
      }));
  }

  const TABS = [
    { id: 'design', label: 'Design' },
    { id: 'branding', label: 'Branding' },
    { id: 'content', label: 'Content' },
    { id: 'payments', label: 'Payments' },
  ];

  function ribbonHTML() {
    const body = activeTab === 'design' ? designTab()
      : activeTab === 'branding' ? brandingTab()
      : activeTab === 'content' ? contentTab()
      : paymentsTab();
    return `<div class="rde-ribbon" id="ds-ribbon" role="tabpanel">${body}</div>`;
  }

  // ── Shell ───────────────────────────────────

  function shellHTML() {
    const docSwitch = seg({
      id: 'ds-doctype',
      value: docType,
      options: [
        { value: 'invoice', label: 'Tax invoice', iconName: 'receipt_long' },
        { value: 'quote', label: 'Quote', iconName: 'request_quote' },
      ],
    });

    return `
      <div class="rde" style="--rde-sheet-w:210mm">
        <div class="rde-cmd">
          <button type="button" class="rde-cmd-back" id="ds-back" title="Back to Settings" aria-label="Back to Settings">
            <span class="material-icons-outlined">arrow_back</span>
          </button>
          <div class="rde-cmd-id">
            <span class="rde-cmd-title">Document Studio</span>
            <span class="rde-cmd-sub">Quotes &amp; tax invoices</span>
          </div>
          <span class="rde-cmd-spacer"></span>
          <div class="rde-cmd-actions">
            <span class="rde-dirty" id="ds-dirty" hidden>Unsaved changes</span>
            <button class="btn btn-secondary btn-sm" id="ds-reset">Reset to defaults</button>
            <button class="btn btn-primary btn-sm" id="ds-save">
              <span class="material-icons-outlined" style="font-size:16px">save</span> Save
            </button>
          </div>
        </div>

        ${tabStrip(TABS, activeTab, docSwitch)}
        ${ribbonHTML()}

        <div class="rde-canvas" id="ds-canvas">
          <div class="rde-stage" id="ds-stage">
            <div class="rde-sheet">
              <iframe class="rde-sheet-frame" id="ds-frame" title="Document preview" style="height:1123px"></iframe>
            </div>
            <div class="rde-sheet-cap">A4 · sample data</div>
          </div>
        </div>

        <div class="rde-status">
          <span id="ds-status-doc">Tax invoice</span>
          <span>·</span>
          <span>Changes apply to every quote and invoice you send</span>
          ${zoomControlHTML('ds-zoom', zoom)}
        </div>
      </div>`;
  }

  // ── Preview ─────────────────────────────────

  const previewStyles = () => `
    ${getPrintStyles({ ...settings, documentTheme: { ...dt } })}
    html, body { background:#fff; }
    .pdf-page { margin:0 auto; }
  `;

  // Grow the iframe to its content so the canvas — not the frame — does the
  // scrolling, and the sheet reads as one continuous page.
  function fitFrame() {
    const frame = container.querySelector('#ds-frame');
    const doc = frame && (frame.contentDocument || frame.contentWindow?.document);
    if (!doc || !doc.body) return;
    const h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, 1123);
    frame.style.height = `${h}px`;
  }

  function reloadPreview() {
    const frame = container.querySelector('#ds-frame');
    if (!frame) return;
    frame.onload = () => {
      frame.onload = null;
      fitFrame();
      patchPreview();
    };
    frame.srcdoc = `<!DOCTYPE html><html><head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style id="theme-preview-styles">${previewStyles()}</style>
      </head><body style="margin:0;background:#fff">
        <div id="document-content-wrapper">${generateDocument(docType, mockData)}</div>
      </body></html>`;
  }

  // Live edits patch the existing document instead of reloading it, so the
  // canvas never flickers or loses its scroll position mid-edit.
  function patchPreview() {
    const frame = container.querySelector('#ds-frame');
    const d = frame && (frame.contentDocument || frame.contentWindow?.document);
    if (!d || !d.getElementById('document-content-wrapper')) { reloadPreview(); return; }

    const styleTag = d.getElementById('theme-preview-styles');
    if (styleTag) styleTag.innerHTML = previewStyles();

    const docTypeEl = d.querySelector('.pdf-doc-type');
    if (docTypeEl) {
      docTypeEl.textContent = docType === 'quote'
        ? (dt.quoteTitle || DEFAULTS.quoteTitle)
        : (settings.taxEnabled !== false ? 'TAX INVOICE' : 'INVOICE');
    }

    const headerEl = d.querySelector('.pdf-header');
    const companyEl = d.querySelector('.pdf-company');
    if (headerEl && companyEl) {
      let headerStyle = 'display:flex; justify-content:space-between; align-items:flex-start;';
      let companyStyle = 'display:flex; gap:14px; align-items:flex-start;';
      let titleStyle = 'text-align:right;';
      if (dt.logoAlignment === 'right') {
        companyStyle = 'display:flex; gap:14px; align-items:flex-start; flex-direction:row-reverse; text-align:right;';
      } else if (dt.logoAlignment === 'center') {
        headerStyle = 'display:flex; flex-direction:column; align-items:center; gap:20px; border-bottom:2px solid #E4E9F0; padding-bottom:24px; margin-bottom:32px;';
        companyStyle = 'display:flex; flex-direction:column; align-items:center; text-align:center; gap:8px;';
        titleStyle = 'text-align:center; margin-top:10px;';
      }
      headerEl.style.cssText = headerStyle;
      companyEl.style.cssText = companyStyle;
      const titleBlock = d.querySelector('.pdf-title-block');
      if (titleBlock) titleBlock.style.cssText = titleStyle;
    }

    const logoImg = d.querySelector('.pdf-logo-img');
    const logoBadge = d.querySelector('.pdf-logo');
    const logoText = d.querySelector('.pdf-logo-text');
    if (dt.hideLogo) {
      if (logoImg) logoImg.style.display = 'none';
      if (logoBadge) logoBadge.style.display = 'none';
      if (logoText) {
        logoText.style.display = 'block';
        logoText.style.color = dt.accentColor || DEFAULTS.accentColor;
      }
    } else {
      if (logoText) logoText.style.display = 'none';
      const logoUrl = dt.logoSource === 'small'
        ? (settings.logoSmall || settings.logo)
        : (settings.logo || settings.logoSmall);
      if (logoImg) {
        logoImg.style.display = 'block';
        logoImg.src = logoUrl || '';
        logoImg.style.maxHeight = `${dt.logoScale ?? 60}px`;
      }
      if (logoBadge) {
        logoBadge.style.display = 'flex';
        logoBadge.style.background = `linear-gradient(135deg, ${dt.accentColor}, ${dt.accentColor}dd)`;
      }
    }

    const companyNameEl = d.querySelector('.pdf-company-name');
    if (companyNameEl) companyNameEl.style.display = dt.hideCompanyName ? 'none' : 'block';

    const paymentSection = d.querySelector('.pdf-payment-methods');
    if (paymentSection) {
      const show = docType === 'invoice' && (dt.paymentStripe || dt.paymentDirectTransfer || dt.paymentCash);
      paymentSection.style.display = show ? 'block' : 'none';

      const stripeOption = paymentSection.querySelector('.pdf-payment-option-stripe');
      if (stripeOption) {
        stripeOption.style.display = dt.paymentStripe ? 'block' : 'none';
        const payBtn = stripeOption.querySelector('a');
        if (payBtn) payBtn.style.background = dt.accentColor || DEFAULTS.accentColor;
      }
      const directOption = paymentSection.querySelector('.pdf-payment-option-direct');
      if (directOption) {
        directOption.style.display = dt.paymentDirectTransfer ? 'block' : 'none';
        const bank = directOption.querySelector('.pdf-bank-details');
        if (bank) bank.innerHTML = escapeHTML(dt.invoicePaymentTerms || '').replace(/\n/g, '<br/>');
      }
      const cashOption = paymentSection.querySelector('.pdf-payment-option-cash');
      if (cashOption) cashOption.style.display = dt.paymentCash ? 'block' : 'none';
    }

    const sig = d.querySelector('.pdf-signature-block');
    if (sig) sig.style.display = (docType === 'quote' && dt.quoteSignature) ? 'flex' : 'none';

    const footerText = d.querySelector('.pdf-footer-text');
    if (footerText) {
      footerText.textContent = docType === 'quote'
        ? (dt.quoteTerms || DEFAULTS.quoteTerms)
        : (dt.invoiceTerms || DEFAULTS.invoiceTerms);
    }
    const footerNote = d.querySelector('.pdf-footer-note');
    if (footerNote) {
      footerNote.style.display = dt.footerNote ? 'block' : 'none';
      footerNote.textContent = dt.footerNote || '';
    }
    const footerBranding = d.querySelector('.pdf-footer-branding');
    if (footerBranding) {
      footerBranding.style.display = (!isLocalMode && dt.hideBrandLogo) ? 'none' : 'flex';
    }

    fitFrame();
  }

  // ── Change plumbing ─────────────────────────

  function markDirty() {
    const el = container.querySelector('#ds-dirty');
    if (el) el.hidden = !isDirty();
  }

  // Every edit goes through here: repaint the sheet, refresh the dirty flag.
  function change(patch, { rerenderRibbon = false } = {}) {
    Object.assign(dt, patch);
    markDirty();
    if (rerenderRibbon) renderRibbon();
    patchPreview();
  }

  // Editing a colour or typeface moves the document off its named theme, so the
  // gallery stops claiming a preset the document no longer matches.
  function customise(patch) {
    change({ ...patch, preset: 'custom' }, { rerenderRibbon: true });
  }

  function renderRibbon() {
    const old = container.querySelector('#ds-ribbon');
    if (!old) return;
    const scrollLeft = old.scrollLeft;
    old.outerHTML = ribbonHTML();
    const fresh = container.querySelector('#ds-ribbon');
    if (fresh) fresh.scrollLeft = scrollLeft;
    bindRibbon();
  }

  function bindRibbon() {
    const q = (sel) => container.querySelector(sel);

    // Theme gallery
    container.querySelectorAll('#ds-gallery .rde-gal-item').forEach(item => {
      item.addEventListener('click', () => {
        const key = item.dataset.preset;
        if (key === 'custom') { change({ preset: 'custom' }, { rerenderRibbon: true }); return; }
        const p = PRESETS.find(x => x.key === key);
        change({
          preset: key,
          accentColor: p.accentColor,
          headerBg: p.headerBg,
          accentTint: p.accentTint,
          fontFamily: p.fontFamily,
        }, { rerenderRibbon: true });
      });
    });

    // Colours
    const colorBtn = (id, prop, title, hint) => {
      q(id)?.addEventListener('click', (e) => {
        openPopover(e.currentTarget, colorPopoverHTML({ title, hint, value: dt[prop] }), (panel, close) => {
          bindColorPopover(panel, close, (v) => {
            dt[prop] = v;
            dt.preset = 'custom';
            const chip = q(id)?.querySelector('.rde-sw-chip');
            if (chip) chip.style.background = v;
            markDirty();
            patchPreview();
          });
        });
      });
    };
    colorBtn('#ds-c-accent', 'accentColor', 'Accent colour', 'Document title, totals and the pay button.');
    colorBtn('#ds-c-header', 'headerBg', 'Header fill', 'Background behind the line-item table header.');
    colorBtn('#ds-c-tint', 'accentTint', 'Tint', 'Soft background for summary and totals panels.');

    // Typeface
    q('#ds-font')?.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => customise({ fontFamily: b.dataset.value }));
    });

    // Branding
    q('#ds-showlogo')?.addEventListener('click', () => change({ hideLogo: !dt.hideLogo }, { rerenderRibbon: true }));
    q('#ds-showname')?.addEventListener('click', () => change({ hideCompanyName: !dt.hideCompanyName }, { rerenderRibbon: true }));
    q('#ds-logosrc')?.addEventListener('change', (e) => change({ logoSource: e.target.value }));
    q('#ds-align')?.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => change({ logoAlignment: b.dataset.value }, { rerenderRibbon: true }));
    });
    const scale = q('#ds-scale');
    scale?.addEventListener('input', () => {
      const val = parseInt(scale.value, 10);
      const label = q('#ds-scale-val');
      if (label) label.textContent = `${val}px`;
      change({ logoScale: val });
    });
    q('#ds-brandlogo')?.addEventListener('click', () => change({ hideBrandLogo: !dt.hideBrandLogo }, { rerenderRibbon: true }));

    // Content — short values edit in place
    const textField = (id, prop) => q(id)?.addEventListener('input', (e) => change({ [prop]: e.target.value }));
    textField('#ds-quote-title', 'quoteTitle');
    textField('#ds-inv-prefix', 'invoicePrefix');
    textField('#ds-quote-prefix', 'quotePrefix');
    const numField = (id, prop) => q(id)?.addEventListener('input', (e) => {
      const n = parseInt(e.target.value, 10);
      change({ [prop]: Number.isFinite(n) && n > 0 ? n : 1 });
    });
    numField('#ds-inv-start', 'invoiceStartingNumber');
    numField('#ds-quote-start', 'quoteStartingNumber');

    // Content — long values open a panel
    const longText = (id, prop, title, hint, placeholder) => {
      q(id)?.addEventListener('click', (e) => {
        const trigger = e.currentTarget;
        openPopover(trigger, textPopoverHTML({ title, hint, value: dt[prop], placeholder, rows: 5 }), (panel, close) => {
          bindTextPopover(panel, close, {
            onInput: (v) => {
              dt[prop] = v;
              const valEl = trigger.querySelector('.rde-b-val-v');
              if (valEl) {
                const empty = !v.trim();
                valEl.textContent = empty ? (placeholder || 'Default') : v.replace(/\s+/g, ' ').trim().slice(0, 34);
                valEl.classList.toggle('is-default', empty);
              }
              markDirty();
              patchPreview();
            },
          });
        });
      });
    };
    longText('#ds-inv-terms', 'invoiceTerms', 'Invoice terms', 'Printed in the invoice footer. Leave blank for the standard wording.', 'Standard wording');
    longText('#ds-quote-terms', 'quoteTerms', 'Quote terms', 'Printed in the quote footer. Leave blank for the standard wording.', 'Standard wording');
    longText('#ds-footer-note', 'footerNote', 'Footer note', 'A closing line under the terms on every document.', 'None');
    longText('#ds-bank', 'invoicePaymentTerms', 'Direct deposit details', 'Shown on invoices when bank transfer is accepted.', 'Not shown');

    // Payments
    q('#ds-pay-card')?.addEventListener('click', () => change({ paymentStripe: !dt.paymentStripe }, { rerenderRibbon: true }));
    q('#ds-pay-bank')?.addEventListener('click', () => change({ paymentDirectTransfer: !dt.paymentDirectTransfer }, { rerenderRibbon: true }));
    q('#ds-pay-cash')?.addEventListener('click', () => change({ paymentCash: !dt.paymentCash }, { rerenderRibbon: true }));
    q('#ds-quote-sig')?.addEventListener('click', () => change({ quoteSignature: !dt.quoteSignature }, { rerenderRibbon: true }));
  }

  function bindShell() {
    container.querySelector('#ds-back')?.addEventListener('click', () => {
      closePopover();
      router.navigate('/settings?tab=invoices_quotes');
    });

    bindTabs(container, (id) => {
      if (id === activeTab) return;
      activeTab = id;
      closePopover();
      container.querySelectorAll('.rde-tab').forEach(t => {
        t.setAttribute('aria-selected', t.dataset.tab === id ? 'true' : 'false');
      });
      renderRibbon();
    });

    container.querySelector('#ds-doctype')?.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => {
        if (docType === b.dataset.value) return;
        docType = b.dataset.value;
        container.querySelectorAll('#ds-doctype button').forEach(x => {
          x.setAttribute('aria-pressed', x.dataset.value === docType ? 'true' : 'false');
        });
        const label = container.querySelector('#ds-status-doc');
        if (label) label.textContent = docType === 'quote' ? 'Quote' : 'Tax invoice';
        reloadPreview();
      });
    });

    const zoomSel = container.querySelector('#ds-zoom');
    zoomSel?.addEventListener('change', () => {
      zoom = parseInt(zoomSel.value, 10);
      applyZoom(container.querySelector('#ds-stage'), zoom);
    });

    container.querySelector('#ds-save')?.addEventListener('click', async (e) => {
      const b = e.currentTarget;
      const original = b.innerHTML;
      b.disabled = true;
      b.innerHTML = '<span class="material-icons-outlined" style="font-size:16px">sync</span> Saving…';
      try {
        const fresh = store.getSettings() || {};
        fresh.documentTheme = { ...dt };
        await store.saveSettings(fresh);
        saved = JSON.stringify(dt);
        markDirty();
        showToast('Document design saved', 'success');
      } catch (err) {
        console.error('Error saving document theme:', err);
        showToast(`Could not save: ${err.message || err}`, 'error');
      } finally {
        b.disabled = false;
        b.innerHTML = original;
      }
    });

    container.querySelector('#ds-reset')?.addEventListener('click', () => {
      if (!confirm('Reset the quote and invoice design back to the RELAY defaults?')) return;
      dt = { ...DEFAULTS };
      markDirty();
      renderRibbon();
      reloadPreview();
    });
  }

  // ── Init ────────────────────────────────────
  container.innerHTML = shellHTML();
  bindShell();
  bindRibbon();
  reloadPreview();
}
