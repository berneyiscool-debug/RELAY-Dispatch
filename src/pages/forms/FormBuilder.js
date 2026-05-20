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
    { id: 'sec_' + Math.random().toString(36).substr(2, 5), title: 'General Info', width: 'full', fields: [] }
  ];

  sections.forEach(sec => {
    if (!sec.width) sec.width = 'full';
    (sec.fields || []).forEach(f => {
      if (!f.width) f.width = 'full';
    });
  });

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
              <div style="display:flex; gap:8px">
                <button class="btn btn-secondary btn-sm" id="btn-add-spacer-section">
                  <span class="material-icons-outlined" style="font-size:16px">space_bar</span> Add Spacer Block
                </button>
                <button class="btn btn-primary btn-sm" id="btn-add-section">
                  <span class="material-icons-outlined" style="font-size:16px">library_add</span> Add Section
                </button>
              </div>
            </div>

            <div id="sections-list" style="display:grid; grid-template-columns: 1fr 1fr; gap:24px; padding-bottom:40px">
              ${sections.map((sec, sIdx) => {
                const secIsHalf = sec.width === 'half';
                if (sec.isSpacer) {
                  return `
                    <div class="section-card" data-section-index="${sIdx}" style="grid-column: span ${secIsHalf ? '1' : '2'}; border:2px dashed var(--border-color); border-radius:12px; background:transparent; display:flex; align-items:center; justify-content:space-between; padding:16px; min-height:100px">
                      <div style="display:flex; gap:4px">
                        <button class="btn btn-ghost btn-icon btn-sm move-sec-up" data-section-index="${sIdx}" ${sIdx === 0 ? 'disabled' : ''}><span class="material-icons-outlined" style="font-size:18px">${secIsHalf ? 'arrow_back' : 'keyboard_arrow_up'}</span></button>
                        <button class="btn btn-ghost btn-icon btn-sm move-sec-down" data-section-index="${sIdx}" ${sIdx === sections.length - 1 ? 'disabled' : ''}><span class="material-icons-outlined" style="font-size:18px">${secIsHalf ? 'arrow_forward' : 'keyboard_arrow_down'}</span></button>
                      </div>
                      <div style="color:var(--text-tertiary); font-weight:600; text-transform:uppercase; letter-spacing:1px; font-size:13px; display:flex; align-items:center; gap:8px">
                        <span class="material-icons-outlined">space_bar</span> Empty Layout Spacer
                      </div>
                      <div style="display:flex; gap:4px">
                        <button class="btn btn-ghost btn-icon btn-sm toggle-sec-width" data-section-index="${sIdx}" title="Toggle Half/Full Width"><span class="material-icons-outlined" style="font-size:18px">${secIsHalf ? 'width_normal' : 'width_full'}</span></button>
                        <button class="btn btn-ghost btn-icon btn-sm remove-section" data-section-index="${sIdx}" style="color:var(--color-danger)"><span class="material-icons-outlined">delete</span></button>
                      </div>
                    </div>
                  `;
                }

                return `
                <div class="section-card" data-section-index="${sIdx}" style="grid-column: span ${secIsHalf ? '1' : '2'}; border:1px solid var(--border-color); border-radius:12px; background:var(--bg-color); overflow:hidden; box-shadow:var(--shadow-sm)">
                  <div style="padding:16px 20px; background:var(--content-bg); border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px">
                    <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:200px">
                      <div style="display:flex; flex-direction:${secIsHalf ? 'row' : 'column'}; gap:2px">
                        <button class="btn btn-ghost btn-icon btn-sm move-sec-up" data-section-index="${sIdx}" ${sIdx === 0 ? 'disabled' : ''} style="height:24px; width:24px; padding:0"><span class="material-icons-outlined" style="font-size:18px">${secIsHalf ? 'arrow_back' : 'keyboard_arrow_up'}</span></button>
                        <button class="btn btn-ghost btn-icon btn-sm move-sec-down" data-section-index="${sIdx}" ${sIdx === sections.length - 1 ? 'disabled' : ''} style="height:24px; width:24px; padding:0"><span class="material-icons-outlined" style="font-size:18px">${secIsHalf ? 'arrow_forward' : 'keyboard_arrow_down'}</span></button>
                      </div>
                      <input class="form-input section-title" value="${escapeHTML(sec.title)}" placeholder="Section Title..." style="font-weight:600; font-size:16px; background:transparent; border:none; padding:4px; margin:0; flex:1" />
                    </div>
                    <div style="display:flex; gap:8px; align-items:center">
                      <button class="btn btn-ghost btn-sm btn-icon toggle-sec-width" data-section-index="${sIdx}" title="Toggle Half/Full Width">
                        <span class="material-icons-outlined" style="font-size:18px">${secIsHalf ? 'width_normal' : 'width_full'}</span>
                      </button>
                      <button class="btn btn-secondary btn-sm btn-add-field-to-sec" data-section-index="${sIdx}">
                        <span class="material-icons-outlined" style="font-size:16px">add</span> Add Field
                      </button>
                      <button class="btn btn-ghost btn-icon btn-sm remove-section" data-section-index="${sIdx}" style="color:var(--color-danger)">
                        <span class="material-icons-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                  <div class="fields-container" style="padding:20px; display:grid; grid-template-columns: 1fr 1fr; gap:16px">
                    ${sec.fields.map((f, fIdx) => {
                      const isHalf = f.width === 'half';
                      return `
                      <div class="field-row" data-field-index="${fIdx}" style="grid-column: span ${isHalf ? '1' : '2'}; display:flex; flex-direction:column; gap:12px; background:${f.type === 'spacer' ? 'transparent' : 'white'}; padding:16px; border-radius:8px; border:${f.type === 'spacer' ? '2px dashed var(--border-color)' : '1px solid var(--border-color)'}; position:relative; min-height:${f.type === 'spacer' ? '80px' : 'auto'}">
                        
                        ${f.type === 'spacer' ? `
                          <div style="flex:1; display:flex; align-items:center; justify-content:center; color:var(--text-tertiary); font-weight:600; text-transform:uppercase; font-size:12px; letter-spacing:1px; gap:8px">
                            <span class="material-icons-outlined">space_bar</span> Empty Spacer
                          </div>
                        ` : `
                          <div style="display:flex; gap:12px; align-items:flex-start; flex-wrap:wrap">
                            <div class="form-group" style="margin:0; flex:2; min-width:150px">
                              <label class="form-label" style="font-size:11px; text-transform:uppercase; color:var(--text-tertiary)">${f.type === 'info' ? 'Instruction / Info Text' : 'Field Label'}</label>
                              ${f.type === 'info' 
                                ? `<textarea class="form-textarea field-label" placeholder="Enter instructional or informative text for the user..." style="min-height:50px">${escapeHTML(f.label)}</textarea>`
                                : `<input class="form-input field-label" value="${escapeHTML(f.label)}" placeholder="Enter question or label..." />`
                              }
                            </div>
                            <div class="form-group" style="margin:0; flex:1; min-width:120px">
                              <label class="form-label" style="font-size:11px; text-transform:uppercase; color:var(--text-tertiary)">Type</label>
                              <select class="form-select field-type">
                                <option value="text" ${f.type === 'text' ? 'selected' : ''}>Text Input</option>
                                <option value="textarea" ${f.type === 'textarea' ? 'selected' : ''}>Long Text</option>
                                <option value="checkbox" ${f.type === 'checkbox' ? 'selected' : ''}>Checkbox / Yes-No</option>
                                <option value="select" ${f.type === 'select' ? 'selected' : ''}>Dropdown Menu</option>
                                <option value="date" ${f.type === 'date' ? 'selected' : ''}>Date Picker</option>
                                <option value="signature" ${f.type === 'signature' ? 'selected' : ''}>Signature Field</option>
                                <option value="info" ${f.type === 'info' ? 'selected' : ''}>Information Box</option>
                                <option value="spacer" ${f.type === 'spacer' ? 'selected' : ''}>Empty Spacer</option>
                              </select>
                            </div>
                          </div>
                        `}

                        ${f.type === 'spacer' ? `
                          <select class="form-select field-type" style="display:none"><option value="spacer" selected></option></select>
                        ` : ''}
                        
                        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed var(--border-color); padding-top:12px">
                          <div style="display:flex; align-items:center; gap:12px">
                            ${(f.type !== 'info' && f.type !== 'spacer') ? `
                              <label style="display:flex; align-items:center; gap:6px; font-size:13px; cursor:pointer">
                                <input type="checkbox" class="field-required" ${f.required ? 'checked' : ''} style="width:16px; height:16px; margin:0" /> Required
                              </label>
                            ` : `<input type="checkbox" class="field-required" style="display:none" />`}
                          </div>
                          <div style="display:flex; gap:4px; align-items:center">
                            <button class="btn btn-ghost btn-icon btn-sm move-field-up" data-section-index="${sIdx}" data-field-index="${fIdx}" ${fIdx === 0 ? 'disabled' : ''} title="Move Left/Up"><span class="material-icons-outlined" style="font-size:18px">${isHalf ? 'arrow_back' : 'arrow_upward'}</span></button>
                            <button class="btn btn-ghost btn-icon btn-sm move-field-down" data-section-index="${sIdx}" data-field-index="${fIdx}" ${fIdx === sec.fields.length - 1 ? 'disabled' : ''} title="Move Right/Down"><span class="material-icons-outlined" style="font-size:18px">${isHalf ? 'arrow_forward' : 'arrow_downward'}</span></button>
                            <div style="width:1px; height:16px; background:var(--border-color); margin:0 4px"></div>
                            <button class="btn btn-ghost btn-icon btn-sm toggle-field-width" data-section-index="${sIdx}" data-field-index="${fIdx}" title="Toggle Half/Full Width"><span class="material-icons-outlined" style="font-size:18px">${isHalf ? 'width_normal' : 'width_full'}</span></button>
                            <button class="btn btn-ghost btn-icon btn-sm remove-field" data-section-index="${sIdx}" data-field-index="${fIdx}" style="color:var(--color-danger)" title="Remove Field"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
                          </div>
                        </div>
                        
                        ${f.type === 'select' ? `
                          <div style="margin-top:4px; padding:12px; background:var(--bg-color); border-radius:4px">
                            <label class="form-label" style="font-size:11px">Dropdown Options (comma separated)</label>
                            <input class="form-input field-options" style="font-size:13px" value="${escapeHTML(f.options?.join(', ') || '')}" placeholder="e.g. Option 1, Option 2, Option 3" />
                          </div>
                        ` : ''}
                      </div>
                    `;
                    }).join('')}
                    ${!sec.fields.length ? `
                      <div style="grid-column: 1 / -1; text-align:center; color:var(--text-tertiary); padding:30px; border:2px dashed var(--border-color); border-radius:8px">
                        <span class="material-icons-outlined" style="font-size:32px; display:block; margin-bottom:8px">post_add</span>
                        No fields in this section yet. Click "Add Field" to start.
                      </div>
                    ` : ''}
                  </div>
                </div>
              `;
              }).join('')}
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
      if (sections[sIdx].isSpacer) return;

      const titleInput = secEl.querySelector('.section-title');
      if (titleInput) sections[sIdx].title = titleInput.value;
      
      secEl.querySelectorAll('.field-row').forEach(fieldEl => {
        const fIdx = parseInt(fieldEl.dataset.fieldIndex);
        const f = sections[sIdx].fields[fIdx];
        
        const typeSelect = fieldEl.querySelector('.field-type');
        if (typeSelect) f.type = typeSelect.value;

        const labelInput = fieldEl.querySelector('.field-label');
        if (labelInput) f.label = labelInput.value;
        
        const reqInput = fieldEl.querySelector('.field-required');
        if (reqInput) f.required = reqInput.checked;

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
      sections.push({ id: 'sec_' + Math.random().toString(36).substr(2, 5), title: 'New Section', width: 'full', fields: [] });
      render();
    });

    container.querySelector('#btn-add-spacer-section').addEventListener('click', () => {
      syncAll();
      sections.push({ id: 'sec_' + Math.random().toString(36).substr(2, 5), title: '', isSpacer: true, width: 'half', fields: [] });
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
        syncAll();
        const sIdx = parseInt(btn.dataset.sectionIndex);
        const fIdx = parseInt(btn.dataset.fieldIndex);
        sections[sIdx].fields.splice(fIdx, 1);
        render();
      });
    });

    container.querySelectorAll('.toggle-sec-width').forEach(btn => {
      btn.addEventListener('click', () => {
        syncAll();
        const sIdx = parseInt(btn.dataset.sectionIndex);
        sections[sIdx].width = sections[sIdx].width === 'half' ? 'full' : 'half';
        render();
      });
    });

    container.querySelectorAll('.toggle-field-width').forEach(btn => {
      btn.addEventListener('click', () => {
        syncAll();
        const sIdx = parseInt(btn.dataset.sectionIndex);
        const fIdx = parseInt(btn.dataset.fieldIndex);
        sections[sIdx].fields[fIdx].width = sections[sIdx].fields[fIdx].width === 'half' ? 'full' : 'half';
        render();
      });
    });

    container.querySelectorAll('.move-sec-up').forEach(btn => {
      btn.addEventListener('click', () => {
        syncAll();
        const sIdx = parseInt(btn.dataset.sectionIndex);
        if (sIdx > 0) {
          const temp = sections[sIdx - 1];
          sections[sIdx - 1] = sections[sIdx];
          sections[sIdx] = temp;
          render();
        }
      });
    });

    container.querySelectorAll('.move-sec-down').forEach(btn => {
      btn.addEventListener('click', () => {
        syncAll();
        const sIdx = parseInt(btn.dataset.sectionIndex);
        if (sIdx < sections.length - 1) {
          const temp = sections[sIdx + 1];
          sections[sIdx + 1] = sections[sIdx];
          sections[sIdx] = temp;
          render();
        }
      });
    });

    container.querySelectorAll('.move-field-up').forEach(btn => {
      btn.addEventListener('click', () => {
        syncAll();
        const sIdx = parseInt(btn.dataset.sectionIndex);
        const fIdx = parseInt(btn.dataset.fieldIndex);
        if (fIdx > 0) {
          const temp = sections[sIdx].fields[fIdx - 1];
          sections[sIdx].fields[fIdx - 1] = sections[sIdx].fields[fIdx];
          sections[sIdx].fields[fIdx] = temp;
          render();
        }
      });
    });

    container.querySelectorAll('.move-field-down').forEach(btn => {
      btn.addEventListener('click', () => {
        syncAll();
        const sIdx = parseInt(btn.dataset.sectionIndex);
        const fIdx = parseInt(btn.dataset.fieldIndex);
        if (fIdx < sections[sIdx].fields.length - 1) {
          const temp = sections[sIdx].fields[fIdx + 1];
          sections[sIdx].fields[fIdx + 1] = sections[sIdx].fields[fIdx];
          sections[sIdx].fields[fIdx] = temp;
          render();
        }
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
