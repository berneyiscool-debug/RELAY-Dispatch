// ============================================
// FIELDFORGE — FORM BUILDER V2
// Visual Drag & Drop Form Designer
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';

const FIELD_TYPES = [
  { type: 'text', label: 'Text Input', icon: 'edit' },
  { type: 'textarea', label: 'Long Text', icon: 'notes' },
  { type: 'checkbox', label: 'Checkbox', icon: 'check_box' },
  { type: 'select', label: 'Dropdown', icon: 'arrow_drop_down_circle' },
  { type: 'date', label: 'Date', icon: 'calendar_today' },
  { type: 'signature', label: 'Signature', icon: 'draw' },
  { type: 'info', label: 'Info Box', icon: 'info' },
  { type: 'spacer', label: 'Spacer', icon: 'space_bar' },
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

  // ════════════════════════
  //  RENDER
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

  function render() {
    const canvas = container.querySelector('#fb2-canvas');
    const rightSide = container.querySelector('.fb2-right');
    const canvasScroll = canvas ? canvas.scrollTop : 0;
    const rightScroll = rightSide ? rightSide.scrollTop : 0;

    sections.forEach(sec => { if (!sec.isSpacer) sec.fields = normalizeFields(sec.fields || [], sec.columns || 1); });
    container.innerHTML = `
      ${getStyles()}
      
      <!-- Preview Modal -->
      <div class="modal-overlay" id="fb2-preview-modal" style="display:none; z-index:9999;">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h3>Form Preview</h3>
            <button class="modal-close" id="fb2-preview-close"><span class="material-icons-outlined">close</span></button>
          </div>
          <div class="modal-body" id="fb2-preview-content" style="background: var(--bg-color); padding: 24px; min-height: 400px; max-height: 70vh; overflow-y: auto;">
            <!-- Form will be rendered here -->
          </div>
        </div>
      </div>

      <div class="fb2-header">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="btn btn-ghost btn-icon" id="fb2-back"><span class="material-icons-outlined">arrow_back</span></button>
          <h1 style="margin:0">${isEdit ? 'Edit Form Template' : 'Create Form Template'}</h1>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" id="fb2-preview-btn"><span class="material-icons-outlined">visibility</span> Preview</button>
          <button class="btn btn-secondary" id="fb2-cancel">Cancel</button>
          <button class="btn btn-primary" id="fb2-save"><span class="material-icons-outlined">save</span> Save Template</button>
        </div>
      </div>
      <div class="fb2-body">
        <div class="fb2-left">
          <div class="fb2-meta">
            <div class="form-group" style="margin:0;flex:1">
              <label class="form-label">Form Name <span style="color:var(--color-danger)">*</span></label>
              <input class="form-input" id="fb2-name" value="${escapeHTML(formName)}" placeholder="e.g. Daily Safety Audit" />
            </div>
            <div class="form-group" style="margin:0;flex:1">
              <label class="form-label">Description</label>
              <input class="form-input" id="fb2-desc" value="${escapeHTML(formDesc)}" placeholder="Optional description..." />
            </div>
          </div>
          <div class="fb2-canvas" id="fb2-canvas">
            ${renderCanvas()}
          </div>
          <div class="fb2-toolbox">
            <span class="fb2-toolbox-label">DRAG TO ADD</span>
            ${FIELD_TYPES.map(ft => `
              <div class="fb2-tool" draggable="true" data-type="${ft.type}">
                <span class="material-icons-outlined">${ft.icon}</span>
                <span>${ft.label}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="fb2-right" id="fb2-sidebar">
          ${renderSidebar()}
        </div>
      </div>
    `;
    bindAll();

    const newCanvas = container.querySelector('#fb2-canvas');
    const newRightSide = container.querySelector('.fb2-right');
    if (newCanvas) newCanvas.scrollTop = canvasScroll;
    if (newRightSide) newRightSide.scrollTop = rightScroll;
  }

  // ── Canvas ──

  function renderCanvas() {
    if (!sections.length) {
      return `<div class="fb2-empty">
        <span class="material-icons-outlined" style="font-size:48px">dashboard_customize</span>
        <p>Click "Add Section" below to get started</p>
      </div>`;
    }

    let html = '';
    sections.forEach((sec, sIdx) => {
      const isSel = sel.type === 'section' && sel.sIdx === sIdx;
      const cols = sec.columns || 1;

      if (sec.isSpacer) {
        html += `
          <div class="fb2-section fb2-spacer-sec ${isSel ? 'fb2-sel' : ''}" data-sidx="${sIdx}">
            <div class="fb2-sec-header" draggable="true" data-sidx="${sIdx}">
              <span class="material-icons-outlined fb2-drag-handle">drag_indicator</span>
              <span style="flex:1;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text-tertiary)">Layout Spacer</span>
              <button class="btn btn-ghost btn-icon btn-sm fb2-del-sec" data-sidx="${sIdx}" style="color:var(--color-danger)">
                <span class="material-icons-outlined" style="font-size:18px">close</span>
              </button>
            </div>
          </div>`;
        return;
      }

      html += `
        <div class="fb2-section ${isSel ? 'fb2-sel' : ''}" data-sidx="${sIdx}">
          <div class="fb2-sec-header" draggable="true" data-sidx="${sIdx}">
            <span class="material-icons-outlined fb2-drag-handle">drag_indicator</span>
            <input class="fb2-sec-title" value="${escapeHTML(sec.title)}" placeholder="Section title..." data-sidx="${sIdx}" />
            <div class="fb2-col-btns">
              ${[1,2,3].map(n => `<button class="fb2-col-btn ${cols===n?'active':''}" data-sidx="${sIdx}" data-cols="${n}" title="${n} column${n>1?'s':''}">${n}</button>`).join('')}
            </div>
            <button class="btn btn-ghost btn-icon btn-sm fb2-del-sec" data-sidx="${sIdx}" style="color:var(--color-danger)" title="Delete section">
              <span class="material-icons-outlined" style="font-size:18px">close</span>
            </button>
          </div>
          <div class="fb2-fields" data-sidx="${sIdx}" style="grid-template-columns:repeat(${cols},1fr)">
            ${sec.fields.length ? sec.fields.map((f, fIdx) => renderFieldCard(sec, sIdx, f, fIdx)).join('') : ''}
          </div>
        </div>`;
    });

    html += `
      <div class="fb2-add-row">
        <button class="fb2-add-sec" id="fb2-add-sec"><span class="material-icons-outlined">add</span> Add Section</button>
        <button class="fb2-add-sec fb2-add-sec-alt" id="fb2-add-spacer"><span class="material-icons-outlined">space_bar</span> Add Spacer</button>
      </div>`;
    return html;
  }

  // ── Field Card ──

  function renderFieldCard(sec, sIdx, f, fIdx) {
    const meta = fieldMeta(f.type);
    const isSel = sel.type === 'field' && sel.sIdx === sIdx && sel.fIdx === fIdx;
    const cols = sec.columns || 1;
    const span = Math.min(f.colSpan || 1, cols);
    
    if (f.type === 'blank') {
      return `
        <div class="fb2-field fb2-blank" data-sidx="${sIdx}" data-fidx="${fIdx}" style="grid-column:span ${span};border:2px dashed var(--border-color);display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.02);min-height:70px;border-radius:6px;cursor:crosshair;box-shadow:none">
          <span style="color:var(--text-tertiary);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Drop Here</span>
        </div>
      `;
    }

    const label = f.label || meta.label + '...';
    let fieldHtml = '';

    if (f.type === 'text') {
      fieldHtml = `<input class="form-input" style="pointer-events: none;" placeholder="${escapeHTML(label)}" disabled />`;
    } else if (f.type === 'textarea') {
      fieldHtml = `<textarea class="form-textarea" rows="3" style="pointer-events: none;" placeholder="${escapeHTML(label)}" disabled></textarea>`;
    } else if (f.type === 'checkbox') {
      fieldHtml = `
        <label style="display:flex; align-items:center; gap:10px; cursor:default; opacity:0.7; pointer-events:none;">
          <input type="checkbox" style="width:18px; height:18px" disabled />
          <span style="font-size:14px">${escapeHTML(label)}</span>
        </label>`;
    } else if (f.type === 'select') {
      fieldHtml = `
        <select class="form-select" style="pointer-events: none;" disabled>
          <option value="">Select option...</option>
          ${(f.options || []).map(opt => `<option>${escapeHTML(opt)}</option>`).join('')}
        </select>`;
    } else if (f.type === 'date') {
      fieldHtml = `<input type="date" class="form-input" style="pointer-events: none;" disabled />`;
    } else if (f.type === 'signature') {
      fieldHtml = `
        <div style="border:1px solid var(--border-color); background:var(--bg-color); height:80px; border-radius:4px; display:flex; align-items:center; justify-content:center; color:var(--text-tertiary); font-size:13px; font-style:italic">
          Digitally Signed on submission
        </div>`;
    } else if (f.type === 'info') {
      fieldHtml = `
        <div class="form-group info-block" style="margin:0; padding:16px; background:rgba(27, 109, 224, 0.05); border-left:4px solid var(--color-primary); border-radius:4px; color:var(--color-primary-dark); font-size:14px; line-height:1.6">
          <div style="display:flex; gap:12px; align-items:flex-start">
            <span class="material-icons-outlined" style="color:var(--color-primary); flex-shrink:0; font-size:20px; margin-top:2px">info</span>
            <div>${escapeHTML(f.label || 'Informational text block').replace(/\n/g, '<br/>')}</div>
          </div>
        </div>`;
    } else if (f.type === 'spacer') {
      const fHeight = f.height ? (String(f.height).endsWith('px') ? f.height : f.height + 'px') : '50px';
      fieldHtml = `<div style="height: ${fHeight}; border: 2px dashed var(--border-color); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px;">Spacer</div>`;
    }

    return `
      <div class="fb2-field ${isSel ? 'fb2-sel' : ''}" data-sidx="${sIdx}" data-fidx="${fIdx}" style="grid-column:span ${span}" draggable="true">
        <div class="fb2-field-bar">
          <span class="material-icons-outlined fb2-drag-handle" style="font-size:16px">drag_indicator</span>
          <span class="material-icons-outlined" style="font-size:14px;color:var(--text-tertiary)">${meta.icon}</span>
          <span class="fb2-ftype-lbl">${meta.label}</span>
        </div>
        <div style="padding:10px 14px 14px; pointer-events: none;">
          ${f.type !== 'info' && f.type !== 'spacer' ? `
            <div class="form-group" style="margin:0;">
              ${f.type !== 'checkbox' ? `<label class="form-label" style="font-weight:500">${escapeHTML(label)} ${f.required ? '<span style="color:var(--color-danger)">*</span>' : ''}</label>` : ''}
              ${fieldHtml}
            </div>
          ` : `
            ${fieldHtml}
          `}
        </div>
      </div>
    `;
  }

  // ── Sidebar ──

  function renderSidebar() {
    if (sel.type === 'field') {
      const f = sections[sel.sIdx]?.fields[sel.fIdx];
      if (!f) { sel = { type: null }; return renderSidebar(); }
      const meta = fieldMeta(f.type);
      const sec = sections[sel.sIdx];
      const cols = sec.columns || 1;

      return `
        <div class="fb2-sb-head"><span class="material-icons-outlined" style="color:var(--color-primary)">${meta.icon}</span><span>${meta.label} Properties</span></div>
        <div class="fb2-sb-body">
          ${f.type !== 'spacer' ? `
            <div class="form-group">
              <label class="form-label">${f.type === 'info' ? 'Information Text' : 'Label'}</label>
              <textarea class="form-textarea" id="sb-label" rows="${f.type === 'info' ? 4 : 2}" placeholder="${f.type === 'info' ? 'Informational text...' : 'Field label...'}">${escapeHTML(f.label || '')}</textarea>
            </div>
          ` : ''}
          <div class="form-group">
            <label class="form-label">Field Type</label>
            <select class="form-select" id="sb-type">
              ${FIELD_TYPES.map(ft => `<option value="${ft.type}" ${f.type === ft.type ? 'selected' : ''}>${ft.label}</option>`).join('')}
            </select>
          </div>
          ${(f.type !== 'info' && f.type !== 'spacer') ? `
            <div class="form-group">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px">
                <input type="checkbox" id="sb-req" ${f.required ? 'checked' : ''} style="width:18px;height:18px" />
                Required field
              </label>
            </div>
          ` : ''}
          ${cols > 1 ? `
            <div class="form-group">
              <label class="form-label">Column Span</label>
              <div class="fb2-col-btns" style="justify-content:flex-start">
                ${Array.from({length: cols}, (_, i) => i + 1).map(n => `
                  <button class="fb2-col-btn sb-span-btn ${(f.colSpan || 1) === n ? 'active' : ''}" data-span="${n}">${n === cols ? 'Full' : n}</button>
                `).join('')}
              </div>
            </div>
          ` : ''}
          ${f.type === 'select' ? `
            <div class="form-group">
              <label class="form-label">Dropdown Options</label>
              <textarea class="form-textarea" id="sb-opts" rows="4" placeholder="One option per line...">${(f.options || []).join('\n')}</textarea>
              <small style="color:var(--text-tertiary);font-size:11px">One option per line</small>
            </div>
          ` : ''}
          <div style="border-top:1px solid var(--border-color);padding-top:16px;margin-top:8px">
            <button class="btn btn-ghost btn-sm" id="sb-del-field" style="color:var(--color-danger);width:100%;justify-content:center">
              <span class="material-icons-outlined" style="font-size:16px">delete</span> Delete Field
            </button>
          </div>
        </div>`;
    }

    if (sel.type === 'section') {
      const sec = sections[sel.sIdx];
      if (!sec) { sel = { type: null }; return renderSidebar(); }
      const cols = sec.columns || 1;
      return `
        <div class="fb2-sb-head"><span class="material-icons-outlined" style="color:var(--color-primary)">view_agenda</span><span>Section Properties</span></div>
        <div class="fb2-sb-body">
          ${!sec.isSpacer ? `
            <div class="form-group">
              <label class="form-label">Section Title</label>
              <input class="form-input" id="sb-sec-title" value="${escapeHTML(sec.title || '')}" placeholder="Section title..." />
            </div>
            <div class="form-group">
              <label class="form-label">Columns</label>
              <div class="fb2-col-btns" style="justify-content:flex-start">
                ${[1,2,3].map(n => `<button class="fb2-col-btn sb-col-btn ${cols===n?'active':''}" data-cols="${n}">${n} Col${n>1?'s':''}</button>`).join('')}
              </div>
            </div>
          ` : `
            <div class="form-group">
              <label class="form-label">Spacer Height (px)</label>
              <input type="number" class="form-input" id="sb-spacer-h" value="${parseInt(sec.height || '60')}" min="20" max="300" />
            </div>
          `}
          <div style="border-top:1px solid var(--border-color);padding-top:16px;margin-top:8px">
            <button class="btn btn-ghost btn-sm" id="sb-del-sec" style="color:var(--color-danger);width:100%;justify-content:center">
              <span class="material-icons-outlined" style="font-size:16px">delete</span> Delete Section
            </button>
          </div>
        </div>`;
    }

    return `
      <div class="fb2-sb-empty">
        <span class="material-icons-outlined" style="font-size:40px;color:var(--text-tertiary)">touch_app</span>
        <h4 style="margin:12px 0 4px;color:var(--text-secondary)">No Selection</h4>
        <p style="color:var(--text-tertiary);font-size:13px;line-height:1.5">Click a field or section to edit its properties here.<br><br>Drag items from the toolbox to add new fields.</p>
      </div>`;
  }

  // ════════════════════════
  //  EVENTS
  // ════════════════════════

  function renderPreservingFocus() {
    const ae = document.activeElement;
    const aeId = ae?.id;
    const start = ae?.selectionStart;
    const end = ae?.selectionEnd;
    render();
    if (aeId) {
      const el = container.querySelector(`#${aeId}`);
      if (el) { el.focus(); try { el.setSelectionRange(start, end); } catch(e) {} }
    }
  }

  function updateSidebar() {
    const sb = container.querySelector('#fb2-sidebar');
    if (sb) { sb.innerHTML = renderSidebar(); bindSidebarEvents(); }
  }

  function bindAll() {
    container.querySelector('#fb2-back')?.addEventListener('click', () => router.navigate('/settings?tab=forms'));
    container.querySelector('#fb2-cancel')?.addEventListener('click', () => router.navigate('/settings?tab=forms'));
    container.querySelector('#fb2-save')?.addEventListener('click', handleSave);
    container.querySelector('#fb2-preview-btn')?.addEventListener('click', showPreview);
    container.querySelector('#fb2-preview-close')?.addEventListener('click', () => {
      const modal = container.querySelector('#fb2-preview-modal');
      if (modal) modal.style.display = 'none';
    });
    container.querySelector('#fb2-name')?.addEventListener('input', e => formName = e.target.value);
    container.querySelector('#fb2-desc')?.addEventListener('input', e => formDesc = e.target.value);
    bindCanvasEvents();
    bindSidebarEvents();
    setupDragDrop();
  }

  function showPreview() {
    const modal = container.querySelector('#fb2-preview-modal');
    const content = container.querySelector('#fb2-preview-content');
    if (!modal || !content) return;

    // Generate Form HTML identical to JobDetail.js
    const html = `
      <div style="margin-bottom:24px; border-bottom:1px solid var(--border-color); padding-bottom:16px">
        <h3 style="margin:0">${escapeHTML(formName || 'Untitled Form')}</h3>
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
                <div style="background:var(--content-bg); padding:12px 16px; border-bottom:1px solid var(--border-color); border-left:4px solid var(--color-primary)">
                  <h4 style="margin:0; font-size:15px; text-transform:uppercase; letter-spacing:0.5px">${escapeHTML(sec.title || 'Untitled Section')}</h4>
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
                      <div class="form-group info-block" style="margin:0; grid-column: span ${fSpan}; padding:16px; background:rgba(27, 109, 224, 0.05); border-left:4px solid var(--color-primary); border-radius:4px; color:var(--color-primary-dark); font-size:14px; line-height:1.6">
                        <div style="display:flex; gap:12px; align-items:flex-start">
                          <span class="material-icons-outlined" style="color:var(--color-primary); flex-shrink:0; font-size:20px; margin-top:2px">info</span>
                          <div>${escapeHTML(f.label || 'Informational text block').replace(/\n/g, '<br/>')}</div>
                        </div>
                      </div>
                    `;
                    }

                    let fieldHtml = '';
                    const label = f.label || fieldMeta(f.type).label + '...';

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
                          <option value="">Select option...</option>
                          ${(f.options || []).map(opt => `<option value="${escapeHTML(opt)}">${escapeHTML(opt)}</option>`).join('')}
                        </select>`;
                    } else if (f.type === 'date') {
                      fieldHtml = `<input type="date" class="form-input" name="${f.id}" ${f.required ? 'required' : ''} />`;
                    } else if (f.type === 'signature') {
                      fieldHtml = `
                        <div style="border:1px solid var(--border-color); background:var(--bg-color); height:80px; border-radius:4px; display:flex; align-items:center; justify-content:center; color:var(--text-tertiary); font-size:13px; font-style:italic; cursor:pointer;">
                          Click to Sign (Preview)
                        </div>`;
                    }

                    return `
                      <div class="form-group" style="margin:0; grid-column: span ${fSpan}">
                        ${f.type !== 'checkbox' ? `<label class="form-label" style="font-weight:500">${escapeHTML(label)} ${f.required ? '<span style="color:var(--color-danger)">*</span>' : ''}</label>` : ''}
                        ${fieldHtml}
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </form>
    `;

    content.innerHTML = html;
    modal.style.display = 'flex';
  }

  function bindCanvasEvents() {
    // Add section / spacer
    container.querySelector('#fb2-add-sec')?.addEventListener('click', () => {
      sections.push({ id: uid('sec'), title: 'New Section', columns: 1, fields: [] });
      sel = { type: 'section', sIdx: sections.length - 1 };
      render();
    });
    container.querySelector('#fb2-add-spacer')?.addEventListener('click', () => {
      sections.push({ id: uid('sec'), title: '', isSpacer: true, width: 'full', columns: 1, height: '60px', fields: [] });
      sel = { type: 'section', sIdx: sections.length - 1 };
      render();
    });

    // Select field
    container.querySelectorAll('.fb2-field:not(.fb2-blank)').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        sel = { type: 'field', sIdx: +el.dataset.sidx, fIdx: +el.dataset.fidx };
        render();
      });
    });

    // Select section
    container.querySelectorAll('.fb2-sec-header').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.fb2-del-sec') || e.target.closest('.fb2-col-btn') || e.target.classList.contains('fb2-sec-title')) return;
        sel = { type: 'section', sIdx: +el.dataset.sidx };
        render();
      });
    });

    // Section title live edit
    container.querySelectorAll('.fb2-sec-title').forEach(input => {
      input.addEventListener('input', () => {
        sections[+input.dataset.sidx].title = input.value;
        const sbTitle = container.querySelector('#sb-sec-title');
        if (sbTitle && sbTitle !== document.activeElement) sbTitle.value = input.value;
      });
    });

    // Column buttons in section header
    container.querySelectorAll('.fb2-col-btn[data-sidx][data-cols]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sIdx = +btn.dataset.sidx;
        const cols = +btn.dataset.cols;
        sections[sIdx].columns = cols;
        sections[sIdx].fields.forEach(f => { if ((f.colSpan || 1) > cols) f.colSpan = cols; });
        sel = { type: 'section', sIdx };
        render();
      });
    });

    // Delete section
    container.querySelectorAll('.fb2-del-sec').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Delete this section and all its fields?')) {
          sections.splice(+btn.dataset.sidx, 1);
          sel = { type: null };
          render();
        }
      });
    });

    // Deselect on canvas bg click
    container.querySelector('.fb2-canvas')?.addEventListener('click', (e) => {
      if (e.target.closest('.fb2-field') || e.target.closest('.fb2-sec-header') || e.target.closest('.fb2-add-sec') || e.target.closest('.fb2-add-sec-alt')) return;
      sel = { type: null };
      updateSidebar();
      container.querySelectorAll('.fb2-sel').forEach(el => el.classList.remove('fb2-sel'));
    });
  }

  function bindSidebarEvents() {
    // Label
    const lbl = container.querySelector('#sb-label');
    if (lbl) lbl.addEventListener('input', () => {
      if (sel.type === 'field') {
        sections[sel.sIdx].fields[sel.fIdx].label = lbl.value;
        // Live-update the canvas label text
        const card = container.querySelector(`.fb2-field[data-sidx="${sel.sIdx}"][data-fidx="${sel.fIdx}"] .fb2-lbl`);
        if (card) card.textContent = lbl.value || fieldMeta(sections[sel.sIdx].fields[sel.fIdx].type).label + '...';
      }
    });

    // Type
    container.querySelector('#sb-type')?.addEventListener('change', (e) => {
      if (sel.type === 'field') {
        sections[sel.sIdx].fields[sel.fIdx].type = e.target.value;
        render();
      }
    });

    // Required
    container.querySelector('#sb-req')?.addEventListener('change', (e) => {
      if (sel.type === 'field') {
        sections[sel.sIdx].fields[sel.fIdx].required = e.target.checked;
        renderPreservingFocus();
      }
    });

    // Column span
    container.querySelectorAll('.sb-span-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (sel.type === 'field') {
          sections[sel.sIdx].fields[sel.fIdx].colSpan = +btn.dataset.span;
          render();
        }
      });
    });

    // Dropdown options
    container.querySelector('#sb-opts')?.addEventListener('input', (e) => {
      if (sel.type === 'field') {
        sections[sel.sIdx].fields[sel.fIdx].options = e.target.value.split('\n').map(s => s.trim()).filter(Boolean);
      }
    });

    // Section title in sidebar
    const secTitle = container.querySelector('#sb-sec-title');
    if (secTitle) secTitle.addEventListener('input', () => {
      if (sel.type === 'section') {
        sections[sel.sIdx].title = secTitle.value;
        const canvasTitle = container.querySelector(`.fb2-sec-title[data-sidx="${sel.sIdx}"]`);
        if (canvasTitle && canvasTitle !== document.activeElement) canvasTitle.value = secTitle.value;
      }
    });

    // Section columns in sidebar
    container.querySelectorAll('.sb-col-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (sel.type === 'section') {
          const cols = +btn.dataset.cols;
          sections[sel.sIdx].columns = cols;
          sections[sel.sIdx].fields.forEach(f => { if ((f.colSpan || 1) > cols) f.colSpan = cols; });
          render();
        }
      });
    });

    // Spacer height
    container.querySelector('#sb-spacer-h')?.addEventListener('input', (e) => {
      if (sel.type === 'section') sections[sel.sIdx].height = e.target.value + 'px';
    });

    // Delete field
    container.querySelector('#sb-del-field')?.addEventListener('click', () => {
      if (sel.type === 'field') {
        sections[sel.sIdx].fields.splice(sel.fIdx, 1);
        sel = { type: null };
        render();
      }
    });

    // Delete section
    container.querySelector('#sb-del-sec')?.addEventListener('click', () => {
      if (sel.type === 'section' && confirm('Delete this section?')) {
        sections.splice(sel.sIdx, 1);
        sel = { type: null };
        render();
      }
    });
  }

  // ════════════════════════
  //  DRAG & DROP
  // ════════════════════════

  function setupDragDrop() {
    // ── Toolbox tiles ──
    container.querySelectorAll('.fb2-tool').forEach(tile => {
      tile.addEventListener('dragstart', (e) => {
        const type = tile.dataset.type;
        const meta = fieldMeta(type);
        dragInfo = { action: 'add', type };
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', type);

        const ghost = document.createElement('div');
        ghost.style.cssText = 'position:fixed;top:-999px;padding:10px 16px;background:white;border:2px solid #1B6DE0;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.15);display:flex;align-items:center;gap:8px;font-size:13px;font-weight:500;';
        ghost.innerHTML = `<span class="material-icons-outlined" style="font-size:18px">${meta.icon}</span> ${meta.label}`;
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 80, 20);
        requestAnimationFrame(() => ghost.remove());
        document.body.classList.add('fb2-dragging');
      });
      tile.addEventListener('dragend', cleanupDrag);
    });

    // ── Field cards ──
    container.querySelectorAll('.fb2-field:not(.fb2-blank)[draggable]').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        dragInfo = { action: 'moveField', sIdx: +card.dataset.sidx, fIdx: +card.dataset.fidx };
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'field');
        card.classList.add('fb2-dragging-src');
        document.body.classList.add('fb2-dragging');
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('fb2-dragging-src');
        cleanupDrag();
      });
    });

    // ── Section headers ──
    container.querySelectorAll('.fb2-sec-header[draggable]').forEach(hdr => {
      hdr.addEventListener('dragstart', (e) => {
        dragInfo = { action: 'moveSection', sIdx: +hdr.dataset.sidx };
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'section');
        const secEl = hdr.closest('.fb2-section');
        if (secEl) secEl.classList.add('fb2-dragging-src');
        document.body.classList.add('fb2-dragging');
      });
      hdr.addEventListener('dragend', () => {
        container.querySelectorAll('.fb2-dragging-src').forEach(el => el.classList.remove('fb2-dragging-src'));
        cleanupDrag();
      });
    });

    // ── Drop targets: blanks ──
    container.querySelectorAll('.fb2-blank').forEach(blank => {
      blank.addEventListener('dragover', (e) => {
        if (!dragInfo || dragInfo.action === 'moveSection') return;
        const targetSpan = sections[+blank.dataset.sidx].fields[+blank.dataset.fidx].colSpan;
        const sourceSpan = dragInfo.action === 'add' ? 1 : sections[dragInfo.sIdx].fields[dragInfo.fIdx].colSpan;
        if (sourceSpan > targetSpan) {
           e.dataTransfer.dropEffect = 'none';
           return;
        }
        e.preventDefault(); e.stopPropagation();
        e.dataTransfer.dropEffect = dragInfo.action === 'add' ? 'copy' : 'move';
        blank.style.borderColor = 'var(--color-primary)';
        blank.style.background = 'var(--color-primary-light)';
      });
      blank.addEventListener('dragleave', () => {
        blank.style.borderColor = '';
        blank.style.background = 'rgba(0,0,0,0.02)';
      });
      blank.addEventListener('drop', (e) => {
        e.preventDefault(); e.stopPropagation();
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
          sel = { type: 'field', sIdx: targetSIdx, fIdx: targetFIdx };
        } else if (dragInfo.action === 'moveField') {
          const { sIdx: srcSIdx, fIdx: srcFIdx } = dragInfo;
          const srcField = { ...sections[srcSIdx].fields[srcFIdx] };
          if (srcField.colSpan > targetSpan) return;
          sections[srcSIdx].fields[srcFIdx] = { id: uid('blk'), type: 'blank', colSpan: srcField.colSpan };
          sections[targetSIdx].fields.splice(targetFIdx, 1, srcField);
          if (targetSpan > srcField.colSpan) {
             sections[targetSIdx].fields.splice(targetFIdx + 1, 0, { id: uid('blk'), type: 'blank', colSpan: targetSpan - srcField.colSpan });
          }
          sel = { type: 'field', sIdx: targetSIdx, fIdx: targetFIdx };
        }
        cleanupDrag(); render();
      });
    });

    // ── Drop targets: field swap ──
    container.querySelectorAll('.fb2-field:not(.fb2-blank)').forEach(fCard => {
      fCard.addEventListener('dragover', (e) => {
        if (!dragInfo || dragInfo.action !== 'moveField') return;
        const targetSpan = sections[+fCard.dataset.sidx].fields[+fCard.dataset.fidx].colSpan;
        const sourceSpan = sections[dragInfo.sIdx].fields[dragInfo.fIdx].colSpan;
        if (sourceSpan !== targetSpan) {
           e.dataTransfer.dropEffect = 'none';
           return;
        }
        e.preventDefault(); e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        fCard.style.boxShadow = '0 0 0 2px var(--color-primary)';
      });
      fCard.addEventListener('dragleave', () => { fCard.style.boxShadow = ''; });
      fCard.addEventListener('drop', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!dragInfo || dragInfo.action !== 'moveField') return;
        const targetSIdx = +fCard.dataset.sidx, targetFIdx = +fCard.dataset.fidx;
        const srcSIdx = dragInfo.sIdx, srcFIdx = dragInfo.fIdx;
        const targetField = sections[targetSIdx].fields[targetFIdx];
        const srcField = sections[srcSIdx].fields[srcFIdx];
        if (targetField.colSpan !== srcField.colSpan) return;
        sections[targetSIdx].fields[targetFIdx] = srcField;
        sections[srcSIdx].fields[srcFIdx] = targetField;
        sel = { type: 'field', sIdx: targetSIdx, fIdx: targetFIdx };
        cleanupDrag(); render();
      });
    });

    // ── Drop target: canvas (section reorder + field-onto-empty-canvas) ──
    const canvas = container.querySelector('#fb2-canvas');
    if (canvas) {
      canvas.addEventListener('dragover', (e) => {
        if (!dragInfo) return;
        if (dragInfo.action === 'moveSection') {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          showSectionIndicator(canvas, getSectionInsertIdx(canvas, e.clientY));
        }
      });
      canvas.addEventListener('drop', (e) => {
        if (!dragInfo) return;
        if (dragInfo.action === 'moveSection') {
          e.preventDefault();
          let toIdx = getSectionInsertIdx(canvas, e.clientY);
          const fromIdx = dragInfo.sIdx;
          const sec = sections.splice(fromIdx, 1)[0];
          if (fromIdx < toIdx) toIdx--;
          sections.splice(toIdx, 0, sec);
          sel = { type: 'section', sIdx: toIdx };
          cleanupDrag();
          render();
        }
      });
    }
  }



  function getSectionInsertIdx(canvasEl, mouseY) {
    const secs = canvasEl.querySelectorAll('.fb2-section');
    for (let i = 0; i < secs.length; i++) {
      const rect = secs[i].getBoundingClientRect();
      if (mouseY < rect.top + rect.height / 2) return i;
    }
    return secs.length;
  }



  function showSectionIndicator(canvasEl, idx) {
    clearIndicators();
    const secs = canvasEl.querySelectorAll('.fb2-section');
    if (idx < secs.length) secs[idx].classList.add('fb2-drop-before');
    else if (secs.length) secs[secs.length - 1].classList.add('fb2-drop-after');
  }

  function clearIndicators() {
    container.querySelectorAll('.fb2-drop-before,.fb2-drop-after').forEach(el => el.classList.remove('fb2-drop-before', 'fb2-drop-after'));
  }

  function cleanupDrag() {
    dragInfo = null;
    clearIndicators();
    document.body.classList.remove('fb2-dragging');
  }

  // ════════════════════════
  //  SAVE
  // ════════════════════════

  function handleSave() {
    const name = container.querySelector('#fb2-name')?.value.trim();
    const desc = container.querySelector('#fb2-desc')?.value.trim();
    if (!name) { showToast('Form name is required', 'error'); container.querySelector('#fb2-name')?.focus(); return; }
    const totalFields = sections.reduce((sum, s) => sum + (s.fields?.length || 0), 0);
    if (totalFields === 0) { showToast('Add at least one field', 'error'); return; }

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

    const template = { id: isEdit ? id : uid('fmt'), name, description: desc, sections: cleanSections };
    const templates = store.getAll('formTemplates');
    if (isEdit) { const idx = templates.findIndex(t => t.id === id); if (idx >= 0) templates[idx] = template; }
    else templates.push(template);

    store.save('formTemplates', templates);
    showToast(`Form "${name}" saved`, 'success');
    router.navigate('/settings?tab=forms');
  }

  // ════════════════════════
  //  STYLES
  // ════════════════════════

  function getStyles() {
    return `<style>
      .fb2-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px}
      .fb2-body{display:flex;gap:0;height:calc(100vh - var(--topbar-height) - 110px);min-height:500px}
      .fb2-left{flex:1;display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--border-color);border-radius:12px 0 0 12px;background:var(--content-bg)}
      .fb2-right{width:300px;min-width:280px;border:1px solid var(--border-color);border-left:none;border-radius:0 12px 12px 0;background:var(--card-bg);display:flex;flex-direction:column;overflow-y:auto}
      .fb2-meta{display:flex;gap:16px;padding:16px 20px;border-bottom:1px solid var(--border-color);background:var(--card-bg);flex-shrink:0}
      .fb2-canvas{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:16px}
      .fb2-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:8px;color:var(--text-tertiary)}

      /* Toolbox */
      .fb2-toolbox{display:flex;align-items:center;gap:8px;padding:12px 20px;border-top:1px solid var(--border-color);background:var(--card-bg);flex-shrink:0;flex-wrap:wrap}
      .fb2-toolbox-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-tertiary);margin-right:4px}
      .fb2-tool{display:flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid var(--border-color);border-radius:6px;background:var(--card-bg);cursor:grab;font-size:12px;font-weight:500;color:var(--text-secondary);transition:all .15s;user-select:none}
      .fb2-tool:hover{border-color:var(--color-primary);color:var(--color-primary);box-shadow:0 2px 8px rgba(27,109,224,.1)}
      .fb2-tool .material-icons-outlined{font-size:16px}

      /* Sections */
      .fb2-section{flex-shrink:0;border:1px solid var(--border-color);border-radius:10px;background:var(--card-bg);overflow:hidden;transition:border-color .15s,box-shadow .15s}
      .fb2-section.fb2-sel{border-color:var(--color-primary);box-shadow:0 0 0 3px rgba(27,109,224,.12)}
      .fb2-section.fb2-dragging-src{opacity:.35}
      .fb2-spacer-sec{border-style:dashed;background:transparent;min-height:50px}
      .fb2-sec-header{display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--content-bg);border-bottom:1px solid var(--border-color);cursor:pointer}
      .fb2-drag-handle{color:var(--text-tertiary);cursor:grab}
      .fb2-drag-handle:hover{color:var(--text-primary)}
      .fb2-sec-title{flex:1;border:none;background:transparent;font-weight:600;font-size:14px;color:var(--text-primary);outline:none;padding:4px 8px;border-radius:4px}
      .fb2-sec-title:focus{background:var(--card-bg);box-shadow:inset 0 0 0 1px var(--border-color)}
      .fb2-col-btns{display:flex;gap:2px}
      .fb2-col-btn{width:32px;height:28px;border:1px solid var(--border-color);background:var(--card-bg);border-radius:4px;font-size:12px;font-weight:600;color:var(--text-secondary);cursor:pointer;transition:all .15s}
      .fb2-col-btn:hover{border-color:var(--color-primary);color:var(--color-primary)}
      .fb2-col-btn.active{background:var(--color-primary);color:white;border-color:var(--color-primary)}

      /* Field grid */
      .fb2-fields{display:grid;gap:10px;padding:14px;min-height:60px}
      .fb2-field-empty{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:24px;border:2px dashed var(--border-color);border-radius:8px;color:var(--text-tertiary);font-size:12px;transition:all .15s}

      /* Field cards */
      .fb2-field{background:var(--card-bg);border:1px solid var(--border-color);border-radius:8px;cursor:pointer;transition:all .15s;overflow:hidden;position:relative;user-select:none}
      .fb2-field:hover{border-color:var(--color-primary);box-shadow:0 2px 8px rgba(0,0,0,.06)}
      .fb2-field.fb2-sel{border-color:var(--color-primary);box-shadow:0 0 0 3px rgba(27,109,224,.12)}
      .fb2-field.fb2-dragging-src{opacity:.25}
      .fb2-field-bar{display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--content-bg);border-bottom:1px solid var(--border-color)}
      .fb2-ftype-lbl{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--text-tertiary)}

      /* Previews removed in favor of global form CSS */

      /* Sidebar */
      .fb2-sb-head{display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid var(--border-color);font-weight:600;font-size:14px}
      .fb2-sb-body{padding:20px;display:flex;flex-direction:column;gap:16px}
      .fb2-sb-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;text-align:center;flex:1}

      /* Add section */
      .fb2-add-row{display:flex;gap:8px;justify-content:center;flex-shrink:0}
      .fb2-add-sec{display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 24px;border:2px dashed var(--border-color);border-radius:10px;background:transparent;color:var(--text-tertiary);font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;flex:1}
      .fb2-add-sec:hover{border-color:var(--color-primary);color:var(--color-primary);background:rgba(27,109,224,.03)}
      .fb2-add-sec-alt{border-style:dotted}

      /* Drop indicators */
      .fb2-drop-before{border-top:3px solid var(--color-primary)!important}
      .fb2-drop-after{border-bottom:3px solid var(--color-primary)!important}

      /* Drag global state */
      body.fb2-dragging .fb2-fields{min-height:80px}
      body.fb2-dragging .fb2-field-empty{border-color:var(--color-primary);background:var(--color-primary-light)}
    </style>`;
  }

  // ── Init ──
  render();
}
