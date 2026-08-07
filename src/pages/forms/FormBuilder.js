// ============================================
// RELAY — FORM TEMPLATE EDITOR
// ============================================
// Builds the forms technicians fill out in the field. Laid out as a document
// editor: a Word-style ribbon of grouped controls across the top, and the form
// itself as a sheet on a grey canvas — shown the way a technician will see it,
// not as a grid of builder cards. Selecting a field or a section reveals a
// contextual ribbon tab for its properties.

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';
import {
  enterEditorChrome, group, btn, valueBtn, seg, field, select,
  tabStrip, bindTabs, openPopover, closePopover, textPopoverHTML, bindTextPopover,
  applyZoom, zoomControlHTML,
} from '../../components/DocEditor.js';

const FIELD_TYPES = [
  { type: 'text', label: 'Text', icon: 'edit', kind: 'input' },
  { type: 'textarea', label: 'Long text', icon: 'notes', kind: 'input' },
  { type: 'checkbox', label: 'Checkbox', icon: 'check_box', kind: 'input' },
  { type: 'select', label: 'Dropdown', icon: 'arrow_drop_down_circle', kind: 'input' },
  { type: 'date', label: 'Date', icon: 'calendar_today', kind: 'input' },
  { type: 'signature', label: 'Signature', icon: 'draw', kind: 'input' },
  { type: 'info', label: 'Info box', icon: 'info', kind: 'content' },
  { type: 'spacer', label: 'Spacer', icon: 'space_bar', kind: 'content' },
];

function fieldMeta(type) {
  return FIELD_TYPES.find(ft => ft.type === type) || FIELD_TYPES[0];
}

function uid(prefix) {
  return prefix + '_' + Math.random().toString(36).substr(2, 7);
}

