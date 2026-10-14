// ============================================
// RELAY DISPATCH — LEAD DETAIL PAGE (High Density)
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showModal } from '../../components/Modal.js';
import { escapeHTML } from '../../utils/security.js';
import { showToast } from '../../components/Notifications.js';
import { updateBreadcrumbDetail } from '../../components/Breadcrumb.js';
import { renderDetailHeader } from '../../components/DetailHeader.js';
import { updateSidebarActive } from '../../components/Sidebar.js';
import { roundCurrency } from '../../utils/pricing.js';
import {
  LEAD_STAGES, LEAD_LIKELIHOOD, LEAD_PRIORITY_BADGES, LEAD_STAGE_ACCENTS,
  isLeadStale, isOpenLead, lastLeadActivityAt, leadDateLabel, leadIdleDays,
  leadNextActionHtml, leadOwnerHtml, leadStageBadge, primaryLeadStage,
  logLeadStageChange, notifyLeadOwner,
} from './leadStages.js';
import {
  addLeadActivityEntry, buildLeadActivityEntry, isLeadActivityImage,
  leadActivityFileSize, leadActivityInitials, normalizeLeadActivityLog,
  removeLeadActivityEntry, shouldCollapseLeadActivity,
} from './leadActivity.js';

// The Details / Activity split is owned by the route (?tab=), so every tab
// switch re-enters renderLeadDetail. Keeping the composer's work above the
// render stops a trip to the other tab from throwing away a half-written note.
let composerLeadId = null;
let stagedFiles = [];
let composerDraft = '';

// Display an uploaded activity image at full size in a centered lightbox modal.
// Mirrors the jobs detail page so the two feeds behave identically.
function showImageLightbox(src, name) {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px';

  const img = document.createElement('img');
  img.src = src;
  img.alt = name || 'Image';
  img.style.cssText = 'max-width:100%;max-height:70vh;object-fit:contain;border-radius:var(--border-radius);background:var(--content-bg)';
  wrapper.appendChild(img);

  showModal({
    title: name || 'Image',
    content: wrapper,
    size: 'modal-xl'
  });
}

function currentUserName() {
  try {
    return JSON.parse(localStorage.getItem('currentUser') || '{}').name || 'Unknown User';
  } catch {
    return 'Unknown User';
  }
}

