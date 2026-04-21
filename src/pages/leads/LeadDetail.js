// ============================================
// SIMPRO CLONE — LEAD DETAIL PAGE
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showModal } from '../../components/Modal.js';
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

  const statusBadges = { 'New': 'badge-info', 'Contacted': 'badge-primary', 'Qualified': 'badge-warning', 'Proposal': 'badge-warning', 'Negotiation': 'badge-primary', 'Won': 'badge-success', 'Lost': 'badge-danger' };

  container.innerHTML = `
    ${renderDetailHeader({
      title: lead.title,
      icon: 'trending_up',
      iconBgColor: 'var(--color-info-bg)',
      iconTextColor: 'var(--color-info)',
      metaHtml: `
        <span><span class="material-icons-outlined" style="font-size:14px">business</span> ${lead.customerName}</span>
        <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${lead.contactName}</span>
        <span class="badge ${statusBadges[lead.status] || 'badge-neutral'}">${lead.status}</span>
      `,
      actionsHtml: `
        <button class="btn btn-primary" id="btn-convert-quote">
          <span class="material-icons-outlined">request_quote</span> Convert to Quote
        </button>
        <button class="btn btn-secondary" id="btn-edit-lead">
          <span class="material-icons-outlined">edit</span> Edit
        </button>
        <button class="btn btn-danger" id="btn-delete-lead">
          <span class="material-icons-outlined">delete</span>
        </button>
      `
    })}

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h4>Lead Information</h4></div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:12px">
            ${row('Title', lead.title)}
            ${row('Customer', lead.customerName)}
            ${row('Contact', lead.contactName)}
            ${row('Source', lead.source)}
            ${row('Priority', lead.priority)}
            ${row('Status', lead.status)}
            ${row('Estimated Value', '$' + (lead.value || 0).toLocaleString())}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h4>Description & Notes</h4></div>
        <div class="card-body">
          <p style="color:var(--text-secondary);line-height:1.6">${lead.description || 'No description provided.'}</p>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#btn-convert-quote').addEventListener('click', () => {
    const newQuote = store.create('quotes', {
      number: `Q-${Date.now().toString().slice(-7)}`,
      customerId: lead.customerId,
      customerName: lead.customerName,
      contactName: lead.contactName,
      title: lead.title,
      status: 'Draft',
      lineItems: [],
      subtotal: 0, tax: 0, total: 0,
    });
    store.update('leads', id, { status: 'Won' });
    showToast('Lead converted to quote successfully', 'success');
    router.navigate(`/quotes/${newQuote.id}`);
  });

  container.querySelector('#btn-edit-lead').addEventListener('click', () => router.navigate(`/leads/${id}/edit`));

  container.querySelector('#btn-delete-lead').addEventListener('click', () => {
    showModal({
      title: 'Delete Lead',
      content: `<p>Delete <strong>${lead.title}</strong>?</p>`,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
        { label: 'Delete', className: 'btn-danger', onClick: (close) => { store.delete('leads', id); showToast('Lead deleted', 'success'); close(); router.navigate('/leads'); }},
      ],
    });
  });
}

function row(label, value) {
  return `<div style="display:flex;gap:8px"><span style="width:130px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${label}</span><span>${value}</span></div>`;
}
