// ============================================
// SIMPRO CLONE — LEAD DETAIL PAGE
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

  function render() {
    container.innerHTML = `
      ${renderDetailHeader({
        title: lead.title,
        icon: 'trending_up',
        iconBgColor: 'var(--color-info-bg)',
        iconTextColor: 'var(--color-info)',
        metaHtml: `
          <span><span class="material-icons-outlined" style="font-size:14px">business</span> ${escapeHTML(lead.customerName)}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${escapeHTML(lead.contactName || '—')}</span>
          <span class="badge ${statusBadges[lead.status] || 'badge-neutral'}">${lead.status}</span>
        `,
        actionsHtml: `
          <button class="btn btn-primary" id="btn-convert-quote" data-tooltip="Convert this prospective lead into an active sales proposal quote" data-tooltip-pos="left">
            <span class="material-icons-outlined">request_quote</span> Convert to Quote
          </button>
          <button class="btn btn-secondary" id="btn-edit-lead" data-tooltip="Modify lead details, potential value, or assigned representative" data-tooltip-pos="left">
            <span class="material-icons-outlined">edit</span> Edit
          </button>
          <button class="btn btn-danger" id="btn-delete-lead" data-tooltip="Permanently delete this lead record" data-tooltip-pos="left">
            <span class="material-icons-outlined">delete</span>
          </button>
        `
      })}

      <!-- Interactive Stage Tracker -->
      <div class="pipeline-tracker" style="display:flex; border-radius:8px; overflow:hidden; background:var(--content-bg); border:1px solid var(--border-color); margin-bottom:24px; box-shadow:var(--shadow-sm)">
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
            <div class="pipeline-step" data-status="${s}" style="flex:1; text-align:center; padding:14px 6px; font-weight:700; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; background:${bg}; color:${color}; border-right:${borderRight}; cursor:pointer; transition:all 0.2s" title="Click to transition to ${s}">
              ${s}
            </div>
          `;
        }).join('')}
      </div>      <div class="grid-3" style="align-items:stretch">
        
        <!-- Column 1: Lead Information & Contact -->
        <div style="grid-column: span 1; display:flex; flex-direction:column; gap:24px">
          <div class="card" style="margin:0; height:100%">
            <div class="card-header"><h4>Lead Qualification</h4></div>
            <div class="card-body" style="display:flex; flex-direction:column; gap:16px">
              ${row('Title', lead.title)}
              ${row('Customer', lead.customerName)}
              ${row('Contact Name', lead.contactName || '—')}
              ${row('Lead Source', lead.source || '—')}
              ${row('Priority', lead.priority || 'Medium')}
              ${row('Current Status', `<span class="badge ${statusBadges[lead.status] || 'badge-neutral'}">${lead.status}</span>`)}
            </div>
          </div>
        </div>

        <!-- Column 2: Technical Scope & Financials -->
        <div style="grid-column: span 1; display:flex; flex-direction:column; gap:24px">
          <div class="card" style="margin:0; height:100%">
            <div class="card-header"><h4>Financial Scope & Contact</h4></div>
            <div class="card-body" style="display:flex; flex-direction:column; gap:16px">
              ${row('Direct Phone', lead.phone ? `<a href="tel:${lead.phone}" style="color:var(--color-primary); font-weight:600; text-decoration:underline">${escapeHTML(lead.phone)}</a>` : '—')}
              ${row('Direct Email', lead.email ? `<a href="mailto:${lead.email}" style="color:var(--color-primary); font-weight:600; text-decoration:underline">${escapeHTML(lead.email)}</a>` : '—')}
              <hr style="border:none; border-top:1px dashed var(--border-color); margin:4px 0" />
              ${row('Client Budget', lead.budget ? `<strong style="color:var(--text-primary)">$${(lead.budget || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>` : '—')}
              ${row('Estimated Value', `<strong style="color:var(--color-primary-dark)">$${(lead.value || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>`)}
              ${lead.budget && lead.value ? row('Budget Variance', `<span style="font-weight:700; color:${(lead.budget - lead.value) >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">$${(lead.budget - lead.value).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${(lead.budget - lead.value) >= 0 ? 'Under' : 'Over'} Budget)</span>`) : ''}
            </div>
          </div>
        </div>

        <!-- Column 3: Sales Forecasting Gauge -->
        <div style="grid-column: span 1; display:flex; flex-direction:column; gap:24px">
          <div class="card" style="margin:0; height:100%; border: 1px solid var(--border-color)">
            <div class="card-header"><h4>Conversion Forecast</h4></div>
            <div class="card-body" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px; text-align:center">
              <div style="position:relative; width:100px; height:100px; display:flex; align-items:center; justify-content:center">
                <!-- SVG Circle representation -->
                <svg width="100" height="100" viewBox="0 0 100 100" style="transform: rotate(-90deg)">
                  <circle cx="50" cy="50" r="40" stroke="var(--border-color)" stroke-width="8" fill="transparent" />
                  <circle cx="50" cy="50" r="40" stroke="${prob >= 80 ? 'var(--color-success)' : prob >= 50 ? 'var(--color-primary)' : 'var(--color-warning)'}" stroke-width="8" fill="transparent" 
                           stroke-dasharray="251.2" stroke-dashoffset="${251.2 - (251.2 * prob) / 100}" stroke-linecap="round" />
                </svg>
                <div style="position:absolute; font-size:20px; font-weight:800; color:var(--text-primary)">${prob}%</div>
              </div>
              <div>
                <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px">Weighted Value Forecast</div>
                <div style="font-size:24px; font-weight:800; color:${prob >= 80 ? 'var(--color-success)' : 'var(--text-primary)'}; margin-top:4px">$${weightedValue.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div style="font-size:11px; color:var(--text-secondary); margin-top:2px">Likelihood multiplier applied</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:24px">
        <div class="card-header"><h4>Technical / Project Requirements</h4></div>
        <div class="card-body">
          <p style="color:var(--text-primary); line-height:1.6; font-size:14px; white-space:pre-wrap">${escapeHTML(lead.requirements || 'No technical specifications or requirements provided.')}</p>
        </div>
      </div>

      <div class="card" style="margin-top:24px">
        <div class="card-header"><h4>Internal Notes</h4></div>
        <div class="card-body">
          <p style="color:var(--text-secondary); line-height:1.6; font-size:14px; white-space:pre-wrap">${escapeHTML(lead.description || 'No internal notes recorded.')}</p>
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    container.querySelector('#btn-convert-quote').addEventListener('click', () => {
      const newQuote = store.create('quotes', {
        number: `Q-${Date.now().toString().slice(-7)}`,
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

function row(label, value) {
  return `<div style="display:flex;gap:8px"><span style="width:130px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${label}</span><span>${value}</span></div>`;
}
