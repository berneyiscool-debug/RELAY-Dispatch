// ============================================
// RELAY — EMAIL STUDIO
// ============================================
// Full-width editor for the transactional emails RELAY sends. Same shape as the
// Document Studio: ribbon of grouped controls on top, the message itself as the
// workspace — rendered the way it lands in the customer's inbox, with the
// subject line editable where it actually appears.
//
// Replaces the old Settings → "Email Templates" form-and-preview split.

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';
import { emailSettings } from '../../utils/email.js';
import { EMAIL_TEMPLATES, previewEmail } from '../../utils/emailTemplates.js';
import {
  enterEditorChrome, group, btn, valueBtn, swatch, field,
  tabStrip, bindTabs, openPopover, closePopover, textPopoverHTML, bindTextPopover,
  colorPopoverHTML, bindColorPopover, applyZoom, zoomControlHTML, oneLine,
} from '../../components/DocEditor.js';

const TEMPLATE_ICONS = {
  quote: 'request_quote',
  invoice: 'receipt_long',
  receipt: 'task_alt',
  reminder: 'notifications_active',
  portal_invite: 'link',
};

export function renderEmailStudio(container) {
  enterEditorChrome(container);

  const isCloud = !!(store.companyId && !String(store.companyId).startsWith('acct_'));
  if (!isCloud) {
    container.innerHTML = `
      <div class="rde">
        <div class="rde-cmd">
          <button type="button" class="rde-cmd-back" id="es-back" title="Back to Settings" aria-label="Back to Settings">
            <span class="material-icons-outlined">arrow_back</span>
          </button>
          <div class="rde-cmd-id"><span class="rde-cmd-title">Email Templates</span></div>
        </div>
        <div class="rde-locked">
          <span class="material-icons-outlined">cloud_off</span>
          <h2>Email personalisation is a cloud feature</h2>
          <p>Sending email needs a cloud account. Upgrade to customise the wording, branding and
             subject lines of the quotes, invoices and reminders RELAY sends on your behalf.</p>
        </div>
      </div>`;
    container.querySelector('#es-back')?.addEventListener('click', () => router.navigate('/settings?tab=email_templates'));
    return;
  }

  const settings = store.getSettings() || {};
  const dtheme = settings.documentTheme || {};
  const mailer = emailSettings();

  const draft = {
    branding: { ...(mailer.branding || {}) },
    templates: JSON.parse(JSON.stringify(mailer.templates || {})),
  };
  // Fall back to the document theme so a new account's emails already match the
  // paperwork instead of starting on RELAY's own colours.
  if (draft.branding.headerBg === undefined) draft.branding.headerBg = dtheme.headerBg || '#1E2A3A';
  if (draft.branding.accent === undefined) draft.branding.accent = dtheme.accentColor || '#FF5C00';

  let saved = JSON.stringify(draft);
  let activeType = 'invoice';
  let activeTab = 'message';
  let zoom = 100;

  const isDirty = () => JSON.stringify(draft) !== saved;
  const meta = () => EMAIL_TEMPLATES.find(t => t.key === activeType) || EMAIL_TEMPLATES[0];
  const tpl = () => (draft.templates[activeType] ||= {});
  const override = () => ({ branding: { ...draft.branding }, template: { ...(draft.templates[activeType] || {}) } });

  // The subject RELAY would use if this template had no custom subject — shown
  // as the placeholder so the field reads as "override me", not "empty".
  function defaultSubject() {
    const t = { ...(draft.templates[activeType] || {}) };
    delete t.subject;
    return previewEmail(activeType, { branding: { ...draft.branding }, template: t }).subject;
  }

  // ── Ribbon ──────────────────────────────────

  function templateThumb() {
    const head = draft.branding.headerBg || '#1E2A3A';
    const accent = draft.branding.accent || '#FF5C00';
    return `<span class="rde-gal-thumb" aria-hidden="true" style="background:#eef1f4">
      <span style="display:block;height:8px;border-radius:2px 2px 0 0;background:${head}"></span>
      <span style="display:block;background:#fff;padding:3px 4px 4px;border-radius:0 0 2px 2px">
        <span style="display:block;height:3px;width:52%;border-radius:1px;background:#c9d0d8"></span>
        <span style="display:block;height:2px;width:88%;margin-top:3px;border-radius:1px;background:#e3e7ec"></span>
        <span style="display:block;height:6px;width:40%;margin-top:4px;border-radius:2px;background:${accent}"></span>
      </span>
    </span>`;
  }

  function galleryHTML() {
    return `<div class="rde-gal" id="es-gallery">${EMAIL_TEMPLATES.map(t => `
      <button type="button" class="rde-gal-item" data-key="${t.key}"
        aria-pressed="${t.key === activeType ? 'true' : 'false'}" title="${escapeHTML(t.label)} email">
        ${templateThumb()}<span class="rde-gal-name">${escapeHTML(t.label)}</span>
      </button>`).join('')}</div>`;
  }

  function messageTab() {
    const t = tpl();
    const m = meta();
    const customised = !!(t.subject || t.intro || t.note || t.ctaLabel);
    return group('Email', galleryHTML())
      + group('Wording',
        valueBtn({ id: 'es-intro', iconName: 'waving_hand', label: 'Opening', value: t.intro, placeholder: 'Standard greeting' })
        + valueBtn({ id: 'es-note', iconName: 'notes', label: 'Closing note', value: t.note, placeholder: 'Standard note' })
        + (m.cta ? valueBtn({ id: 'es-cta', iconName: 'smart_button', label: 'Button label', value: t.ctaLabel, placeholder: 'Standard label' }) : ''))
      + group('This email', btn({
        id: 'es-revert', label: 'Revert wording', iconName: 'restart_alt', disabled: !customised,
        title: customised ? `Clear your custom wording for the ${m.label.toLowerCase()} email` : 'This email already uses the standard wording',
      }));
  }

  function brandTab() {
    return group('Header',
      btn({ id: 'es-logo', label: 'Show logo', iconName: 'image', pressed: !!draft.branding.useLogo,
        title: draft.branding.useLogo ? 'Showing your logo' : 'Showing your company name as text' })
      + swatch({ id: 'es-c-header', label: 'Header', value: draft.branding.headerBg })
      + swatch({ id: 'es-c-accent', label: 'Button', value: draft.branding.accent }))
      + group('Footer line', field({
        id: 'es-footer', srLabel: 'Footer line', value: draft.branding.footer || '',
        placeholder: `${settings.name || 'Your company'} • 02 4900 0000`, width: 280,
      }));
  }

  const TABS = [
    { id: 'message', label: 'Message' },
    { id: 'brand', label: 'Brand' },
  ];

  function ribbonHTML() {
    return `<div class="rde-ribbon" id="es-ribbon" role="tabpanel">${activeTab === 'message' ? messageTab() : brandTab()}</div>`;
  }

  // ── Shell ───────────────────────────────────

  function shellHTML() {
    const company = settings.name || 'Your company';
    return `
      <div class="rde" style="--rde-sheet-w:700px">
        <div class="rde-cmd">
          <button type="button" class="rde-cmd-back" id="es-back" title="Back to Settings" aria-label="Back to Settings">
            <span class="material-icons-outlined">arrow_back</span>
          </button>
          <div class="rde-cmd-id">
            <span class="rde-cmd-title">Email Templates</span>
            <span class="rde-cmd-sub">What your customers receive</span>
          </div>
          <span class="rde-cmd-spacer"></span>
          <div class="rde-cmd-actions">
            <span class="rde-dirty" id="es-dirty" hidden>Unsaved changes</span>
            <button class="btn btn-primary btn-sm" id="es-save">
              <span class="material-icons-outlined" style="font-size:16px">save</span> Save
            </button>
          </div>
        </div>

        ${tabStrip(TABS, activeTab)}
        ${ribbonHTML()}

        <div class="rde-canvas" id="es-canvas">
          <div class="rde-stage" id="es-stage">
            <div class="rde-sheet">
              <div class="rde-mailhead">
                <span class="rde-mailhead-avatar" id="es-avatar">${escapeHTML(initials(company))}</span>
                <div class="rde-mailhead-body">
                  <input class="rde-mailhead-subject" id="es-subject" spellcheck="false"
                    aria-label="Subject line" value="" placeholder="" />
                  <div class="rde-mailhead-meta">
                    <strong>${escapeHTML(company)}</strong> to Jane Smith
                    <button type="button" class="rde-mailhead-vars" id="es-subject-vars" title="Insert a merge variable into the subject">
                      <span class="material-icons-outlined" style="font-size:15px">data_object</span> Variables
                    </button>
                  </div>
                </div>
              </div>
              <iframe class="rde-sheet-frame" id="es-frame" title="Email preview" style="height:640px;background:#f3f5f7"></iframe>
            </div>
            <div class="rde-sheet-cap">Preview uses sample data · click the greeting or closing note to edit</div>
          </div>
        </div>

        <div class="rde-status">
          <span id="es-status">Invoice email</span>
          <span>·</span>
          <span>Blank fields fall back to RELAY's standard wording</span>
          ${zoomControlHTML('es-zoom', zoom)}
        </div>
      </div>`;
  }

  function initials(name) {
    return String(name || 'R').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  // ── Preview ─────────────────────────────────

  function fitFrame() {
    const frame = container.querySelector('#es-frame');
    const doc = frame && (frame.contentDocument || frame.contentWindow?.document);
    if (!doc || !doc.body) return;
    frame.style.height = `${Math.max(doc.body.scrollHeight, 420)}px`;
  }

  function refreshPreview() {
    const frame = container.querySelector('#es-frame');
    if (!frame) return;
    const { subject, html } = previewEmail(activeType, override());

    const subjectInput = container.querySelector('#es-subject');
    if (subjectInput && document.activeElement !== subjectInput) {
      subjectInput.value = tpl().subject || '';
    }
    if (subjectInput) subjectInput.placeholder = tpl().subject ? '' : subject;

    frame.onload = () => { frame.onload = null; fitFrame(); wireInlineEditing(); };
    frame.srcdoc = html;
  }

  // Clicking the greeting or the closing note in the preview jumps to the
  // matching ribbon control, so the message is the thing you interact with.
  function wireInlineEditing() {
    const frame = container.querySelector('#es-frame');
    const d = frame && (frame.contentDocument || frame.contentWindow?.document);
    if (!d || !d.body) return;

    // The body copy lives in the card's <p> elements: first is the greeting,
    // last is the closing note (they're the same element when there's only one).
    const paras = [...d.querySelectorAll('p')];
    if (!paras.length) return;
    const targets = new Map();
    targets.set(paras[0], 'intro');
    if (paras.length > 1) targets.set(paras[paras.length - 1], 'note');

    const style = d.createElement('style');
    style.textContent = `
      [data-relay-edit] { cursor:text; border-radius:4px; box-shadow:0 0 0 0 rgba(255,92,0,0); transition:box-shadow .12s ease, background .12s ease; }
      [data-relay-edit]:hover { background:rgba(255,92,0,.06); box-shadow:0 0 0 4px rgba(255,92,0,.06); }`;
    d.head?.appendChild(style);

    targets.forEach((kind, el) => {
      el.setAttribute('data-relay-edit', kind);
      el.title = kind === 'intro' ? 'Click to edit the greeting' : 'Click to edit the closing note';
      el.addEventListener('click', () => {
        if (activeTab !== 'message') {
          activeTab = 'message';
          syncTabs();
          renderRibbon();
        }
        const trigger = container.querySelector(kind === 'intro' ? '#es-intro' : '#es-note');
        if (trigger) { trigger.scrollIntoView({ block: 'nearest', inline: 'nearest' }); trigger.click(); }
      });
    });
  }

  // ── Change plumbing ─────────────────────────

  function markDirty() {
    const el = container.querySelector('#es-dirty');
    if (el) el.hidden = !isDirty();
  }

  function syncTabs() {
    container.querySelectorAll('.rde-tab').forEach(t => {
      t.setAttribute('aria-selected', t.dataset.tab === activeTab ? 'true' : 'false');
    });
  }

  function renderRibbon() {
    const old = container.querySelector('#es-ribbon');
    if (!old) return;
    const scrollLeft = old.scrollLeft;
    old.outerHTML = ribbonHTML();
    const fresh = container.querySelector('#es-ribbon');
    if (fresh) fresh.scrollLeft = scrollLeft;
    bindRibbon();
  }

  function bindRibbon() {
    const q = (sel) => container.querySelector(sel);

    container.querySelectorAll('#es-gallery .rde-gal-item').forEach(item => {
      item.addEventListener('click', () => {
        if (item.dataset.key === activeType) return;
        activeType = item.dataset.key;
        closePopover();
        const label = container.querySelector('#es-status');
        if (label) label.textContent = `${meta().label} email`;
        renderRibbon();
        refreshPreview();
      });
    });

    const wording = (id, key, title, hint, placeholder, rows) => {
      q(id)?.addEventListener('click', (e) => {
        const trigger = e.currentTarget;
        openPopover(trigger, textPopoverHTML({
          title, hint, value: tpl()[key] || '', placeholder, rows: rows || 4, vars: meta().vars,
        }), (panel, close) => {
          bindTextPopover(panel, close, {
            onInput: (v) => {
              tpl()[key] = v;
              const valEl = trigger.querySelector('.rde-b-val-v');
              if (valEl) {
                const empty = !v.trim();
                valEl.textContent = empty ? placeholder : oneLine(v);
                valEl.classList.toggle('is-default', empty);
              }
              markDirty();
              refreshPreview();
            },
            onClear: () => { delete tpl()[key]; renderRibbon(); },
          });
        });
      });
    };
    wording('#es-intro', 'intro', 'Opening line', 'The greeting under the heading. Leave blank for RELAY\'s standard greeting.', 'Standard greeting', 4);
    wording('#es-note', 'note', 'Closing note', 'The small print under the button. Leave blank for the standard note.', 'Standard note', 3);
    wording('#es-cta', 'ctaLabel', 'Button label', 'The text on the call-to-action button.', 'Standard label', 2);

    q('#es-revert')?.addEventListener('click', () => {
      draft.templates[activeType] = {};
      markDirty();
      renderRibbon();
      refreshPreview();
    });

    // Brand
    q('#es-logo')?.addEventListener('click', () => {
      draft.branding.useLogo = !draft.branding.useLogo;
      markDirty();
      renderRibbon();
      refreshPreview();
    });

    const colorBtn = (id, prop, title, hint) => {
      q(id)?.addEventListener('click', (e) => {
        openPopover(e.currentTarget, colorPopoverHTML({ title, hint, value: draft.branding[prop] }), (panel, close) => {
          bindColorPopover(panel, close, (v) => {
            draft.branding[prop] = v;
            const chip = q(id)?.querySelector('.rde-sw-chip');
            if (chip) chip.style.background = v;
            markDirty();
            refreshPreview();
          });
        });
      });
    };
    colorBtn('#es-c-header', 'headerBg', 'Header fill', 'The band behind your logo or company name.');
    colorBtn('#es-c-accent', 'accent', 'Button colour', 'The call-to-action button customers click.');

    q('#es-footer')?.addEventListener('input', (e) => {
      draft.branding.footer = e.target.value;
      markDirty();
      refreshPreview();
    });
  }

  function bindShell() {
    container.querySelector('#es-back')?.addEventListener('click', () => {
      closePopover();
      router.navigate('/settings?tab=email_templates');
    });

    bindTabs(container, (id) => {
      if (id === activeTab) return;
      activeTab = id;
      closePopover();
      syncTabs();
      renderRibbon();
    });

    const subject = container.querySelector('#es-subject');
    subject?.addEventListener('input', () => {
      const v = subject.value;
      if (v) tpl().subject = v; else delete tpl().subject;
      markDirty();
      refreshPreview();
    });

    container.querySelector('#es-subject-vars')?.addEventListener('click', (e) => {
      openPopover(e.currentTarget, `
        <div class="rde-pop-head"><span class="rde-pop-title">Subject variables</span></div>
        <div class="rde-pop-hint">Click one to add it where your cursor is in the subject.</div>
        <div class="rde-vars">${meta().vars.map(v => `<button type="button" class="rde-var" data-var="${v}">{${v}}</button>`).join('')}</div>`,
        (panel, close) => {
          panel.querySelectorAll('.rde-var').forEach(chip => {
            chip.addEventListener('click', () => {
              const token = `{${chip.dataset.var}}`;
              const start = subject.selectionStart ?? subject.value.length;
              const end = subject.selectionEnd ?? subject.value.length;
              subject.value = subject.value.slice(0, start) + token + subject.value.slice(end);
              tpl().subject = subject.value;
              subject.focus();
              subject.setSelectionRange(start + token.length, start + token.length);
              markDirty();
              refreshPreview();
              close();
            });
          });
        });
    });

    const zoomSel = container.querySelector('#es-zoom');
    zoomSel?.addEventListener('change', () => {
      zoom = parseInt(zoomSel.value, 10);
      applyZoom(container.querySelector('#es-stage'), zoom);
    });

    container.querySelector('#es-save')?.addEventListener('click', async (e) => {
      const b = e.currentTarget;
      const original = b.innerHTML;
      b.disabled = true;
      b.innerHTML = '<span class="material-icons-outlined" style="font-size:16px">sync</span> Saving…';
      try {
        const s = store.getSettings() || {};
        // settings.mailer, never settings.email — that key is the business email
        // address string used on invoices and the customer portal.
        s.mailer = { ...emailSettings(), branding: draft.branding, templates: draft.templates };
        if (s.email && typeof s.email === 'object') s.email = '';
        await store.saveSettings(s);
        saved = JSON.stringify(draft);
        markDirty();
        showToast('Email templates saved', 'success');
        window.dispatchEvent(new CustomEvent('simpro-settings-updated'));
      } catch (err) {
        console.error('Error saving email templates:', err);
        showToast('Could not save email templates', 'error');
      } finally {
        b.disabled = false;
        b.innerHTML = original;
      }
    });
  }

  // ── Init ────────────────────────────────────
  container.innerHTML = shellHTML();
  bindShell();
  bindRibbon();
  const status = container.querySelector('#es-status');
  if (status) status.textContent = `${meta().label} email`;
  refreshPreview();
}