export function renderLeadDetail(container, { id, tab }) {
  let lead = store.getById('leads', id);
  if (!lead) {
    container.innerHTML = '<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Lead not found</h3></div>';
    return;
  }

  updateBreadcrumbDetail(lead.title);

  // The contextual submenu drives this: /leads/:id?tab=overview or ?tab=activity.
  const activeTab = tab === 'activity' ? 'activity' : 'overview';

  // A different lead gets a clean composer; a tab switch keeps the draft.
  if (composerLeadId !== id) {
    composerLeadId = id;
    stagedFiles = [];
    composerDraft = '';
  }

  function r(label, value, opts = {}) {
    return `
      <div class="detail-row">
        <span class="detail-row-label">${label}</span>
        <span class="detail-row-value${opts.amount ? ' detail-row-value--amount' : ''}">${value || '—'}</span>
      </div>`;
  }

  const NOTE_FIELDS = ['requirements', 'description'];

  // Inline note editor: small note tweaks shouldn't need a trip to the edit page.
  function noteBlock(field, icon, label, value, fallback) {
    const text = value || '';
    return `
              <div class="lead-detail-section lead-note-block" data-note-field="${field}">
                <div class="lead-note-head">
                  <div class="lead-detail-section-title"><span class="material-icons-outlined">${icon}</span> ${label}</div>
                  <button type="button" class="btn-icon lead-note-edit" data-note-edit="${field}" title="Edit ${label}" aria-label="Edit ${label}">
                    <span class="material-icons-outlined">edit</span>
                  </button>
                </div>
                <p class="lead-detail-note">${escapeHTML(text || fallback)}</p>
                <div class="lead-note-editor" data-note-editor hidden>
                  <textarea class="form-textarea lead-note-textarea" data-note-input="${field}" rows="4" placeholder="${fallback}">${escapeHTML(text)}</textarea>
                  <div class="lead-note-actions">
                    <button type="button" class="btn btn-secondary btn-sm" data-note-cancel="${field}">Cancel</button>
                    <button type="button" class="btn btn-primary btn-sm" data-note-save="${field}"><span class="material-icons-outlined" style="font-size:14px">save</span> Save</button>
                  </div>
                </div>
              </div>`;
  }

  function toggleNoteEditor(field, on) {
    if (!NOTE_FIELDS.includes(field)) return;
    const block = container.querySelector(`.lead-note-block[data-note-field="${field}"]`);
    if (!block) return;
    block.classList.toggle('is-editing', on);
    const editor = block.querySelector('[data-note-editor]');
    if (editor) editor.hidden = !on;
    if (on) block.querySelector('[data-note-input]').focus();
  }

  function render() {
    // store.update writes back a NEW record object, so the reference captured
    // when the page was built goes stale after every save. Re-read it here.
    lead = store.getById('leads', id) || lead;

    if (!lead.stageHistory || !Array.isArray(lead.stageHistory)) {
      lead.stageHistory = [];
    }

    // Recomputed per render so the forecast follows a pipeline-step click.
    const stage = primaryLeadStage(lead);
    const prob = LEAD_LIKELIHOOD[stage] ?? 0;
    const weightedValue = (lead.value || 0) * (prob / 100);
    const idleDays = leadIdleDays(lead);
    const lastActivityLabel = leadDateLabel(lastLeadActivityAt(lead));
    const stale = isOpenLead(lead) && isLeadStale(lead);
    // Stepper order excludes Lost so a won lead still shows a completed ramp.
    const stepperOrder = LEAD_STAGES.filter((s) => s !== 'Lost');
    const stepperIndex = stepperOrder.indexOf(stage);
    const variance = lead.budget ? (Number(lead.budget) || 0) - (Number(lead.value) || 0) : null;
    const money = (n) => `$${(Number(n) || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const activityLog = normalizeLeadActivityLog(lead.activityLog);

    const allActivities = store.getAll('activity') || [];
    const globalLeadActivities = allActivities.filter(a => (a.leadId === id || a.entityId === id));
    
    // De-duplicate activities by id or timestamp
    const activityMap = new Map();
    (lead.stageHistory || []).forEach(a => activityMap.set(a.id || a.timestamp, a));
    globalLeadActivities.forEach(a => {
      const key = a.id || a.timestamp;
      if (!activityMap.has(key)) {
        activityMap.set(key, {
          id: a.id,
          status: a.status || lead.status,
          text: a.text,
          user: a.user || 'System',
          timestamp: a.timestamp
        });
      }
    });

    const leadActivities = Array.from(activityMap.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const activityPanelHtml = `<div class="tab-panel" id="lead-tab-activity" data-tab-panel="activity" role="tabpanel"${activeTab === 'activity' ? '' : ' hidden'}>
        <div class="card lead-activity-card">
          <div class="card-header">
            <h4><span class="material-icons-outlined">forum</span> Activity &amp; Attachments${activityLog.length ? `<span class="lead-activity-count">${activityLog.length}</span>` : ''}</h4>
          </div>
          <div class="card-body">
            <div class="lead-activity-composer">
              <textarea id="lead-activity-input" class="form-textarea lead-activity-textarea" rows="3" placeholder="Add a note about this lead…">${escapeHTML(composerDraft)}</textarea>
              ${stagedFiles.length === 0 ? '' : `
                <div class="lead-activity-staged">
                  ${stagedFiles.map((f, i) => `
                    <span class="lead-activity-staged-chip">
                      <span class="material-icons-outlined">attach_file</span>
                      <span class="lead-activity-staged-name">${escapeHTML(f.name)}</span>
                      <span class="lead-activity-staged-size">${leadActivityFileSize(f.size)}</span>
                      <button type="button" class="lead-activity-staged-remove" data-idx="${i}" title="Remove attachment" aria-label="Remove attachment"><span class="material-icons-outlined">close</span></button>
                    </span>
                  `).join('')}
                </div>
              `}
              <div class="lead-activity-composer-bar">
                <label class="btn btn-secondary btn-sm lead-activity-attach" for="lead-activity-file"><span class="material-icons-outlined" style="font-size:14px">attach_file</span> Attach</label>
                <input type="file" id="lead-activity-file" class="lead-activity-file-input" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" multiple>
                <span class="lead-activity-hint">Images open in a viewer; other files are listed by name.</span>
                <button type="button" class="btn btn-primary btn-sm" id="lead-activity-post"><span class="material-icons-outlined" style="font-size:14px">send</span> Post</button>
              </div>
            </div>
            ${activityLog.length === 0 ? `
              <div class="lead-detail-empty lead-activity-empty">No activity logged yet. Post a note to start the trail.</div>
            ` : `
              <div class="lead-activity-feed">
                ${activityLog.map(entry => `
                  <div class="lead-activity-item${shouldCollapseLeadActivity(entry) ? ' is-collapsed' : ''}" data-activity-id="${escapeHTML(entry.id)}">
                    <div class="lead-activity-avatar" aria-hidden="true">${escapeHTML(leadActivityInitials(entry.author))}</div>
                    <div class="lead-activity-body">
                      <div class="lead-activity-head">
                        <span class="lead-activity-author">${escapeHTML(entry.author)}</span>
                        <span class="lead-activity-sep">•</span>
                        <span class="lead-activity-date">${new Date(entry.date).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <button type="button" class="btn-icon lead-activity-delete" data-activity-delete="${escapeHTML(entry.id)}" title="Delete entry" aria-label="Delete entry"><span class="material-icons-outlined">close</span></button>
                      </div>
                      ${entry.content ? `<div class="lead-activity-content">${escapeHTML(entry.content)}</div>` : ''}
                      ${entry.files.length === 0 ? '' : `
                        <div class="lead-activity-files">
                          ${entry.files.map((f, fi) => isLeadActivityImage(f) ? `
                            <button type="button" class="lead-activity-thumb" data-activity-image="${escapeHTML(entry.id)}" data-file-index="${fi}" title="${escapeHTML(f.name)}" aria-label="View ${escapeHTML(f.name)}"><img src="${f.data}" alt="${escapeHTML(f.name)}"></button>
                          ` : `
                            <span class="lead-activity-file"><span class="material-icons-outlined">description</span><span class="lead-activity-file-name">${escapeHTML(f.name)}</span><span class="lead-activity-file-size">${leadActivityFileSize(f.size)}</span></span>
                          `).join('')}
                        </div>
                      `}
                      ${shouldCollapseLeadActivity(entry) ? `
                        <div class="lead-activity-expand">
                          <button type="button" class="lead-activity-expand-btn" data-activity-expand="${escapeHTML(entry.id)}">
                            <span class="lead-activity-expand-label">Show more</span>
                            <span class="material-icons-outlined">expand_more</span>
                          </button>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      </div>`;

    container.innerHTML = `
      ${renderDetailHeader({
        title: escapeHTML(lead.title),
        icon: 'trending_up',
        iconBgColor: 'var(--color-info-bg)',
        iconTextColor: 'var(--color-info)',
        metaHtml: `
          <span><span class="material-icons-outlined" style="font-size:14px">business</span> ${escapeHTML(lead.customerName || '—')}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${escapeHTML(lead.contactName || '—')}</span>
          <span>${leadOwnerHtml(lead)}</span>
          <span class="badge ${leadStageBadge(lead.status)}">${escapeHTML(lead.status || 'New')}</span>
          ${stale ? `<span class="lead-stale-badge" title="No activity in ${idleDays} days">Stale</span>` : ''}
        `,
        actionsHtml: `
          <button class="btn btn-primary btn-sm" id="btn-convert-quote" data-tooltip="Convert this prospective lead into an active sales proposal quote" data-tooltip-pos="left">
            <span class="material-icons-outlined" style="font-size:14px">request_quote</span> Convert to Quote
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-edit-lead" data-tooltip="Modify lead details, potential value, or assigned representative" data-tooltip-pos="left">
            <span class="material-icons-outlined" style="font-size:14px">edit</span> Edit
          </button>
          <button class="btn btn-danger btn-sm" id="btn-delete-lead" data-tooltip="Permanently delete this lead record" data-tooltip-pos="left">
            <span class="material-icons-outlined" style="font-size:14px">delete</span>
          </button>
        `
      })}

      <!-- Summary strip - same KPI vocabulary as the leads table -->
      <div class="leads-kpi-strip lead-detail-kpis">
        <div class="leads-kpi-card">
          <div class="leads-kpi-label">Est. Value</div>
          <div class="leads-kpi-value">${money(lead.value)}</div>
          <div class="leads-kpi-sub">${lead.budget ? `Client budget ${money(lead.budget)}` : 'No client budget set'}</div>
        </div>
        <div class="leads-kpi-card">
          <div class="leads-kpi-label">Weighted Forecast</div>
          <div class="leads-kpi-value">${money(weightedValue)}</div>
          <div class="leads-kpi-sub">${prob}% likelihood at ${escapeHTML(stage)}</div>
        </div>
        <div class="leads-kpi-card${variance === null ? '' : variance >= 0 ? ' is-good' : ' is-over'}">
          <div class="leads-kpi-label">Budget Variance</div>
          <div class="leads-kpi-value">${variance === null ? '&mdash;' : money(Math.abs(variance))}</div>
          <div class="leads-kpi-sub">${variance === null ? 'No client budget set' : variance >= 0 ? 'Under budget' : 'Over budget'}</div>
        </div>
        <div class="leads-kpi-card${stale ? ' is-stale' : ''}">
          <div class="leads-kpi-label">Days Idle</div>
          <div class="leads-kpi-value${idleDays === 0 ? ' is-zero' : ''}">${idleDays}</div>
          <div class="leads-kpi-sub">${lastActivityLabel ? `Last activity ${lastActivityLabel}` : 'No activity recorded'}</div>
        </div>
      </div>

      <!-- Pipeline stepper - accent ramp shared with the table's stage groups -->
      <div class="pipeline-tracker" role="group" aria-label="Pipeline stage">
        ${LEAD_STAGES.map(s => {
          const isCurrent = stage === s;
          const isPast = stepperIndex > -1 && stepperOrder.indexOf(s) < stepperIndex;
          const state = isCurrent ? 'current' : isPast ? 'past' : 'future';
          return `<button type="button" class="pipeline-step" data-status="${s}" data-state="${state}" style="--step-accent:${LEAD_STAGE_ACCENTS[s] || 'var(--color-primary)'}" aria-pressed="${isCurrent}" title="Move this lead to ${s}">${s}</button>`;
        }).join('')}
      </div>

      <div class="lead-detail-panels">
      <div class="tab-panel" id="lead-tab-overview" data-tab-panel="overview" role="tabpanel"${activeTab === 'overview' ? '' : ' hidden'}>

      <!-- Main grid: primary detail on the left, forecasting + history on the right -->
      <div class="lead-detail-grid">
        <div class="lead-detail-col">
          <div class="card">
            <div class="card-header">
              <h4><span class="material-icons-outlined">description</span> Lead Overview</h4>
            </div>
            <div class="card-body lead-detail-cols">
              <div class="lead-detail-section">
                ${r('Title', escapeHTML(lead.title))}
                ${r('Customer', escapeHTML(lead.customerName))}
                ${r('Contact', escapeHTML(lead.contactName || ''))}
                ${r('Phone', lead.phone ? `<a class="lead-detail-link" href="tel:${escapeHTML(lead.phone)}">${escapeHTML(lead.phone)}</a>` : '&mdash;')}
                ${r('Email', lead.email ? `<a class="lead-detail-link" href="mailto:${escapeHTML(lead.email)}">${escapeHTML(lead.email)}</a>` : '&mdash;')}
                ${r('Lead Source', escapeHTML(lead.source || ''))}
                ${r('Origin', escapeHTML(lead.origin || 'Internal'))}
              </div>
              <div class="lead-detail-section">
                ${r('Status', `<span class="badge ${leadStageBadge(lead.status)}">${escapeHTML(lead.status || 'New')}</span>`)}
                ${r('Priority', `<span class="badge ${LEAD_PRIORITY_BADGES[lead.priority] || 'badge-warning'}">${escapeHTML(lead.priority || 'Medium')}</span>`)}
                ${r('Owner', leadOwnerHtml(lead))}
                ${r('Next Action', leadNextActionHtml(lead, { withStale: false }))}
                ${r('Last Activity', lastActivityLabel ? `${lastActivityLabel} <span class="lead-detail-muted">${idleDays}d ago</span>` : '&mdash;')}
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h4><span class="material-icons-outlined">assignment</span> Scope &amp; Notes</h4>
            </div>
            <div class="card-body lead-detail-cols">
${noteBlock('requirements', 'assignment', 'Technical Requirements', lead.requirements, 'No technical specifications provided.')}
${noteBlock('description', 'sticky_note_2', 'Internal Notes', lead.description, 'No internal notes recorded.')}
            </div>
          </div>
        </div>

        <div class="lead-detail-col">
          <div class="card">
            <div class="card-header">
              <h4><span class="material-icons-outlined">pie_chart</span> Conversion Forecast</h4>
            </div>
            <div class="card-body">
              <div class="lead-forecast">
                <div class="lead-forecast-gauge">
                  <svg width="72" height="72" viewBox="0 0 72 72" style="transform: rotate(-90deg)">
                    <circle cx="36" cy="36" r="29" stroke="var(--border-color)" stroke-width="6" fill="transparent" />
                    <circle cx="36" cy="36" r="29" stroke="${prob >= 80 ? 'var(--color-success)' : prob >= 50 ? 'var(--color-primary)' : 'var(--color-warning)'}" stroke-width="6" fill="transparent" stroke-dasharray="182.2" stroke-dashoffset="${182.2 - (182.2 * prob) / 100}" stroke-linecap="round" />
                  </svg>
                  <div class="lead-forecast-gauge-value">${prob}%</div>
                </div>
                <div class="lead-forecast-figures">
                  <div class="lead-forecast-amount">${money(weightedValue)}</div>
                  <div class="lead-forecast-caption">Weighted on ${money(lead.value)} at ${prob}% win probability</div>
                </div>
              </div>
              <div class="lead-detail-section-title"><span class="material-icons-outlined">percent</span> Stage Likelihood</div>
              <div class="lead-stage-ladder">
                ${LEAD_STAGES.map(s => {
                  const pct = LEAD_LIKELIHOOD[s] ?? 0;
                  return `
                  <div class="lead-stage-ladder-row${s === stage ? ' is-current' : ''}">
                    <span class="lead-stage-dot" style="background:${LEAD_STAGE_ACCENTS[s] || 'var(--color-primary)'}"></span>
                    <span class="lead-stage-ladder-name">${s}</span>
                    <span class="lead-stage-ladder-pct">${pct}%</span>
                    <span class="lead-stage-ladder-amount">${money((lead.value || 0) * (pct / 100))}</span>
                  </div>`;
                }).join('')}
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h4><span class="material-icons-outlined">history</span> Stage History</h4>
            </div>
            <div class="card-body">
              ${leadActivities.length === 0 ? `
                <div class="lead-detail-empty">No stage changes logged yet.</div>
              ` : `
                <div class="lead-timeline">
                  ${leadActivities.map(a => `
                    <div class="lead-timeline-item">
                      <span class="lead-timeline-dot" style="background:${LEAD_STAGE_ACCENTS[a.status] || 'var(--color-primary)'}"></span>
                      <span class="lead-timeline-text">${escapeHTML(a.text || '')}</span>
                      <span class="lead-timeline-date">${new Date(a.timestamp).toLocaleDateString('en-AU', { day:'numeric', month:'short', year:'numeric' })}</span>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
      </div>

      ${activityPanelHtml}
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    container.querySelector('#btn-convert-quote').addEventListener('click', async () => {
      const newQuote = store.create('quotes', {
        number: store.getNextNumber('Q-', 'quotes'),
        customerId: lead.customerId,
        customerName: lead.customerName,
        contactName: lead.contactName,
        title: lead.title,
        status: 'Draft',
        sections: [{ id: store.generateId(), name: 'Main Scope', lineItems: [{ description: `${lead.title} - Scope of Work`, type: 'labor', qty: 1, rate: lead.value || 0, total: lead.value || 0 }] }],
        subtotal: lead.value || 0,
        tax: roundCurrency((lead.value || 0) * store.getTaxRate()),
        total: roundCurrency((lead.value || 0) * (1 + store.getTaxRate())),
        createdAt: new Date().toISOString()
      });

      // Same rule as the pipeline-step handler: never mutate `lead` before the
      // store write, or the rollback target is already the updated object.
      const stageHistory = logLeadStageChange(
        lead,
        lead.status || 'New',
        'Won',
        `Converted to Quote ${newQuote.number} (Status: Won).`
      );

      await store.update('leads', id, { status: 'Won', stageHistory });
      notifyLeadOwner(lead, {
        title: 'Lead converted',
        message: `${lead.title || 'Lead'} was converted to quote ${newQuote.number}.`,
      });
      showToast('Lead converted to quote successfully', 'success');
      router.navigate(`/quotes/${newQuote.id}`);
    });

    container.querySelector('#btn-edit-lead').addEventListener('click', () => router.navigate(`/leads/${id}/edit`));

    container.querySelector('#btn-delete-lead').addEventListener('click', () => {
      const content = document.createElement('div');
      content.innerHTML = `<p>Delete <strong>${escapeHTML(lead.title)}</strong>?</p>`;
      showModal({
        title: 'Delete Lead',
        content,
        actions: [
          { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
          { label: 'Delete', className: 'btn-danger', onClick: (close) => { store.delete('leads', id); showToast('Lead deleted', 'success'); close(); router.navigate('/leads'); }},
        ],
      });
    });

    container.querySelectorAll('.pipeline-step').forEach(step => {
      step.addEventListener('click', async () => {
        const newStatus = step.dataset.status;
        if (LEAD_STAGES.includes(newStatus) && lead.status !== newStatus) {
          const oldStatus = lead.status || 'New';

          // Build the new history locally instead of assigning onto `lead`:
          // store.update captures the live cache object as its rollback target,
          // so pre-mutating it would leave a failed cloud write unrollbackable.
          const stageHistory = logLeadStageChange(lead, oldStatus, newStatus);
          const newEntry = stageHistory[0];

          notifyLeadOwner(lead, {
            title: 'Lead stage updated',
            message: `${lead.title || 'Lead'} moved from ${oldStatus} to ${newStatus}.`,
          });

          // Update store (persists lead object with stageHistory array)
          await store.update('leads', id, { status: newStatus, stageHistory });

          // Log lead stage transition activity to global activity array.
          // Reuses the history id so the activity map de-duplicates the two.
          const activity = store.getAll('activity') || [];
          activity.push({
            id: newEntry.id,
            leadId: id,
            type: 'lead_stage_changed',
            text: newEntry.text,
            user: newEntry.user,
            timestamp: newEntry.timestamp
          });
          store.save('activity', activity);

          showToast(`Status updated to ${newStatus}`, 'success');
          render();
        }
      });
    });

    const activityInput = container.querySelector('#lead-activity-input');
    if (activityInput) {
      activityInput.addEventListener('input', (e) => { composerDraft = e.target.value; });
    }

    const activityFile = container.querySelector('#lead-activity-file');
    if (activityFile) {
      activityFile.addEventListener('change', () => {
        const picked = Array.from(activityFile.files || []);
        if (picked.length === 0) return;
        let pending = picked.length;
        const settle = () => {
          pending -= 1;
          // Re-render once, after the last read settles, so staged chips appear together.
          if (pending === 0) render();
        };
        picked.forEach(file => {
          const reader = new FileReader();
          reader.onload = () => {
            stagedFiles.push({ name: file.name, size: file.size, type: file.type, data: String(reader.result || '') });
            settle();
          };
          reader.onerror = settle;
          reader.readAsDataURL(file);
        });
      });
    }

    container.querySelectorAll('.lead-activity-staged-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        stagedFiles.splice(Number(btn.dataset.idx), 1);
        render();
      });
    });

    const activityPost = container.querySelector('#lead-activity-post');
    if (activityPost) {
      activityPost.addEventListener('click', () => {
        const content = (composerDraft || '').trim();
        if (!content && stagedFiles.length === 0) {
          showToast('Add a note or attach a file first', 'warning');
          return;
        }
        const next = addLeadActivityEntry(lead.activityLog, buildLeadActivityEntry({
          content,
          files: stagedFiles,
          author: currentUserName()
        }));
        stagedFiles = [];
        composerDraft = '';
        store.update('leads', id, { activityLog: next });
        // Keep the contextual submenu's activity badge in step with the feed.
        updateSidebarActive();
        showToast('Activity posted', 'success');
        render();
      });
    }

    container.querySelectorAll('[data-activity-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const next = removeLeadActivityEntry(lead.activityLog, btn.dataset.activityDelete);
        store.update('leads', id, { activityLog: next });
        updateSidebarActive();
        showToast('Activity deleted', 'success');
        render();
      });
    });

    // The clamp is a fixed max-height, so an entry that already fits would show a
    // "Show more" toggle that reveals nothing. Measure the live DOM and drop it.
    container.querySelectorAll('.lead-activity-item.is-collapsed').forEach(item => {
      const boxes = [item.querySelector('.lead-activity-content'), item.querySelector('.lead-activity-files')];
      if (boxes.some(box => box && box.scrollHeight > box.clientHeight + 1)) return;
      item.classList.remove('is-collapsed');
      const toggle = item.querySelector('.lead-activity-expand');
      if (toggle) toggle.hidden = true;
    });

    container.querySelectorAll('[data-activity-expand]').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.lead-activity-item');
        if (!item) return;
        const expanded = item.classList.toggle('is-expanded');
        const label = btn.querySelector('.lead-activity-expand-label');
        if (label) label.textContent = expanded ? 'Show less' : 'Show more';
      });
    });

    container.querySelectorAll('[data-activity-image]').forEach(btn => {
      btn.addEventListener('click', () => {
        const entry = (lead.activityLog || []).find(e => e && e.id === btn.dataset.activityImage);
        const file = entry && Array.isArray(entry.files) ? entry.files[Number(btn.dataset.fileIndex)] : null;
        if (file) showImageLightbox(file.data, file.name);
      });
    });

    container.querySelectorAll('[data-note-edit]').forEach(btn => {
      btn.addEventListener('click', () => toggleNoteEditor(btn.dataset.noteEdit, true));
    });

    container.querySelectorAll('[data-note-cancel]').forEach(btn => {
      btn.addEventListener('click', () => {
        const field = btn.dataset.noteCancel;
        toggleNoteEditor(field, false);
        const input = container.querySelector(`[data-note-input="${field}"]`);
        if (input && NOTE_FIELDS.includes(field)) input.value = lead[field] || '';
      });
    });

    container.querySelectorAll('[data-note-save]').forEach(btn => {
      btn.addEventListener('click', () => {
        const field = btn.dataset.noteSave;
        const input = container.querySelector(`[data-note-input="${field}"]`);
        if (!NOTE_FIELDS.includes(field) || !input) return;
        store.update('leads', id, { [field]: input.value });
        showToast('Note saved', 'success');
        render();
      });
    });
  }

  render();
}