export function renderFormBuilder(container, { id }) {
  const isEdit = id && id !== 'new';
  const existing = isEdit ? store.getAll('formTemplates').find(t => t.id === id) : null;

  if (isEdit && !existing) {
    container.innerHTML = '<div class="empty-state"><h3>Template not found</h3></div>';
    return;
  }

  enterEditorChrome(container);

  // ── State ──
  let sections = existing ? JSON.parse(JSON.stringify(existing.sections || [])) : [
    { id: uid('sec'), title: 'General Info', columns: 1, fields: [] }
  ];

  // Migrate old data → new column model
  sections.forEach(sec => {
    if (sec.columns === undefined) sec.columns = 2; // old templates used a 2-col field grid
    (sec.fields || []).forEach(f => {
      if (f.colSpan === undefined) {
        f.colSpan = f.width === 'full' ? (sec.columns || 2) : 1;
      }
    });
  });

  let sel = { type: null, sIdx: null, fIdx: null };
  let dragInfo = null;
  let formName = existing?.name || '';
  let formDesc = existing?.description || '';
  let activeTab = 'insert';
  let zoom = 100;

  const selField = () => (sel.type === 'field' ? sections[sel.sIdx]?.fields?.[sel.fIdx] : null);
  const selSection = () => (sel.type ? sections[sel.sIdx] : null);

  // ════════════════════════
  //  LAYOUT NORMALISATION
  // ════════════════════════

  function normalizeFields(fields, cols) {
    let normalized = [];
    let currentSpan = 0;

    for (let f of fields) {
      let span = Math.min(f.colSpan || 1, cols);
      if (f.type === 'blank') {
         span = Math.min(f.colSpan, cols - currentSpan);
         if (span <= 0) continue;
      }

      if (currentSpan + span > cols) {
        if (cols - currentSpan > 0) {
          normalized.push({ id: uid('blk'), type: 'blank', colSpan: cols - currentSpan });
        }
        currentSpan = 0;
      }
      f.colSpan = span;
      normalized.push(f);
      currentSpan += span;
      if (currentSpan === cols) currentSpan = 0;
    }

    if (currentSpan > 0) {
      normalized.push({ id: uid('blk'), type: 'blank', colSpan: cols - currentSpan });
    }

    while (normalized.length > 0) {
      const last = normalized[normalized.length - 1];
      if (last.type === 'blank' && last.colSpan === cols) normalized.pop();
      else break;
    }

    normalized.push({ id: uid('blk'), type: 'blank', colSpan: cols });

    let merged = [];
    currentSpan = 0;
    for (let i = 0; i < normalized.length; i++) {
      const f = normalized[i];
      if (merged.length > 0) {
        const prev = merged[merged.length - 1];
        if (prev.type === 'blank' && f.type === 'blank' && (currentSpan + f.colSpan <= cols)) {
          prev.colSpan += f.colSpan;
          currentSpan += f.colSpan;
          if (currentSpan === cols) currentSpan = 0;
          continue;
        }
      }
      merged.push(f);
      currentSpan += f.colSpan;
      if (currentSpan === cols) currentSpan = 0;
    }
    return merged;
  }

  // ════════════════════════
  //  RIBBON
  // ════════════════════════

  function tabsForSelection() {
    const tabs = [
      { id: 'insert', label: 'Insert' },
      { id: 'layout', label: 'Layout' },
    ];
    if (sel.type === 'field') tabs.push({ id: 'field', label: 'Field', contextual: true });
    else if (sel.type === 'section') tabs.push({ id: 'section', label: 'Section', contextual: true });
    return tabs;
  }

  function insertTab() {
    const tile = (ft) => btn({
      label: ft.label, iconName: ft.icon, draggable: true,
      dataset: { type: ft.type },
      title: `Drag onto the form, or click to add a ${ft.label.toLowerCase()} field`,
    });
    return group('Inputs', FIELD_TYPES.filter(f => f.kind === 'input').map(tile).join(''))
      + group('Content', FIELD_TYPES.filter(f => f.kind === 'content').map(tile).join(''))
      + group('Structure',
        btn({ id: 'fb-add-sec', label: 'Section', iconName: 'view_agenda', title: 'Add a new section' })
        + btn({ id: 'fb-add-spacer', label: 'Page space', iconName: 'space_bar', title: 'Add vertical space between sections' }));
  }

  function layoutTab() {
    const sec = selSection();
    const cols = sec && !sec.isSpacer ? (sec.columns || 1) : null;
    const f = selField();
    const spanOptions = cols
      ? Array.from({ length: cols }, (_, i) => ({
          value: i + 1,
          label: i + 1 === cols ? 'Full' : String(i + 1),
          title: i + 1 === cols ? 'Span the full width' : `Span ${i + 1} of ${cols} columns`,
        }))
      : [{ value: 1, label: '1' }];

    return group('Section columns', seg({
      id: 'fb-cols',
      value: cols || 1,
      disabled: !cols,
      options: [
        { value: 1, label: '1', title: 'One column' },
        { value: 2, label: '2', title: 'Two columns' },
        { value: 3, label: '3', title: 'Three columns' },
      ],
    }))
      + group('Field width', seg({
        id: 'fb-span',
        value: f ? Math.min(f.colSpan || 1, cols || 1) : 1,
        disabled: !f || !cols || cols < 2,
        options: spanOptions,
      }))
      + group('Move section',
        btn({ id: 'fb-move-up', label: 'Up', iconName: 'arrow_upward', small: true, disabled: !sec || sel.sIdx === 0 })
        + btn({ id: 'fb-move-down', label: 'Down', iconName: 'arrow_downward', small: true, disabled: !sec || sel.sIdx === sections.length - 1 }));
  }

  function fieldTab() {
    const f = selField();
    if (!f) return group('Field', '<span class="rde-grp-label">Nothing selected</span>');
    const meta = fieldMeta(f.type);
    const cols = selSection()?.columns || 1;
    const isContent = f.type === 'info' || f.type === 'spacer';

    let labelControl;
    if (f.type === 'info') {
      labelControl = valueBtn({ id: 'fb-info-text', iconName: 'info', label: 'Information text', value: f.label, placeholder: 'Empty' });
    } else if (f.type === 'spacer') {
      labelControl = field({ id: 'fb-spacer-h', srLabel: 'Spacer height in pixels', value: parseInt(f.height || 50, 10), type: 'number', min: 10, max: 400, width: 88 });
    } else {
      labelControl = field({ id: 'fb-label', srLabel: 'Field label', value: f.label || '', placeholder: `${meta.label} field`, width: 240 });
    }

    return group(isContent ? (f.type === 'spacer' ? 'Height' : 'Content') : 'Question',
      labelControl
      + (isContent ? '' : btn({
        id: 'fb-required', label: 'Required', iconName: f.required ? 'star' : 'star_outline',
        pressed: !!f.required, small: true, title: 'Technicians must answer this before submitting',
      })))
      + group('Type', select({
        id: 'fb-type', srLabel: 'Field type', value: f.type, width: 158,
        options: FIELD_TYPES.map(ft => ({ value: ft.type, label: ft.label })),
      }))
      + (cols > 1 ? group('Width', seg({
        id: 'fb-span-ctx',
        value: Math.min(f.colSpan || 1, cols),
        options: Array.from({ length: cols }, (_, i) => ({
          value: i + 1, label: i + 1 === cols ? 'Full' : String(i + 1),
        })),
      })) : '')
      + (f.type === 'select' ? group('Choices', valueBtn({
        id: 'fb-options', iconName: 'list', label: `${(f.options || []).length} options`,
        value: (f.options || []).join(', '), placeholder: 'None yet',
      })) : '')
      + group('Field', btn({ id: 'fb-del-field', label: 'Delete', iconName: 'delete_outline', small: true }), { end: true });
  }

  function sectionTab() {
    const sec = selSection();
    if (!sec) return group('Section', '<span class="rde-grp-label">Nothing selected</span>');

    if (sec.isSpacer) {
      return group('Page space height', field({
        id: 'fb-sec-height', srLabel: 'Page space height in pixels', value: parseInt(sec.height || 60, 10), type: 'number', min: 20, max: 300, width: 96,
      }))
        + group('Section', btn({ id: 'fb-del-sec', label: 'Delete', iconName: 'delete_outline', small: true }), { end: true });
    }

    return group('Section heading', field({
      id: 'fb-sec-title', srLabel: 'Section title', value: sec.title || '', placeholder: 'Untitled section', width: 260,
    }))
      + group('Columns', seg({
        id: 'fb-sec-cols',
        value: sec.columns || 1,
        options: [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }],
      }))
      + group('Order',
        btn({ id: 'fb-move-up', label: 'Up', iconName: 'arrow_upward', small: true, disabled: sel.sIdx === 0 })
        + btn({ id: 'fb-move-down', label: 'Down', iconName: 'arrow_downward', small: true, disabled: sel.sIdx === sections.length - 1 }))
      + group('Section', btn({ id: 'fb-del-sec', label: 'Delete', iconName: 'delete_outline', small: true }), { end: true });
  }

  function ribbonHTML() {
    const body = activeTab === 'insert' ? insertTab()
      : activeTab === 'layout' ? layoutTab()
      : activeTab === 'field' ? fieldTab()
      : sectionTab();
    return `<div class="rde-ribbon" id="fb-ribbon" role="tabpanel">${body}</div>`;
  }

  // ════════════════════════
  //  CANVAS
  // ════════════════════════

  function renderSheet() {
    const totals = counts();
    return `
      <div class="fb-doc">
        <div class="fb-doc-head">
          <h2 class="fb-doc-title" id="fb-doc-title">${escapeHTML(formName || 'Untitled form')}</h2>
          <input class="fb-doc-desc" id="fb-desc" value="${escapeHTML(formDesc)}"
            placeholder="Add a short description — technicians see this above the form" />
        </div>
        ${sections.length ? sections.map((sec, sIdx) => renderSection(sec, sIdx)).join('') : `
          <div class="fb-empty">
            <span class="material-icons-outlined">dashboard_customize</span>
            <p>This form is empty. Drag a field from the ribbon, or add a section to group your questions.</p>
            <button class="btn btn-secondary btn-sm" id="fb-empty-add">
              <span class="material-icons-outlined" style="font-size:16px">add</span> Add a section
            </button>
          </div>`}
        <div class="fb-add-row">
          <button class="fb-add" id="fb-add-sec-inline">
            <span class="material-icons-outlined" style="font-size:18px">add</span> Add section
          </button>
          <button class="fb-add fb-add-alt" id="fb-add-spacer-inline">
            <span class="material-icons-outlined" style="font-size:18px">space_bar</span> Add page space
          </button>
        </div>
        <div class="fb-doc-foot">${totals.sections} section${totals.sections === 1 ? '' : 's'} · ${totals.fields} field${totals.fields === 1 ? '' : 's'}</div>
      </div>`;
  }

  function renderSection(sec, sIdx) {
    const isSel = sel.type === 'section' && sel.sIdx === sIdx;
    const cols = sec.columns || 1;

    if (sec.isSpacer) {
      const h = parseInt(sec.height || 60, 10);
      return `
        <div class="fb-sec fb-sec-space ${isSel ? 'is-sel' : ''}" data-sidx="${sIdx}" style="height:${h}px">
          <div class="fb-sec-grip" draggable="true" data-sidx="${sIdx}" title="Drag to reorder">
            <span class="material-icons-outlined">drag_indicator</span>
          </div>
          <span class="fb-sec-space-lbl">Page space · ${h}px</span>
          <button class="fb-sec-del" data-sidx="${sIdx}" title="Delete this space" aria-label="Delete this space">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>`;
    }

    return `
      <section class="fb-sec ${isSel ? 'is-sel' : ''}" data-sidx="${sIdx}">
        <header class="fb-sec-head" data-sidx="${sIdx}">
          <div class="fb-sec-grip" draggable="true" data-sidx="${sIdx}" title="Drag to reorder">
            <span class="material-icons-outlined">drag_indicator</span>
          </div>
          <input class="fb-sec-title" value="${escapeHTML(sec.title || '')}" placeholder="Untitled section" data-sidx="${sIdx}" aria-label="Section title" />
          <div class="fb-sec-tools">
            <span class="fb-sec-cols">${cols} col${cols > 1 ? 's' : ''}</span>
            <button class="fb-sec-del" data-sidx="${sIdx}" title="Delete section" aria-label="Delete section">
              <span class="material-icons-outlined">delete_outline</span>
            </button>
          </div>
        </header>
        <div class="fb-fields" data-sidx="${sIdx}" style="grid-template-columns:repeat(${cols},1fr)">
          ${(sec.fields || []).map((f, fIdx) => renderField(sec, sIdx, f, fIdx)).join('')}
        </div>
      </section>`;
  }

  function renderField(sec, sIdx, f, fIdx) {
    const cols = sec.columns || 1;
    const span = Math.min(f.colSpan || 1, cols);

    if (f.type === 'blank') {
      return `<div class="fb-blank" data-sidx="${sIdx}" data-fidx="${fIdx}" style="grid-column:span ${span}">
        <span>Drop a field here</span>
      </div>`;
    }

    const meta = fieldMeta(f.type);
    const isSel = sel.type === 'field' && sel.sIdx === sIdx && sel.fIdx === fIdx;
    const label = f.label || `${meta.label} field`;
    const req = f.required ? '<span class="fb-req" aria-hidden="true">*</span>' : '';
    let body = '';

    if (f.type === 'text') {
      body = `<input class="form-input" placeholder="${escapeHTML(label)}" disabled />`;
    } else if (f.type === 'textarea') {
      body = `<textarea class="form-textarea" rows="3" placeholder="${escapeHTML(label)}" disabled></textarea>`;
    } else if (f.type === 'checkbox') {
      body = `<label class="fb-check"><input type="checkbox" disabled /><span>${escapeHTML(label)}</span></label>`;
    } else if (f.type === 'select') {
      body = `<select class="form-select" disabled><option>${(f.options || []).length ? escapeHTML(f.options[0]) : 'Select option…'}</option></select>`;
    } else if (f.type === 'date') {
      body = `<input type="date" class="form-input" disabled />`;
    } else if (f.type === 'signature') {
      body = `<div class="fb-sig">Signed on submission</div>`;
    } else if (f.type === 'info') {
      body = `<div class="fb-info"><span class="material-icons-outlined">info</span><div>${escapeHTML(f.label || 'Informational text block').replace(/\n/g, '<br/>')}</div></div>`;
    } else if (f.type === 'spacer') {
      const h = f.height ? parseInt(f.height, 10) : 50;
      body = `<div class="fb-spacer" style="height:${h}px">Spacer</div>`;
    }

    const showLabel = f.type !== 'info' && f.type !== 'spacer' && f.type !== 'checkbox';

    return `
      <div class="fb-field ${isSel ? 'is-sel' : ''}" data-sidx="${sIdx}" data-fidx="${fIdx}"
           style="grid-column:span ${span}" draggable="true" tabindex="0" role="button"
           aria-label="${escapeHTML(label)} — ${escapeHTML(meta.label)}">
        <span class="fb-field-tag">${escapeHTML(meta.label)}</span>
        ${showLabel ? `<label class="fb-field-lbl">${escapeHTML(label)}${req}</label>` : ''}
        ${body}
      </div>`;
  }

  function counts() {
    const real = sections.reduce((sum, s) => sum + (s.fields || []).filter(f => f.type !== 'blank').length, 0);
    return { sections: sections.filter(s => !s.isSpacer).length, fields: real };
  }

  // ════════════════════════
  //  SHELL
  // ════════════════════════

  function shellHTML() {
    return `
      ${styles()}
      <div class="modal-overlay" id="fb-preview-modal" style="display:none; z-index:9999;">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h3>Form preview</h3>
            <button class="modal-close" id="fb-preview-close" aria-label="Close preview"><span class="material-icons-outlined">close</span></button>
          </div>
          <div class="modal-body" id="fb-preview-content" style="background:var(--bg-color); padding:24px; min-height:400px; max-height:70vh; overflow-y:auto;"></div>
        </div>
      </div>

      <div class="rde" style="--rde-sheet-w:860px">
        <div class="rde-cmd">
          <button type="button" class="rde-cmd-back" id="fb-back" title="Back to Settings" aria-label="Back to Settings">
            <span class="material-icons-outlined">arrow_back</span>
          </button>
          <div class="rde-cmd-id">
            <input class="rde-cmd-title" id="fb-name" value="${escapeHTML(formName)}"
              placeholder="Untitled form" aria-label="Form name" />
            <span class="rde-cmd-sub">${isEdit ? 'Form template' : 'New form template'}</span>
          </div>
          <span class="rde-cmd-spacer"></span>
          <div class="rde-cmd-actions">
            <button class="btn btn-secondary btn-sm" id="fb-preview-btn">
              <span class="material-icons-outlined" style="font-size:16px">visibility</span> Preview
            </button>
            <button class="btn btn-primary btn-sm" id="fb-save">
              <span class="material-icons-outlined" style="font-size:16px">save</span> Save template
            </button>
          </div>
        </div>

        <div id="fb-tabs-host">${tabStrip(tabsForSelection(), activeTab)}</div>
        ${ribbonHTML()}

        <div class="rde-canvas" id="fb-canvas">
          <div class="rde-stage" id="fb-stage">
            <div class="rde-sheet rde-sheet-app" id="fb-sheet">${renderSheet()}</div>
          </div>
        </div>

        <div class="rde-status">
          <span id="fb-status">${statusText()}</span>
          ${zoomControlHTML('fb-zoom', zoom)}
        </div>
      </div>`;
  }

  function statusText() {
    const t = counts();
    const f = selField();
    if (f) return `${fieldMeta(f.type).label} selected — edit it on the Field tab`;
    if (sel.type === 'section') return 'Section selected — edit it on the Section tab';
    return `${t.sections} section${t.sections === 1 ? '' : 's'} · ${t.fields} field${t.fields === 1 ? '' : 's'}`;
  }

  // ════════════════════════
  //  RENDER
  // ════════════════════════

  // Full repaint of the sheet; the ribbon and tab strip are refreshed alongside
  // it so contextual tabs track the selection.
  function render() {
    const canvas = container.querySelector('#fb-canvas');
    const scroll = canvas ? canvas.scrollTop : 0;

    sections.forEach(sec => {
      if (!sec.isSpacer) sec.fields = normalizeFields(sec.fields || [], sec.columns || 1);
    });

    const sheet = container.querySelector('#fb-sheet');
    if (!sheet) { container.innerHTML = shellHTML(); bindAll(); return; }

    sheet.innerHTML = renderSheet();
    renderTabs();
    renderRibbon();
    updateStatus();
    bindCanvas();
    setupDragDrop();

    const freshCanvas = container.querySelector('#fb-canvas');
    if (freshCanvas) freshCanvas.scrollTop = scroll;
  }

  function renderTabs() {
    const host = container.querySelector('#fb-tabs-host');
    if (!host) return;
    host.innerHTML = tabStrip(tabsForSelection(), activeTab);
    bindTabs(host, (id) => {
      if (id === activeTab) return;
      activeTab = id;
      closePopover();
      renderTabs();
      renderRibbon();
    });
  }

  function renderRibbon() {
    const old = container.querySelector('#fb-ribbon');
    if (!old) return;
    const scrollLeft = old.scrollLeft;
    old.outerHTML = ribbonHTML();
    const fresh = container.querySelector('#fb-ribbon');
    if (fresh) fresh.scrollLeft = scrollLeft;
    bindRibbon();
  }

  function updateStatus() {
    const el = container.querySelector('#fb-status');
    if (el) el.textContent = statusText();
  }

  // Selecting always surfaces the matching contextual tab, so properties are one
  // glance away instead of hidden behind a panel.
  function selectField(sIdx, fIdx) {
    sel = { type: 'field', sIdx, fIdx };
    activeTab = 'field';
    render();
  }

  function selectSection(sIdx) {
    sel = { type: 'section', sIdx };
    activeTab = 'section';
    render();
  }

  function clearSelection() {
    if (!sel.type) return;
    sel = { type: null, sIdx: null, fIdx: null };
    if (activeTab === 'field' || activeTab === 'section') activeTab = 'insert';
    render();
  }

  // ════════════════════════
  //  RIBBON EVENTS
  // ════════════════════════

  function bindRibbon() {
    const q = (s) => container.querySelector(s);

    // Click a palette tile to insert without dragging.
    container.querySelectorAll('#fb-ribbon .rde-b[data-type]').forEach(tile => {
      tile.addEventListener('click', () => insertField(tile.dataset.type));
    });

    q('#fb-add-sec')?.addEventListener('click', addSection);
    q('#fb-add-spacer')?.addEventListener('click', addSpacer);

    // Layout tab
    q('#fb-cols')?.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => setColumns(sel.sIdx, +b.dataset.value));
    });
    q('#fb-span')?.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => setSpan(+b.dataset.value));
    });
    q('#fb-move-up')?.addEventListener('click', () => moveSection(-1));
    q('#fb-move-down')?.addEventListener('click', () => moveSection(1));

    // Field tab
    const labelInput = q('#fb-label');
    labelInput?.addEventListener('input', () => {
      const f = selField();
      if (!f) return;
      f.label = labelInput.value;
      const lbl = container.querySelector(`.fb-field[data-sidx="${sel.sIdx}"][data-fidx="${sel.fIdx}"] .fb-field-lbl`);
      if (lbl) lbl.innerHTML = escapeHTML(f.label || `${fieldMeta(f.type).label} field`) + (f.required ? '<span class="fb-req">*</span>' : '');
    });
    q('#fb-required')?.addEventListener('click', () => {
      const f = selField();
      if (!f) return;
      f.required = !f.required;
      render();
    });
    q('#fb-type')?.addEventListener('change', (e) => {
      const f = selField();
      if (!f) return;
      f.type = e.target.value;
      if (f.type === 'select' && !f.options) f.options = [];
      render();
    });
    q('#fb-span-ctx')?.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => setSpan(+b.dataset.value));
    });
    q('#fb-del-field')?.addEventListener('click', () => {
      if (sel.type !== 'field') return;
      sections[sel.sIdx].fields.splice(sel.fIdx, 1);
      clearSelection();
    });
    q('#fb-spacer-h')?.addEventListener('input', (e) => {
      const f = selField();
      if (f) { f.height = `${Math.max(10, parseInt(e.target.value, 10) || 50)}px`; render(); }
    });

    q('#fb-info-text')?.addEventListener('click', (e) => {
      const f = selField();
      if (!f) return;
      const trigger = e.currentTarget;
      openPopover(trigger, textPopoverHTML({
        title: 'Information text',
        hint: 'Shown to the technician as a highlighted note. No answer required.',
        value: f.label || '', placeholder: 'e.g. Check isolation before starting', rows: 4,
      }), (panel, close) => {
        bindTextPopover(panel, close, {
          onInput: (v) => {
            f.label = v;
            const box = container.querySelector(`.fb-field[data-sidx="${sel.sIdx}"][data-fidx="${sel.fIdx}"] .fb-info div`);
            if (box) box.innerHTML = escapeHTML(v || 'Informational text block').replace(/\n/g, '<br/>');
            const valEl = trigger.querySelector('.rde-b-val-v');
            if (valEl) {
              valEl.textContent = v.trim() ? v.replace(/\s+/g, ' ').trim().slice(0, 34) : 'Empty';
              valEl.classList.toggle('is-default', !v.trim());
            }
          },
        });
      });
    });

    q('#fb-options')?.addEventListener('click', (e) => {
      const f = selField();
      if (!f) return;
      openPopover(e.currentTarget, textPopoverHTML({
        title: 'Dropdown choices',
        hint: 'One choice per line, in the order technicians will see them.',
        value: (f.options || []).join('\n'), placeholder: 'Pass\nFail\nNot applicable', rows: 6,
      }), (panel, close) => {
        bindTextPopover(panel, close, {
          onInput: (v) => { f.options = v.split('\n').map(s => s.trim()).filter(Boolean); },
        });
        panel.querySelector('.rde-pop-done')?.addEventListener('click', () => render());
      });
    });

    // Section tab
    const secTitle = q('#fb-sec-title');
    secTitle?.addEventListener('input', () => {
      const sec = selSection();
      if (!sec) return;
      sec.title = secTitle.value;
      const canvasTitle = container.querySelector(`.fb-sec-title[data-sidx="${sel.sIdx}"]`);
      if (canvasTitle && canvasTitle !== document.activeElement) canvasTitle.value = sec.title;
    });
    q('#fb-sec-cols')?.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => setColumns(sel.sIdx, +b.dataset.value));
    });
    q('#fb-sec-height')?.addEventListener('input', (e) => {
      const sec = selSection();
      if (!sec) return;
      sec.height = `${Math.max(20, parseInt(e.target.value, 10) || 60)}px`;
      const el = container.querySelector(`.fb-sec-space[data-sidx="${sel.sIdx}"]`);
      if (el) {
        el.style.height = sec.height;
        const lbl = el.querySelector('.fb-sec-space-lbl');
        if (lbl) lbl.textContent = `Page space · ${parseInt(sec.height, 10)}px`;
      }
    });
    q('#fb-del-sec')?.addEventListener('click', deleteSection);
  }

  // ════════════════════════
  //  MUTATIONS
  // ════════════════════════

  function addSection() {
    sections.push({ id: uid('sec'), title: 'New section', columns: 1, fields: [] });
    selectSection(sections.length - 1);
  }

  function addSpacer() {
    sections.push({ id: uid('sec'), title: '', isSpacer: true, width: 'full', columns: 1, height: '60px', fields: [] });
    selectSection(sections.length - 1);
  }

  function deleteSection() {
    if (sel.type === null) return;
    const sec = sections[sel.sIdx];
    const hasFields = sec && !sec.isSpacer && (sec.fields || []).some(f => f.type !== 'blank');
    if (hasFields && !confirm('Delete this section and every field in it?')) return;
    sections.splice(sel.sIdx, 1);
    clearSelection();
  }

  function moveSection(delta) {
    if (sel.type === null) return;
    const from = sel.sIdx;
    const to = from + delta;
    if (to < 0 || to >= sections.length) return;
    const [moved] = sections.splice(from, 1);
    sections.splice(to, 0, moved);
    sel = { ...sel, sIdx: to };
    render();
  }

  function setColumns(sIdx, cols) {
    const sec = sections[sIdx];
    if (!sec || sec.isSpacer) return;
    sec.columns = cols;
    (sec.fields || []).forEach(f => { if ((f.colSpan || 1) > cols) f.colSpan = cols; });
    render();
  }

  function setSpan(span) {
    const f = selField();
    if (!f) return;
    f.colSpan = span;
    render();
  }

  // Click-to-insert drops the field in the first free slot of the section you're
  // working in, so the palette works without dragging.
  function insertField(type) {
    if (!sections.length) sections.push({ id: uid('sec'), title: 'New section', columns: 1, fields: [] });
    let sIdx = (sel.type && !sections[sel.sIdx]?.isSpacer) ? sel.sIdx : -1;
    if (sIdx === -1) {
      for (let i = sections.length - 1; i >= 0; i--) {
        if (!sections[i].isSpacer) { sIdx = i; break; }
      }
    }
    if (sIdx === -1) {
      sections.push({ id: uid('sec'), title: 'New section', columns: 1, fields: [] });
      sIdx = sections.length - 1;
    }

    const sec = sections[sIdx];
    sec.fields = normalizeFields(sec.fields || [], sec.columns || 1);
    const newField = { id: uid('f'), type, label: '', required: false, colSpan: 1 };
    if (type === 'select') newField.options = [];

    const blankIdx = sec.fields.findIndex(f => f.type === 'blank');
    if (blankIdx === -1) {
      sec.fields.push(newField);
      selectField(sIdx, sec.fields.length - 1);
      return;
    }
    const blankSpan = sec.fields[blankIdx].colSpan;
    sec.fields.splice(blankIdx, 1, newField);
    if (blankSpan > 1) {
      sec.fields.splice(blankIdx + 1, 0, { id: uid('blk'), type: 'blank', colSpan: blankSpan - 1 });
    }
    selectField(sIdx, blankIdx);
  }

  // ════════════════════════
  //  CANVAS EVENTS
  // ════════════════════════

  function bindCanvas() {
    container.querySelector('#fb-desc')?.addEventListener('input', (e) => { formDesc = e.target.value; });
    container.querySelector('#fb-empty-add')?.addEventListener('click', addSection);
    container.querySelector('#fb-add-sec-inline')?.addEventListener('click', addSection);
    container.querySelector('#fb-add-spacer-inline')?.addEventListener('click', addSpacer);

    container.querySelectorAll('.fb-field').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        selectField(+el.dataset.sidx, +el.dataset.fidx);
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectField(+el.dataset.sidx, +el.dataset.fidx);
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          sections[+el.dataset.sidx].fields.splice(+el.dataset.fidx, 1);
          clearSelection();
        }
      });
    });

    container.querySelectorAll('.fb-sec-head, .fb-sec-space').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.fb-sec-del') || e.target.classList.contains('fb-sec-title')) return;
        selectSection(+el.dataset.sidx);
      });
    });

    container.querySelectorAll('.fb-sec-title').forEach(input => {
      input.addEventListener('input', () => {
        sections[+input.dataset.sidx].title = input.value;
        const ribbonTitle = container.querySelector('#fb-sec-title');
        if (ribbonTitle && ribbonTitle !== document.activeElement) ribbonTitle.value = input.value;
      });
      input.addEventListener('focus', () => {
        if (!(sel.type === 'section' && sel.sIdx === +input.dataset.sidx)) selectSection(+input.dataset.sidx);
      });
    });

    container.querySelectorAll('.fb-sec-del').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        sel = { type: 'section', sIdx: +b.dataset.sidx };
        deleteSection();
      });
    });

    container.querySelector('#fb-canvas')?.addEventListener('click', (e) => {
      if (e.target.closest('.fb-field') || e.target.closest('.fb-sec') || e.target.closest('.fb-add') || e.target.closest('.fb-doc-head')) return;
      clearSelection();
    });
  }

  function bindAll() {
    container.querySelector('#fb-back')?.addEventListener('click', () => {
      closePopover();
      router.navigate('/settings?tab=forms');
    });
    container.querySelector('#fb-save')?.addEventListener('click', handleSave);
    container.querySelector('#fb-preview-btn')?.addEventListener('click', showPreview);
    container.querySelector('#fb-preview-close')?.addEventListener('click', hidePreview);
    container.querySelector('#fb-preview-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'fb-preview-modal') hidePreview();
    });

    const nameInput = container.querySelector('#fb-name');
    nameInput?.addEventListener('input', () => {
      formName = nameInput.value;
      const title = container.querySelector('#fb-doc-title');
      if (title) title.textContent = formName || 'Untitled form';
    });

    const zoomSel = container.querySelector('#fb-zoom');
    zoomSel?.addEventListener('change', () => {
      zoom = parseInt(zoomSel.value, 10);
      applyZoom(container.querySelector('#fb-stage'), zoom);
    });

    renderTabs();
    bindRibbon();
    bindCanvas();
    setupDragDrop();
  }

  // ════════════════════════
  //  PREVIEW
  // ════════════════════════

  function hidePreview() {
    const modal = container.querySelector('#fb-preview-modal');
    if (modal) modal.style.display = 'none';
  }

  function showPreview() {
    const modal = container.querySelector('#fb-preview-modal');
    const content = container.querySelector('#fb-preview-content');
    if (!modal || !content) return;

    content.innerHTML = `
      <div style="margin-bottom:24px; border-bottom:1px solid var(--border-color); padding-bottom:16px">
        <h3 style="margin:0">${escapeHTML(formName || 'Untitled form')}</h3>
        <div style="font-size:14px; color:var(--text-secondary); margin-top:6px">${escapeHTML(formDesc || '')}</div>
      </div>
      <form id="active-job-form">
        <div style="display:flex; flex-direction:column; gap:24px">
          ${sections.map(sec => {
            const secCols = sec.columns || (sec.width === 'half' ? 1 : 2);
            if (sec.isSpacer) {
              const secHeight = sec.height ? (String(sec.height).endsWith('px') ? sec.height : sec.height + 'px') : '50px';
              return `<div style="width:100%; height: ${secHeight}"></div>`;
            }
            return `
              <div class="form-section" style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:8px; overflow:hidden">
                <div style="background:var(--content-bg); padding:12px 16px; border-bottom:1px solid var(--border-color)">
                  <h4 style="margin:0; font-size:15px; text-transform:uppercase; letter-spacing:0.5px">${escapeHTML(sec.title || 'Untitled section')}</h4>
                </div>
                <div style="display:grid; grid-template-columns: repeat(${secCols}, 1fr); gap:16px; padding:16px">
                  ${(sec.fields || []).map(f => {
                    const fSpan = Math.min(f.colSpan || (f.width === 'half' ? 1 : secCols), secCols);
                    if (f.type === 'spacer' || f.type === 'blank') {
                      const fHeight = f.height ? (String(f.height).endsWith('px') ? f.height : f.height + 'px') : '50px';
                      return `<div style="grid-column: span ${fSpan}; height: ${f.type === 'blank' ? 'auto' : fHeight}"></div>`;
                    }
                    if (f.type === 'info') {
                      return `
                        <div class="form-group info-block" style="margin:0; grid-column: span ${fSpan}; padding:16px; background:var(--color-primary-light); border-radius:6px; color:var(--text-primary); font-size:14px; line-height:1.6">
                          <div style="display:flex; gap:12px; align-items:flex-start">
                            <span class="material-icons-outlined" style="color:var(--color-primary); flex-shrink:0; font-size:20px">info</span>
                            <div>${escapeHTML(f.label || 'Informational text block').replace(/\n/g, '<br/>')}</div>
                          </div>
                        </div>`;
                    }

                    const label = f.label || fieldMeta(f.type).label + ' field';
                    let fieldHtml = '';
                    if (f.type === 'text') {
                      fieldHtml = `<input class="form-input" name="${f.id}" placeholder="${escapeHTML(label)}" ${f.required ? 'required' : ''} />`;
                    } else if (f.type === 'textarea') {
                      fieldHtml = `<textarea class="form-textarea" name="${f.id}" rows="3" placeholder="${escapeHTML(label)}" ${f.required ? 'required' : ''}></textarea>`;
                    } else if (f.type === 'checkbox') {
                      fieldHtml = `
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer;">
                          <input type="checkbox" name="${f.id}" style="width:18px; height:18px" />
                          <span style="font-size:14px">${escapeHTML(label)}</span>
                        </label>`;
                    } else if (f.type === 'select') {
                      fieldHtml = `
                        <select class="form-select" name="${f.id}" ${f.required ? 'required' : ''}>
                          <option value="">Select option…</option>
                          ${(f.options || []).map(opt => `<option value="${escapeHTML(opt)}">${escapeHTML(opt)}</option>`).join('')}
                        </select>`;
                    } else if (f.type === 'date') {
                      fieldHtml = `<input type="date" class="form-input" name="${f.id}" ${f.required ? 'required' : ''} />`;
                    } else if (f.type === 'signature') {
                      fieldHtml = `
                        <div style="border:1px solid var(--border-color); background:var(--bg-color); height:80px; border-radius:6px; display:flex; align-items:center; justify-content:center; color:var(--text-tertiary); font-size:13px; font-style:italic;">
                          Click to sign
                        </div>`;
                    }

                    return `
                      <div class="form-group" style="margin:0; grid-column: span ${fSpan}">
                        ${f.type !== 'checkbox' ? `<label class="form-label" style="font-weight:500">${escapeHTML(label)} ${f.required ? '<span style="color:var(--color-danger)">*</span>' : ''}</label>` : ''}
                        ${fieldHtml}
                      </div>`;
                  }).join('')}
                </div>
              </div>`;
          }).join('')}
        </div>
      </form>`;

    modal.style.display = 'flex';
  }

  // ════════════════════════
  //  DRAG & DROP
  // ════════════════════════

  function setupDragDrop() {
    // Palette tiles
    container.querySelectorAll('#fb-ribbon .rde-b[data-type]').forEach(tile => {
      tile.addEventListener('dragstart', (e) => {
        const type = tile.dataset.type;
        const meta = fieldMeta(type);
        dragInfo = { action: 'add', type };
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', type);

        const ghost = document.createElement('div');
        ghost.style.cssText = 'position:fixed;top:-999px;padding:9px 14px;background:#fff;border:2px solid #FF5C00;border-radius:8px;box-shadow:0 6px 18px rgba(16,24,40,.18);display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#191c1e;font-family:Inter,sans-serif';
        ghost.innerHTML = `<span class="material-icons-outlined" style="font-size:18px">${meta.icon}</span> ${meta.label}`;
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 80, 20);
        requestAnimationFrame(() => ghost.remove());
        document.body.classList.add('fb-dragging');
      });
      tile.addEventListener('dragend', cleanupDrag);
    });

    // Field cards
    container.querySelectorAll('.fb-field[draggable]').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        dragInfo = { action: 'moveField', sIdx: +card.dataset.sidx, fIdx: +card.dataset.fidx };
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'field');
        card.classList.add('is-dragging');
        document.body.classList.add('fb-dragging');
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('is-dragging');
        cleanupDrag();
      });
    });

    // Section grips
    container.querySelectorAll('.fb-sec-grip[draggable]').forEach(grip => {
      grip.addEventListener('dragstart', (e) => {
        dragInfo = { action: 'moveSection', sIdx: +grip.dataset.sidx };
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'section');
        grip.closest('.fb-sec')?.classList.add('is-dragging');
        document.body.classList.add('fb-dragging');
      });
      grip.addEventListener('dragend', () => {
        container.querySelectorAll('.is-dragging').forEach(el => el.classList.remove('is-dragging'));
        cleanupDrag();
      });
    });

    // Empty slots
    container.querySelectorAll('.fb-blank').forEach(blank => {
      blank.addEventListener('dragover', (e) => {
        if (!dragInfo || dragInfo.action === 'moveSection') return;
        const targetSpan = sections[+blank.dataset.sidx].fields[+blank.dataset.fidx].colSpan;
        const sourceSpan = dragInfo.action === 'add' ? 1 : sections[dragInfo.sIdx].fields[dragInfo.fIdx].colSpan;
        if (sourceSpan > targetSpan) { e.dataTransfer.dropEffect = 'none'; return; }
        e.preventDefault(); e.stopPropagation();
        e.dataTransfer.dropEffect = dragInfo.action === 'add' ? 'copy' : 'move';
        blank.classList.add('is-over');
      });
      blank.addEventListener('dragleave', () => blank.classList.remove('is-over'));
      blank.addEventListener('drop', (e) => {
        e.preventDefault(); e.stopPropagation();
        blank.classList.remove('is-over');
        if (!dragInfo || dragInfo.action === 'moveSection') return;

        const targetSIdx = +blank.dataset.sidx;
        const targetFIdx = +blank.dataset.fidx;
        const targetSpan = sections[targetSIdx].fields[targetFIdx].colSpan;

        if (dragInfo.action === 'add') {
          const newField = { id: uid('f'), type: dragInfo.type, label: '', required: false, colSpan: 1 };
          if (newField.type === 'select') newField.options = [];
          sections[targetSIdx].fields.splice(targetFIdx, 1, newField);
          if (targetSpan > 1) {
            sections[targetSIdx].fields.splice(targetFIdx + 1, 0, { id: uid('blk'), type: 'blank', colSpan: targetSpan - 1 });
          }
        } else {
          const { sIdx: srcSIdx, fIdx: srcFIdx } = dragInfo;
          const srcField = { ...sections[srcSIdx].fields[srcFIdx] };
          if (srcField.colSpan > targetSpan) return;
          sections[srcSIdx].fields[srcFIdx] = { id: uid('blk'), type: 'blank', colSpan: srcField.colSpan };
          sections[targetSIdx].fields.splice(targetFIdx, 1, srcField);
          if (targetSpan > srcField.colSpan) {
            sections[targetSIdx].fields.splice(targetFIdx + 1, 0, { id: uid('blk'), type: 'blank', colSpan: targetSpan - srcField.colSpan });
          }
        }
        const dropped = { sIdx: targetSIdx, fIdx: targetFIdx };
        cleanupDrag();
        selectField(dropped.sIdx, dropped.fIdx);
      });
    });

    // Swap two same-width fields
    container.querySelectorAll('.fb-field').forEach(card => {
      card.addEventListener('dragover', (e) => {
        if (!dragInfo || dragInfo.action !== 'moveField') return;
        const targetSpan = sections[+card.dataset.sidx].fields[+card.dataset.fidx].colSpan;
        const sourceSpan = sections[dragInfo.sIdx].fields[dragInfo.fIdx].colSpan;
        if (sourceSpan !== targetSpan) { e.dataTransfer.dropEffect = 'none'; return; }
        e.preventDefault(); e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        card.classList.add('is-over');
      });
      card.addEventListener('dragleave', () => card.classList.remove('is-over'));
      card.addEventListener('drop', (e) => {
        e.preventDefault(); e.stopPropagation();
        card.classList.remove('is-over');
        if (!dragInfo || dragInfo.action !== 'moveField') return;
        const tS = +card.dataset.sidx, tF = +card.dataset.fidx;
        const sS = dragInfo.sIdx, sF = dragInfo.fIdx;
        const targetField = sections[tS].fields[tF];
        const srcField = sections[sS].fields[sF];
        if (targetField.colSpan !== srcField.colSpan) return;
        sections[tS].fields[tF] = srcField;
        sections[sS].fields[sF] = targetField;
        cleanupDrag();
        selectField(tS, tF);
      });
    });

    // Reorder sections by dropping on the sheet
    const sheet = container.querySelector('#fb-sheet');
    if (sheet) {
      sheet.addEventListener('dragover', (e) => {
        if (!dragInfo || dragInfo.action !== 'moveSection') return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        showSectionIndicator(sheet, getSectionInsertIdx(sheet, e.clientY));
      });
      sheet.addEventListener('drop', (e) => {
        if (!dragInfo || dragInfo.action !== 'moveSection') return;
        e.preventDefault();
        let toIdx = getSectionInsertIdx(sheet, e.clientY);
        const fromIdx = dragInfo.sIdx;
        const sec = sections.splice(fromIdx, 1)[0];
        if (fromIdx < toIdx) toIdx--;
        sections.splice(toIdx, 0, sec);
        cleanupDrag();
        selectSection(toIdx);
      });
    }
  }

  function getSectionInsertIdx(root, mouseY) {
    const secs = root.querySelectorAll('.fb-sec');
    for (let i = 0; i < secs.length; i++) {
      const rect = secs[i].getBoundingClientRect();
      if (mouseY < rect.top + rect.height / 2) return i;
    }
    return secs.length;
  }

  function showSectionIndicator(root, idx) {
    clearIndicators();
    const secs = root.querySelectorAll('.fb-sec');
    if (idx < secs.length) secs[idx].classList.add('drop-before');
    else if (secs.length) secs[secs.length - 1].classList.add('drop-after');
  }

  function clearIndicators() {
    container.querySelectorAll('.drop-before,.drop-after,.is-over').forEach(el => {
      el.classList.remove('drop-before', 'drop-after', 'is-over');
    });
  }

  function cleanupDrag() {
    dragInfo = null;
    clearIndicators();
    document.body.classList.remove('fb-dragging');
  }

  // ════════════════════════
  //  SAVE
  // ════════════════════════

  function handleSave() {
    const name = (formName || '').trim();
    if (!name) {
      showToast('Give the form a name before saving', 'error');
      container.querySelector('#fb-name')?.focus();
      return;
    }
    const totalFields = sections.reduce((sum, s) => sum + (s.fields || []).filter(f => f.type !== 'blank').length, 0);
    if (totalFields === 0) {
      showToast('Add at least one field before saving', 'error');
      return;
    }

    // Write both new (columns/colSpan) and old (width) properties for backward compat
    const cleanSections = sections.map(s => {
      let flds = s.fields ? [...s.fields] : [];
      while (flds.length > 0) {
        const last = flds[flds.length - 1];
        if (last.type === 'blank' && last.colSpan === (s.columns || 1)) flds.pop();
        else break;
      }
      return {
        ...s,
        width: 'full',
        fields: flds.map(f => ({
          ...f,
          width: (f.colSpan || 1) >= (s.columns || 1) ? 'full' : 'half',
        }))
      };
    });

    const template = { id: isEdit ? id : uid('fmt'), name, description: (formDesc || '').trim(), sections: cleanSections };
    const templates = store.getAll('formTemplates');
    if (isEdit) {
      const idx = templates.findIndex(t => t.id === id);
      if (idx >= 0) templates[idx] = template;
    } else {
      templates.push(template);
    }

    store.save('formTemplates', templates);
    showToast(`Form "${name}" saved`, 'success');
    router.navigate('/settings?tab=forms');
  }

  // ════════════════════════
  //  STYLES
  // ════════════════════════

  function styles() {
    return `<style>
      /* The sheet reads as the printed form, with builder affordances kept to
         the edges until you hover or select. */
      .fb-doc { padding: 40px 46px 32px; }
      .fb-doc-head { padding-bottom: 18px; margin-bottom: 26px; border-bottom: 1px solid var(--border-color); }
      .fb-doc-title { font-size: 22px; font-weight: 700; letter-spacing: -0.015em; color: var(--text-primary); margin: 0 0 4px; }
      .fb-doc-desc { width: 100%; padding: 4px 6px; border: 1px solid transparent; border-radius: 6px; background: transparent;
        font-family: inherit; font-size: 13.5px; color: var(--text-secondary); }
      .fb-doc-desc::placeholder { color: var(--text-tertiary); }
      .fb-doc-desc:hover { border-color: var(--border-color-dark); }
      .fb-doc-desc:focus { border-color: var(--color-primary); outline: none; box-shadow: 0 0 0 3px var(--color-primary-light); }
      .fb-doc-foot { margin-top: 26px; padding-top: 14px; border-top: 1px solid var(--border-color);
        font-size: 11.5px; color: var(--text-tertiary); }

      /* Sections */
      .fb-sec { position: relative; margin-bottom: 26px; border-radius: 8px; }
      .fb-sec.is-sel { box-shadow: 0 0 0 2px var(--color-primary); }
      .fb-sec.is-dragging { opacity: .35; }
      .fb-sec.drop-before::before, .fb-sec.drop-after::after { content: ''; position: absolute; left: 0; right: 0;
        height: 3px; border-radius: 2px; background: var(--color-primary); }
      .fb-sec.drop-before::before { top: -12px; }
      .fb-sec.drop-after::after { bottom: -12px; }

      .fb-sec-head { display: flex; align-items: center; gap: 6px; padding: 6px 8px 8px;
        border-bottom: 2px solid var(--color-primary); margin-bottom: 14px; cursor: pointer; }
      .fb-sec-grip { display: flex; align-items: center; justify-content: center; width: 22px; height: 26px;
        border: none; background: none; color: var(--text-tertiary); cursor: grab; opacity: 0; transition: opacity .12s ease; }
      .fb-sec-grip .material-icons-outlined { font-size: 18px; }
      .fb-sec:hover .fb-sec-grip, .fb-sec.is-sel .fb-sec-grip { opacity: 1; }
      .fb-sec-title { flex: 1; min-width: 0; padding: 3px 6px; border: 1px solid transparent; border-radius: 5px;
        background: transparent; font-family: inherit; font-size: 14px; font-weight: 700; letter-spacing: .02em;
        text-transform: uppercase; color: var(--text-primary); }
      .fb-sec-title::placeholder { color: var(--text-tertiary); font-weight: 600; text-transform: none; letter-spacing: 0; }
      .fb-sec-title:hover { border-color: var(--border-color-dark); }
      .fb-sec-title:focus { border-color: var(--color-primary); outline: none; background: var(--card-bg); }
      .fb-sec-tools { display: flex; align-items: center; gap: 8px; opacity: 0; transition: opacity .12s ease; }
      .fb-sec:hover .fb-sec-tools, .fb-sec.is-sel .fb-sec-tools { opacity: 1; }
      .fb-sec-cols { font-size: 11px; font-weight: 600; color: var(--text-tertiary); }
      .fb-sec-del { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px;
        border: none; border-radius: 6px; background: transparent; color: var(--text-tertiary); cursor: pointer; }
      .fb-sec-del:hover { background: var(--color-danger-bg); color: var(--color-danger); }
      .fb-sec-del .material-icons-outlined { font-size: 17px; }

      /* Page space */
      .fb-sec-space { display: flex; align-items: center; gap: 8px; justify-content: center;
        border: 1px dashed var(--border-color-dark); background: transparent; }
      .fb-sec-space-lbl { font-size: 11px; font-weight: 600; letter-spacing: .04em;
        text-transform: uppercase; color: var(--text-tertiary); }
      .fb-sec-space .fb-sec-del { position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
        opacity: 0; transition: opacity .12s ease; }
      .fb-sec-space:hover .fb-sec-del, .fb-sec-space.is-sel .fb-sec-del { opacity: 1; }

      /* Field grid */
      .fb-fields { display: grid; gap: 16px 18px; }

      .fb-field { position: relative; padding: 8px 10px 10px; border: 1px solid transparent; border-radius: 8px;
        cursor: pointer; transition: border-color .12s ease, box-shadow .12s ease, background .12s ease; }
      .fb-field:hover { border-color: var(--border-color-dark); background: var(--bg-color); }
      .fb-field.is-sel { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-light); background: transparent; }
      .fb-field.is-over { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary); }
      .fb-field.is-dragging { opacity: .28; }
      .fb-field:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
      .fb-field-tag { position: absolute; top: -8px; right: 8px; padding: 1px 7px; border-radius: 999px;
        background: var(--rde-accent-text); color: #fff; font-size: 9.5px; font-weight: 700; letter-spacing: .05em;
        text-transform: uppercase; opacity: 0; transition: opacity .12s ease; pointer-events: none; }
      .fb-field:hover .fb-field-tag, .fb-field.is-sel .fb-field-tag { opacity: 1; }
      .fb-field-lbl { display: block; margin-bottom: 5px; font-size: 12.5px; font-weight: 500; color: var(--text-secondary); }
      .fb-req { color: var(--color-danger); margin-left: 2px; }
      .fb-field .form-input, .fb-field .form-textarea, .fb-field .form-select { width: 100%; pointer-events: none; }
      .fb-check { display: flex; align-items: center; gap: 10px; font-size: 13.5px; color: var(--text-secondary); pointer-events: none; }
      .fb-check input { width: 17px; height: 17px; }
      .fb-sig { height: 76px; display: flex; align-items: center; justify-content: center; border: 1px dashed var(--border-color-dark);
        border-radius: 6px; background: var(--bg-color); color: var(--text-tertiary); font-size: 12.5px; font-style: italic; }
      .fb-info { display: flex; gap: 11px; padding: 14px 16px; border-radius: 8px; background: var(--color-primary-light);
        color: var(--text-primary); font-size: 13.5px; line-height: 1.6; }
      .fb-info .material-icons-outlined { color: var(--color-primary); font-size: 20px; flex-shrink: 0; }
      .fb-spacer { display: flex; align-items: center; justify-content: center; border: 1px dashed var(--border-color-dark);
        border-radius: 6px; color: var(--text-tertiary); font-size: 11px; letter-spacing: .06em; text-transform: uppercase; }

      /* Empty slots stay quiet until you pick something up */
      .fb-blank { display: flex; align-items: center; justify-content: center; min-height: 62px;
        border: 1px dashed transparent; border-radius: 8px; transition: border-color .12s ease, background .12s ease; }
      .fb-blank span { font-size: 11px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase;
        color: var(--text-tertiary); opacity: 0; transition: opacity .12s ease; }
      body.fb-dragging .fb-blank { border-color: var(--border-color-dark); background: var(--bg-color); }
      body.fb-dragging .fb-blank span { opacity: 1; }
      .fb-blank.is-over { border-color: var(--color-primary); border-style: solid; background: var(--color-primary-light); }
      .fb-blank.is-over span { color: var(--rde-accent-text); opacity: 1; }

      /* Add row + empty state */
      .fb-add-row { display: flex; gap: 10px; margin-top: 8px; }
      .fb-add { display: flex; align-items: center; justify-content: center; gap: 8px; flex: 1; padding: 13px 20px;
        border: 1px dashed var(--border-color-dark); border-radius: 9px; background: transparent;
        color: var(--text-tertiary); font-family: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer;
        transition: border-color .12s ease, color .12s ease, background .12s ease; }
      .fb-add:hover { border-color: var(--color-primary); color: var(--rde-accent-text); background: var(--color-primary-light); }
      .fb-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 56px 24px;
        text-align: center; color: var(--text-tertiary); }
      .fb-empty .material-icons-outlined { font-size: 40px; }
      .fb-empty p { max-width: 42ch; font-size: 13.5px; line-height: 1.6; }

      @media (max-width: 760px) {
        .fb-doc { padding: 24px 20px; }
        .fb-fields { grid-template-columns: 1fr !important; }
        .fb-field { grid-column: span 1 !important; }
      }
    </style>`;
  }

  // ── Init ──
  container.innerHTML = shellHTML();
  bindAll();
}
