// ============================================
// SIMPRO CLONE — LEAD DETAIL PAGE (High Density)
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showModal } from '../../components/Modal.js';
import { escapeHTML } from '../../utils/security.js';
import { showToast } from '../../components/Notifications.js';
import { updateBreadcrumbDetail } from '../../components/Breadcrumb.js';
import { renderDetailHeader } from '../../components/DetailHeader.js';

export function renderLeadDetail(container, { id }) {
  const lead = store.getById('leads', id);
  if (!lead) {
    container.innerHTML = '<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Lead not found</h3></div>';
    return;
  }

  updateBreadcrumbDetail(lead.title);

  const statusBadges = { 
    'New': 'badge-info', 'Contacted': 'badge-neutral', 'Qualified': 'badge-warning', 
    'Proposal': 'badge-primary', 'Negotiation': 'badge-purple', 'Won': 'badge-success', 'Lost': 'badge-danger' 
  };

  const likelihoods = {
    'New': 10,
    'Contacted': 30,
    'Qualified': 50,
    'Proposal': 70,
    'Negotiation': 85,
    'Won': 100,
    'Lost': 0
  };
  const prob = likelihoods[lead.status] ?? 0;
  const weightedValue = (lead.value || 0) * (prob / 100);

  function r(label, value) {
    return `
      <div style="display:flex; align-items:baseline; padding: 4px 0; border-bottom: 1px dashed var(--border-color); font-size: 12px;">
        <span style="width:110px; min-width:110px; flex-shrink:0; font-size:11px; color:var(--text-tertiary); font-weight:500;">${label}</span>
        <span style="color:var(--text-primary); font-weight:600; overflow-wrap:anywhere;">${value || '—'}</span>
      </div>`;
  }

  function render() {
    const allActivities = store.getAll('activity') || [];
    const leadActivities = allActivities.filter(a => a.leadId === id || a.entityId === id).reverse();

    container.innerHTML = `
      ${renderDetailHeader({
        title: escapeHTML(lead.title),
        icon: 'trending_up',
        iconBgColor: 'var(--color-info-bg)',
        iconTextColor: 'var(--color-info)',
        metaHtml: `
          <span><span class="material-icons-outlined" style="font-size:14px">business</span> ${escapeHTML(lead.customerName)}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${escapeHTML(lead.contactName || '—')}</span>
          <span class="badge ${statusBadges[lead.status] || 'badge-neutral'}">${escapeHTML(lead.status || 'New')}</span>
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

      <!-- Slim Pipeline Tracker -->
      <div class="pipeline-tracker" style="display:flex; border-radius:6px; overflow:hidden; background:var(--content-bg); border:1px solid var(--border-color); margin-bottom:12px; box-shadow:var(--shadow-sm); height:28px;">
        ${['New','Contacted','Qualified','Proposal','Negotiation','Won','Lost'].map((s, idx) => {
          const isActive = lead.status === s;
          const isPast = ['New','Contacted','Qualified','Proposal','Negotiation','Won','Lost'].indexOf(lead.status) >= idx;
          let bg = 'transparent';
          let color = 'var(--text-secondary)';
          let borderRight = idx === 6 ? 'none' : '1px solid var(--border-color)';
          
          if (isActive) {
            if (s === 'Won') { bg = 'var(--color-success)'; color = '#fff'; }
            else if (s === 'Lost') { bg = 'var(--color-danger)'; color = '#fff'; }
            else if (s === 'Qualified' || s === 'Proposal') { bg = 'var(--color-warning)'; color = 'var(--color-warning-dark)'; }
            else { bg = 'var(--color-primary)'; color = '#fff'; }
          } else if (isPast && lead.status !== 'Lost' && s !== 'Lost') {
            bg = 'rgba(27, 109, 224, 0.05)';
            color = 'var(--color-primary-dark)';
          }
          
          return `
            <div class="pipeline-step" data-status="${s}" style="flex:1; display:flex; align-items:center; justify-content:center; padding:0 4px; font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:0.4px; background:${bg}; color:${color}; border-right:${borderRight}; cursor:pointer; transition:all 0.15s;" title="Click to transition to ${s}">
              ${s}
            </div>
          `;
        }).join('')}
      </div>

      <!-- Main High-Density Grid (2 columns: 2fr 1fr) -->
      <div style="display:grid; grid-template-columns: 2fr 1fr; gap: 12px; align-items: start;">
        
        <!-- Left Column: Primary Details & Requirements -->
        <div style="display:flex; flex-direction:column; gap:12px;">
          
          <!-- Lead Overview & Financial Scope Card -->
          <div class="card" style="margin:0;">
            <div class="card-header" style="padding: 8px 12px;">
              <h4 style="font-size:12px; margin:0; display:flex; align-items:center; gap:6px;">
                <span class="material-icons-outlined" style="font-size:16px; color:var(--color-primary);">description</span> Lead Overview & Financial Scope
              </h4>
            </div>
            <div class="card-body" style="padding:12px;">
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 0 16px;">
                <div>
                  ${r('Title', escapeHTML(lead.title))}
                  ${r('Customer', escapeHTML(lead.customerName))}
                  ${r('Contact Name', escapeHTML(lead.contactName || '—'))}
                  ${r('Lead Source', escapeHTML(lead.source || '—'))}
                  ${r('Priority', `<span class="badge ${lead.priority === 'High' ? 'badge-danger' : lead.priority === 'Low' ? 'badge-neutral' : 'badge-warning'}">${escapeHTML(lead.priority || 'Medium')}</span>`)}
                  ${r('Status', `<span class="badge ${statusBadges[lead.status] || 'badge-neutral'}">${escapeHTML(lead.status)}</span>`)}
                </div>
                <div>
                  ${r('Direct Phone', lead.phone ? `<a href="tel:${escapeHTML(lead.phone)}" style="color:var(--color-primary); font-weight:600;">${escapeHTML(lead.phone)}</a>` : '—')}
                  ${r('Direct Email', lead.email ? `<a href="mailto:${escapeHTML(lead.email)}" style="color:var(--color-primary); font-weight:600;">${escapeHTML(lead.email)}</a>` : '—')}
                  ${r('Client Budget', lead.budget ? `<strong style="color:var(--text-primary)">$${(lead.budget || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>` : '—')}
                  ${r('Est. Value', `<strong style="color:var(--color-primary-dark)">$${(lead.value || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>`)}
                  ${lead.budget && lead.value ? r('Budget Variance', `<span style="font-weight:700; color:${(lead.budget - lead.value) >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">$${Math.abs(lead.budget - lead.value).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${(lead.budget - lead.value) >= 0 ? 'Under' : 'Over'})</span>`) : ''}
                  ${r('Weighted Value', `<strong style="color:${prob >= 80 ? 'var(--color-success)' : 'var(--text-primary)'}">$${weightedValue.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>`)}
                </div>
              </div>
            </div>
          </div>

          <!-- Requirements & Internal Notes Card (2 Column Split) -->
          <div class="card" style="margin:0;">
            <div class="card-body" style="padding:12px; display:grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; margin-bottom:6px; display:flex; align-items:center; gap:4px;">
                  <span class="material-icons-outlined" style="font-size:14px">assignment</span> Technical Requirements
                </div>
                <p style="color:var(--text-primary); line-height:1.4; font-size:12px; white-space:pre-wrap; margin:0; background:var(--content-bg); padding:8px 10px; border-radius:4px; border:1px solid var(--border-color); min-height:60px;">${escapeHTML(lead.requirements || 'No technical specifications provided.')}</p>
              </div>
              <div>
                <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; margin-bottom:6px; display:flex; align-items:center; gap:4px;">
                  <span class="material-icons-outlined" style="font-size:14px">sticky_note_2</span> Internal Notes
                </div>
                <p style="color:var(--text-secondary); line-height:1.4; font-size:12px; white-space:pre-wrap; margin:0; background:var(--content-bg); padding:8px 10px; border-radius:4px; border:1px solid var(--border-color); min-height:60px;">${escapeHTML(lead.description || 'No internal notes recorded.')}</p>
              </div>
            </div>
          </div>

        </div>

        <!-- Right Column: Conversion Gauge & Stage Activity -->
        <div style="display:flex; flex-direction:column; gap:12px;">
          
          <!-- Conversion Forecast Gauge Card -->
          <div class="card" style="margin:0;">
            <div class="card-header" style="padding: 8px 12px;">
              <h4 style="font-size:12px; margin:0; display:flex; align-items:center; gap:6px;">
                <span class="material-icons-outlined" style="font-size:16px; color:var(--color-primary);">pie_chart</span> Conversion Forecast
              </h4>
            </div>
            <div class="card-body" style="padding:12px; display:flex; align-items:center; gap:16px;">
              <div style="position:relative; width:64px; height:64px; flex-shrink:0; display:flex; align-items:center; justify-content:center">
                <svg width="64" height="64" viewBox="0 0 64 64" style="transform: rotate(-90deg)">
                  <circle cx="32" cy="32" r="26" stroke="var(--border-color)" stroke-width="6" fill="transparent" />
                  <circle cx="32" cy="32" r="26" stroke="${prob >= 80 ? 'var(--color-success)' : prob >= 50 ? 'var(--color-primary)' : 'var(--color-warning)'}" stroke-width="6" fill="transparent" 
                           stroke-dasharray="163.3" stroke-dashoffset="${163.3 - (163.3 * prob) / 100}" stroke-linecap="round" />
                </svg>
                <div style="position:absolute; font-size:14px; font-weight:800; color:var(--text-primary)">${prob}%</div>
              </div>
              <div style="flex:1;">
                <div style="font-size:10px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase;">Weighted Forecast</div>
                <div style="font-size:18px; font-weight:800; color:${prob >= 80 ? 'var(--color-success)' : 'var(--text-primary)'}; margin-top:2px">$${weightedValue.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div style="font-size:10px; color:var(--text-secondary); margin-top:1px">${prob}% win probability applied</div>
              </div>
            </div>
          </div>

          <!-- Activity History Card -->
          <div class="card" style="margin:0;">
            <div class="card-header" style="padding: 8px 12px;">
              <h4 style="font-size:12px; margin:0; display:flex; align-items:center; gap:6px;">
                <span class="material-icons-outlined" style="font-size:16px; color:var(--color-primary);">history</span> Stage History
              </h4>
            </div>
            <div class="card-body" style="padding:8px 12px; max-height:200px; overflow-y:auto;">
              ${leadActivities.length === 0 ? `
                <div style="font-size:11px; color:var(--text-tertiary); padding:8px 0; text-align:center;">No recent stage changes logged.</div>
              ` : `
                <div style="display:flex; flex-direction:column; gap:6px;">
                  ${leadActivities.map(a => `
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; padding:4px 0; border-bottom:1px dashed var(--border-color);">
                      <div style="display:flex; align-items:center; gap:4px;">
                        <span class="material-icons-outlined" style="font-size:12px; color:var(--color-primary);">swap_horiz</span>
                        <span style="color:var(--text-primary); font-weight:500;">${escapeHTML(a.text || '')}</span>
                      </div>
                      <span style="color:var(--text-tertiary); font-size:10px; flex-shrink:0;">${new Date(a.timestamp).toLocaleDateString('en-AU', { month:'short', day:'numeric' })}</span>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>

        </div>

      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    container.querySelector('#btn-convert-quote').addEventListener('click', () => {
      const newQuote = store.create('quotes', {
        number: store.getNextNumber('Q-', 'quotes'),
        customerId: lead.customerId,
        customerName: lead.customerName,
        contactName: lead.contactName,
        title: lead.title,
        status: 'Draft',
        sections: [{ id: store.generateId(), name: 'Main Scope', lineItems: [{ description: `${lead.title} - Scope of Work`, type: 'labor', qty: 1, rate: lead.value || 0, total: lead.value || 0 }] }],
        subtotal: lead.value || 0,
        tax: (lead.value || 0) * store.getTaxRate(),
        total: (lead.value || 0) * (1 + store.getTaxRate()),
        createdAt: new Date().toISOString()
      });
      store.update('leads', id, { status: 'Won' });
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
      step.addEventListener('click', () => {
        const newStatus = step.dataset.status;
        if (lead.status !== newStatus) {
          store.update('leads', id, { status: newStatus });
          lead.status = newStatus;
          showToast(`Status updated to ${newStatus}`, 'success');
          render();

          // Log lead stage transition activity
          const activity = store.getAll('activity') || [];
          activity.push({
            id: Date.now(),
            leadId: id,
            type: 'lead_stage_changed',
            text: `Lead stage transitioned to "${newStatus}".`,
            user: JSON.parse(localStorage.getItem('currentUser'))?.name || 'System',
            timestamp: new Date().toISOString()
          });
          store.save('activity', activity);
        }
      });
    });
  }

  render();
}
