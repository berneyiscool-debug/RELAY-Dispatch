// ============================================
// RELAY — LEGAL PAGES (in-app)
// ============================================
// Renders the documents in ./content.js — the same source the static pages on
// relaydispatch.com.au are built from (scripts/build-legal-pages.mjs), so the
// app and the website can never disagree. All four routes are public: someone
// still mid-signup must be able to read them without an account.

import { router } from '../../router.js';
import { applyTheme } from '../../utils/theme.js';
import { DOCS, DOC_ORDER, ENTITY, renderBlocks } from './content.js';

const docHref = (key) => `#/${key}`;

const STYLE = `
  .legal-page { max-width: 820px; margin: 0 auto; padding: 32px 20px 72px; line-height: 1.65; }
  .legal-page h1 { margin: 0; font-size: 28px; }
  .legal-page h2 { font-size: 17px; margin: 32px 0 8px; scroll-margin-top: 16px; }
  .legal-page p, .legal-page li { color: var(--text-secondary); font-size: 14.5px; }
  .legal-page p { margin: 0 0 10px; }
  .legal-page ul { margin: 0 0 12px; padding-left: 22px; list-style: disc; }
  .legal-page ol.legal-toc { list-style: decimal; }
  .legal-page li { margin-bottom: 6px; display: list-item; }
  .legal-page a { color: var(--color-primary, #FF5C00); font-weight: 600; text-decoration: none; }
  .legal-page a:hover { text-decoration: underline; }
  .legal-tabs { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 24px; }
  .legal-tabs a { font-size: 13px; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--border-color); color: var(--text-secondary); font-weight: 500; }
  .legal-tabs a.active { background: var(--color-primary, #FF5C00); border-color: var(--color-primary, #FF5C00); color: #fff; }
  .legal-meta { font-size: 13px; color: var(--text-tertiary); margin: 6px 0 20px; }
  .legal-plain { border: 1px solid var(--border-color); border-left: 3px solid var(--color-primary, #FF5C00); border-radius: 8px; padding: 14px 18px; margin: 0 0 20px; background: var(--bg-secondary, transparent); }
  .legal-plain strong { display: block; margin-bottom: 6px; font-size: 13px; text-transform: uppercase; letter-spacing: .04em; }
  .legal-plain ul { margin: 0; }
  .legal-toc { columns: 2; column-gap: 24px; font-size: 13.5px; margin: 0 0 8px; padding-left: 18px; }
  .legal-toc li { break-inside: avoid; margin-bottom: 4px; }
  .legal-toc a { font-weight: 500; }
  .legal-table-wrap { overflow-x: auto; margin: 4px 0 14px; }
  .legal-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  .legal-table th, .legal-table td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--border-color); vertical-align: top; }
  .legal-table th { color: var(--text-primary); font-weight: 600; }
  .legal-table td { color: var(--text-secondary); }
  @media (max-width: 600px) { .legal-toc { columns: 1; } }
`;

function renderDoc(container, key) {
  const doc = DOCS[key];
  applyTheme(null);

  container.innerHTML = `
    <style>${STYLE}</style>
    <div class="legal-page">
      <button class="btn btn-secondary" id="legal-back" style="margin-bottom:20px;">
        <span class="material-icons-outlined" style="font-size:18px;vertical-align:middle;margin-right:6px;">arrow_back</span>Back
      </button>
      <nav class="legal-tabs" aria-label="Legal documents">
        ${DOC_ORDER.map((k) => `<a href="${docHref(k)}" class="${k === key ? 'active' : ''}">${DOCS[k].title}</a>`).join('')}
      </nav>
      <div style="display:flex;align-items:center;gap:12px;">
        <span class="material-icons-outlined" style="font-size:32px;color:var(--color-primary,#FF5C00);">${doc.icon}</span>
        <h1>${doc.title}</h1>
      </div>
      <div class="legal-meta">Effective ${ENTITY.effectiveDate} · ${ENTITY.legalName}</div>
      <p>${doc.summary}</p>
      <div class="legal-plain">
        <strong>The short version</strong>
        <ul>${doc.plain.map((p) => `<li>${p}</li>`).join('')}</ul>
      </div>
      <p style="font-size:13px;color:var(--text-tertiary);">The short version is a guide only. The full text below is what applies.</p>
      <ol class="legal-toc">
        ${doc.sections.map((s) => `<li><a href="#" data-jump="${s.id}">${s.heading.replace(/^\d+\.\s*/, '')}</a></li>`).join('')}
      </ol>
      ${doc.sections.map((s) => `
        <section>
          <h2 id="legal-${s.id}">${s.heading}</h2>
          ${renderBlocks(s.blocks, docHref)}
        </section>`).join('')}
    </div>`;

  // The router owns the hash, so in-page jumps scroll instead of navigating.
  container.querySelectorAll('[data-jump]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      container.querySelector(`#legal-${a.dataset.jump}`)?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  container.querySelector('#legal-back').addEventListener('click', () => {
    // These links open in a new tab from the signup form, so going back is the
    // right exit. Falling back to login covers a direct visit.
    if (window.history.length > 1) {
      window.history.back();
    } else {
      router.navigate('/login');
    }
  });

  window.scrollTo?.(0, 0);
}

export function renderTerms(container) {
  renderDoc(container, 'terms');
}

export function renderPrivacy(container) {
  renderDoc(container, 'privacy');
}

export function renderRefunds(container) {
  renderDoc(container, 'refunds');
}

export function renderAcceptableUse(container) {
  renderDoc(container, 'acceptable-use');
}
