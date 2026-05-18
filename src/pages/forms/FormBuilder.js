// ============================================
// FIELDFORGE — FORM BUILDER PAGE
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';

export function renderFormBuilder(container, { id }) {
  const isEdit = id && id !== 'new';
  const templates = store.getAll('formTemplates');
  const existing = isEdit ? templates.find(t => t.id === id) : null;
  
  if (isEdit && !existing) {
    container.innerHTML = '<div class="empty-state"><h3>Template not found</h3></div>';
    return;
  }

  let sections = existing ? JSON.parse(JSON.stringify(existing.sections || [])) : [
    { id: 'sec_' + Math.random().toString(36).substr(2, 5), title: 'General Info', fields: [] }
  ];

  function render() {
    container.innerHTML = `
      <div class="page-header">
        <div style="display:flex; align-items:center; gap:12px">
          <button class="btn btn-ghost btn-icon" id="btn-back"><span class="material-icons-outlined">arrow_back</span></button>
          <h1>${isEdit ? 'Edit Form Template' : 'Create Form Template'}</h1>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
          <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> Save Template</button>
        </div>
      </div>

      <div class="card" style="max-width:1000px; margin:0 auto">
        <div class="card-body">
          <div style="display:flex; flex-direction:column; gap:24px">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px">
              <div class="form-group">
                <label class="form-label">Form Name <span style="color:var(--color-danger)">*</span></label>
                <input class="form-input" id="form-name" value="${escapeHTML(existing?.name || '')}" placeholder="e.g. Daily Safety Audit" />
              </div>
              <div class="form-group">
                <label class="form-label">Description</label>
                <input class="form-input" id="form-desc" value="${escapeHTML(existing?.description || '')}" placeholder="Optional description..." />
              </div>
            </div>
            
            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:20px">
              <h4 style="margin:0">Form Structure</h4>
              <button class="btn btn-secondary btn-sm" id="btn-add-section">
                <span class="material-icons-outlined" style="font-size:16px">library_add</span> Add Section
              </button>
            </div>

            <div id="sections-list" style="display:flex; flex-direction:column; gap:24px; padding-bottom:40px">
              ${sections.map((sec, sIdx) => `
                <div class="section-card" data-section-index="${sIdx}" style="border:1px solid var(--border-color); border-radius:12px; background:var(--bg-color); overflow:hidden; box-shadow:var(--shadow-sm)">
                  <div style="padding:16px 20px; background:var(--content-bg); border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center">
                    <div style="display:flex; align-items:center; gap:12px; flex:1">
                      <span class="material-icons-outlined" style="color:var(--text-tertiary); cursor:grab">drag_indicator</span>
                      <input class="form-input section-title" value="${escapeHTML(sec.title)}" placeholder="Section Title..." style="font-weight:600; font-size:16px; background:transparent; border:none; padding:4px; margin:0; width:100%" />
                    </div>
                    <div style="display:flex; gap:12px">
                      <button class="btn btn-secondary btn-sm btn-add-field-to-sec" data-section-index="${sIdx}">
                        <span class="material-icons-outlined" style="font-size:16px">add</span> Add Field
                      </button>
                      <button class="btn btn-ghost btn-icon btn-sm remove-section" data-section-index="${sIdx}" style="color:var(--color-danger)">
                        <span class="material-icons-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                  <div class="fields-container" style="padding:20px; display:flex; flex-direction:column; gap:16px">
                    ${sec.fields.map((f, fIdx) => `
                      <div class="field-row" data-field-index="${fIdx}" style="display:grid; grid-template-columns: 1fr 160px 100px 40px; gap:12px; align-items:flex-end; background:white; padding:16px; border-radius:8px; border:1px solid var(--border-color); position:relative">
                        <div class="form-group" style="margin:0">
                          <label class="form-label" style="font-size:11px; text-transform:uppercase; color:var(--text-tertiary)">Field Label</label>
                          <input class="form-input field-label" value="${escapeHTML(f.label)}" placeholder="Enter question or label..." />
                        </div>
                        <div class="form-group" style="margin:0">
                          <label class="form-label" style="font-size:11px; text-transform:uppercase; color:var(--text-tertiary)">Type</label>
                          <select class="form-select field-type">
                            <option value="text" ${f.type === 'text' ? 'selected' : ''}>Text</option>
                            <option value="textarea" ${f.type === 'textarea' ? 'selected' : ''}>Long Text</option>
                            <option value="checkbox" ${f.type === 'checkbox' ? 'selected' : ''}>Checkbox / Yes-No</option>
                            <option value="select" ${f.type === 'select' ? 'selected' : ''}>Dropdown Menu</option>
                            <option value="date" ${f.type === 'date' ? 'selected' : ''}>Date Picker</option>
                            <option value="signature" ${f.type === 'signature' ? 'selected' : ''}>Signature Field</option>
                          </select>
                        </div>
                        <div class="form-group" style="margin:0; text-align:center">
                          <label class="form-label" style="font-size:11px; text-transform:uppercase; color:var(--text-tertiary)">Required</label>
                          <div style="height:38px; display:flex; align-items:center; justify-content:center">
                            <input type="checkbox" class="field-required" ${f.required ? 'checked' : ''} style="width:20px; height:20px; cursor:pointer" />
                          </div>
                        </div>
                        <button class="btn btn-ghost btn-icon btn-sm remove-field" data-section-index="${sIdx}" data-field-index="${fIdx}" style="color:var(--color-danger); height:38px">
                          <span class="material-icons-outlined">close</span>
                        </button>
                        
                        ${f.type === 'select' ? `
                          <div style="grid-column: 1 / -1; margin-top:8px; padding:12px; background:var(--bg-color); border-radius:4px">
                            <label class="form-label" style="font-size:11px">Dropdown Options (comma separated)</label>
                            <input class="form-input field-options" style="font-size:13px" value="${escapeHTML(f.options?.join(', ') || '')}" placeholder="e.g. Option 1, Option 2, Option 3" />
                          </div>
                        ` : ''}
                      </div>
                    `).join('')}
                    ${!sec.fields.length ? `
                      <div style="text-align:center; color:var(--text-tertiary); padding:30px; border:2px dashed var(--border-color); border-radius:8px">
                        <span class="material-icons-outlined" style="font-size:32px; display:block; margin-bottom:8px">post_add</span>
                        No fields in this section yet. Click "Add Field" to start.
                      </div>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    bindEvents();
  }

  function syncAll() {
    container.querySelectorAll('.section-card').forEach(secEl => {
      const sIdx = parseInt(secEl.dataset.sectionIndex);
      sections[sIdx].title = secEl.querySelector('.section-title').value;
      
      secEl.querySelectorAll('.field-row').forEach(fieldEl => {
        const fIdx = parseInt(fieldEl.dataset.fieldIndex);
        const f = sections[sIdx].fields[fIdx];
        f.label = fieldEl.querySelector('.field-label').value;
        f.type = fieldEl.querySelector('.field-type').value;
        f.required = fieldEl.querySelector('.field-required').checked;
        if (f.type === 'select') {
          const optVal = fieldEl.querySelector('.field-options')?.value || '';
          f.options = optVal.split(',').map(s => s.trim()).filter(Boolean);
        }
      });
    });
  }

  function bindEvents() {
    container.querySelector('#btn-back').addEventListener('click', () => router.navigate('/settings?tab=forms'));
    container.querySelector('#btn-cancel').addEventListener('click', () => router.navigate('/settings?tab=forms'));

    container.querySelector('#btn-save').addEventListener('click', () => {
      syncAll();
      const name = container.querySelector('#form-name').value.trim();
      const desc = container.querySelector('#form-desc').value.trim();

      if (!name) {
        showToast('Form name is required', 'error');
        container.querySelector('#form-name').focus();
        return;
      }
      const totalFields = sections.reduce((sum, s) => sum + s.fields.length, 0);
      if (totalFields === 0) {
        showToast('Please add at least one field to the form', 'error');
        return;
      }

      const newTemplate = {
        id: isEdit ? id : 'fmt_' + Math.random().toString(36).substr(2, 9),
        name,
        description: desc,
        sections: sections.map(s => ({ ...s }))
      };

      const currentTemplates = store.getAll('formTemplates');
      if (isEdit) {
        const idx = currentTemplates.findIndex(t => t.id === id);
        currentTemplates[idx] = newTemplate;
      } else {
        currentTemplates.push(newTemplate);
      }

      store.save('formTemplates', currentTemplates);
      showToast(`Form template "${name}" saved`, 'success');
      router.navigate('/settings?tab=forms');
    });

    container.querySelector('#btn-add-section').addEventListener('click', () => {
      syncAll();
      sections.push({ id: 'sec_' + Math.random().toString(36).substr(2, 5), title: 'New Section', fields: [] });
      render();
    });

    container.querySelectorAll('.btn-add-field-to-sec').forEach(btn => {
      btn.addEventListener('click', () => {
        syncAll();
        const sIdx = parseInt(btn.dataset.sectionIndex);
        sections[sIdx].fields.push({ id: 'f_' + Math.random().toString(36).substr(2, 5), type: 'text', label: '', required: false });
        render();
      });
    });

    container.querySelectorAll('.remove-section').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Are you sure you want to remove this entire section and all its fields?')) {
          const sIdx = parseInt(btn.dataset.sectionIndex);
          sections.splice(sIdx, 1);
          render();
        }
      });
    });

    container.querySelectorAll('.remove-field').forEach(btn => {
      btn.addEventListener('click', () => {
        const sIdx = parseInt(btn.dataset.sectionIndex);
        const fIdx = parseInt(btn.dataset.fieldIndex);
        sections[sIdx].fields.splice(fIdx, 1);
        render();
      });
    });

    container.querySelectorAll('.field-type').forEach(sel => {
      sel.addEventListener('change', () => {
        syncAll();
        render();
      });
    });
  }

  render();
}
