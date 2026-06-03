// ============================================
// SIMPRO CLONE — PERSON DETAIL PAGE
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showModal } from '../../components/Modal.js';
import { escapeHTML } from '../../utils/security.js';
import { showToast } from '../../components/Notifications.js';
import { updateBreadcrumbDetail } from '../../components/Breadcrumb.js';
import { renderDetailHeader } from '../../components/DetailHeader.js';
import { showDrawer } from '../../components/Drawer.js';
import { showAssetQuickAdd } from '../../utils/quickModals.js';

export function renderPersonDetail(container, { id }) {
  const person = store.getById('customers', id);
  if (!person) {
    container.innerHTML = '<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Customer not found</h3></div>';
    return;
  }

  // Self-healing customer portalToken generator
  if (!person.portalToken) {
    const generatedToken = 'c_pt_' + Math.random().toString(36).substr(2, 9);
    store.update('customers', person.id, { portalToken: generatedToken });
    person.portalToken = generatedToken;
  }

  updateBreadcrumbDetail(person.company);

  const jobs = store.getAll('jobs').filter(j => j.customerId === id);
  const quotes = store.getAll('quotes').filter(q => q.customerId === id);
  const invoices = store.getAll('invoices').filter(i => i.customerId === id);

  let activeTab = 'details';

  function render() {
    container.innerHTML = `
      ${renderDetailHeader({
        title: escapeHTML(person.company),
        icon: person.type === 'Company' ? 'business' : 'person',
        iconBgColor: 'var(--color-primary-light)',
        iconTextColor: 'var(--color-primary)',
        metaHtml: `
          <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${escapeHTML(person.firstName)} ${escapeHTML(person.lastName)}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">email</span> ${escapeHTML(person.email)}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">phone</span> ${escapeHTML(person.phone)}</span>
          <span class="badge ${person.status === 'Active' ? 'badge-success' : 'badge-neutral'}">${escapeHTML(person.status)}</span>
        `,
        actionsHtml: `
          <button class="btn btn-secondary" id="btn-edit-person" data-tooltip="Modify customer details, contacts, or active site addresses" data-tooltip-pos="left">
            <span class="material-icons-outlined">edit</span> Edit
          </button>
          <button class="btn btn-danger" id="btn-delete-person" data-tooltip="Permanently delete this customer and all associated history" data-tooltip-pos="left">
            <span class="material-icons-outlined">delete</span> Delete
          </button>
        `
      })}

      <div class="tabs" id="person-tabs">
        <button class="tab ${activeTab === 'details' ? 'active' : ''}" data-tab="details">Details</button>
        <button class="tab ${activeTab === 'contacts' ? 'active' : ''}" data-tab="contacts">Contacts (${(person.contacts || []).length})</button>
        <button class="tab ${activeTab === 'sites' ? 'active' : ''}" data-tab="sites">Sites (${(person.sites || []).length})</button>
        <button class="tab ${activeTab === 'assets' ? 'active' : ''}" data-tab="assets">Assets (${store.getAll('assets').filter(a => a.ownerType === 'Customer' && a.customerId === id).length})</button>
        <button class="tab ${activeTab === 'jobs' ? 'active' : ''}" data-tab="jobs">Jobs (${jobs.length})</button>
        <button class="tab ${activeTab === 'quotes' ? 'active' : ''}" data-tab="quotes">Quotes (${quotes.length})</button>
        <button class="tab ${activeTab === 'invoices' ? 'active' : ''}" data-tab="invoices">Invoices (${invoices.length})</button>
      </div>

      <div class="tab-content" id="tab-content"></div>
    `;

    renderTabContent();

    // Tab switching
    container.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeTab = tab.dataset.tab;
        container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderTabContent();
      });
    });

    // Edit
    container.querySelector('#btn-edit-person').addEventListener('click', () => {
      router.navigate(`/people/${id}/edit`);
    });

    // Delete
    container.querySelector('#btn-delete-person').addEventListener('click', () => {
      const content = document.createElement('div');
      content.innerHTML = `<p>Are you sure you want to delete <strong>${escapeHTML(person.company)}</strong>? This action cannot be undone.</p>`;
      showModal({
        title: 'Delete Customer',
        content,
        actions: [
          { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
          { label: 'Delete', className: 'btn-danger', onClick: (close) => {
            store.delete('customers', id);
            showToast('Customer deleted successfully', 'success');
            close();
            router.navigate('/people');
          }},
        ],
      });
    });
  }

  function renderTabContent() {
    const tabContent = container.querySelector('#tab-content');

    if (activeTab === 'details') {
      tabContent.innerHTML = `
        <div class="card">
          <div class="card-body">
            <div class="grid-3">
              <div style="grid-column: span 2">
                <h4 style="margin-bottom:var(--space-base)">Contact Information</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${detailRow('Company', person.company)}
                  ${detailRow('Contact', `${person.firstName} ${person.lastName}`)}
                  ${detailRow('Email', person.email)}
                  ${detailRow('Phone', person.phone)}
                  ${detailRow('Type', person.type)}
                  ${detailRow('Status', person.status)}
                </div>
              </div>
              <div style="grid-column: span 1">
                <h4 style="margin-bottom:var(--space-base)">Address</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${detailRow('Address', person.address || 'Not set')}
                </div>
                <h4 style="margin-top:var(--space-xl);margin-bottom:var(--space-base)">History</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${detailRow('Created', new Date(person.createdAt).toLocaleDateString())}
                  ${detailRow('Last Updated', new Date(person.updatedAt).toLocaleDateString())}
                  ${detailRow('Total Jobs', jobs.length)}
                  ${detailRow('Total Quotes', quotes.length)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card" style="margin-top:20px;">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0; display:flex; align-items:center; gap:8px;">
              <span class="material-icons-outlined text-primary" style="vertical-align:middle;">vpn_key</span>
              Customer Portal Access
            </h4>             <span style="font-size:12px; color:var(--text-secondary); display:inline-flex; align-items:center; gap:8px;">
              Last Accessed: ${person.portalLastAccessed ? new Date(person.portalLastAccessed).toLocaleString('en-AU') : 'Never'}
              <span style="padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; 
                           background: ${person.portalPasscode ? '#ecfdf5' : '#f1f5f9'}; 
                           color: ${person.portalPasscode ? '#10b981' : '#475569'}; border: 1px solid ${person.portalPasscode ? '#a7f3d0' : '#e2e8f0'};">
                ${person.portalPasscode ? 'PIN Secured' : 'PIN Not Configured'}
              </span>
            </span>
          </div>
          <div class="card-body">
            <p style="font-size:13px; color:var(--text-secondary); margin-bottom:16px; line-height:1.5;">
              Provide this secure token-based magic link to the customer. They can use it to view their open jobs, approve quotes, review invoices, check asset maintenance schedules, and submit callout requests directly from their own portal dashboard — no username or password required.
            </p>
            <div style="display:flex; gap:12px; align-items:center;">
              <input type="text" readonly id="customer-portal-url" class="form-input" 
                     style="flex:1; font-family:monospace; background: var(--content-bg); font-size:13px; color:var(--text-secondary);" 
                     value="${window.location.origin}${window.location.pathname}#/portal/customer?token=${person.portalToken}" />
              
              <button class="btn btn-secondary" id="btn-copy-portal-link" style="display:flex; align-items:center; gap:6px; white-space:nowrap;">
                <span class="material-icons-outlined" style="font-size:16px;">content_copy</span> Copy Link
              </button>
              
              <button class="btn btn-secondary" id="btn-send-portal-link" style="display:flex; align-items:center; gap:6px; white-space:nowrap;">
                <span class="material-icons-outlined" style="font-size:16px;">send</span> Send Link
              </button>

              ${person.portalPasscode ? `
                <button class="btn btn-secondary text-danger" id="btn-reset-portal-pin" style="display:flex; align-items:center; gap:6px; white-space:nowrap; border-color:#fee2e2;">
                  <span class="material-icons-outlined" style="font-size:16px;">lock_reset</span> Reset PIN
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;

      // Bind portal access events
      const copyBtn = tabContent.querySelector('#btn-copy-portal-link');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          const urlInput = tabContent.querySelector('#customer-portal-url');
          if (urlInput) {
            urlInput.select();
            urlInput.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(urlInput.value);
            showToast('Portal link copied to clipboard', 'success');
          }
        });
      }

      const sendBtn = tabContent.querySelector('#btn-send-portal-link');
      if (sendBtn) {
        sendBtn.addEventListener('click', () => {
          const content = document.createElement('div');
          content.innerHTML = `<p>Simulated dispatching secure portal link via email to <strong>${escapeHTML(person.email)}</strong>.</p>`;
          showModal({
            title: 'Send Portal Link',
            content,
            actions: [
              { label: 'Dismiss', className: 'btn-primary', onClick: (close) => close() }
            ]
          });
          
          store.create('notifications', {
            title: 'Portal Link Dispatched',
            message: `Portal access link sent to ${person.company} (${person.email})`,
            link: `/people/${person.id}`,
            read: true,
            createdAt: new Date().toISOString(),
            status: 'Converted'
          });
        });
      }

      const resetPinBtn = tabContent.querySelector('#btn-reset-portal-pin');
      if (resetPinBtn) {
        resetPinBtn.addEventListener('click', () => {
          import('../../components/Modal.js').then(({ showModal }) => {
            const content = document.createElement('div');
            content.innerHTML = `<p>Are you sure you want to reset the security PIN for <strong>${escapeHTML(person.company)}</strong>? This will allow the customer to configure a brand new PIN on their next visit.</p>`;
            
            showModal({
              title: 'Reset Customer Portal PIN',
              content,
              actions: [
                { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
                { label: 'Reset PIN', className: 'btn-danger', onClick: (close) => {
                  const custs = store.getAll('customers');
                  const idx = custs.findIndex(c => c.id === person.id);
                  if (idx !== -1) {
                    custs[idx].portalPasscode = null;
                    store.save('customers', custs);
                    person.portalPasscode = null;
                  }
                  showToast('Security PIN has been reset successfully', 'success');
                  close();
                  renderPersonDetail(container, person.id);
                }}
              ]
            });
          });
        });
      }
    } else if (activeTab === 'contacts') {
      const contacts = person.contacts || [];
      tabContent.innerHTML = `
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Contacts (${contacts.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-contact"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Contact</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${contacts.map((c, i) => `
                  <tr>
                    <td class="font-medium">${escapeHTML(c.name)}</td>
                    <td>${escapeHTML(c.role || '—')}</td>
                    <td><a href="mailto:${escapeHTML(c.email)}" class="cell-link">${escapeHTML(c.email)}</a></td>
                    <td><a href="tel:${escapeHTML(c.phone)}" class="cell-link">${escapeHTML(c.phone)}</a></td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-contact" data-index="${i}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join('')}
                ${!contacts.length ? '<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No additional contacts</td></tr>' : ''}
              </tbody>
            </table>
          </div>
        </div>
      `;

      tabContent.querySelector('#btn-toggle-contact').addEventListener('click', () => {
        const content = document.createElement('div');
        content.innerHTML = `
          <div class="form-row">
            <div class="form-group"><label class="form-label">Name *</label><input type="text" id="new-c-name" class="form-input"></div>
            <div class="form-group"><label class="form-label">Role</label><input type="text" id="new-c-role" class="form-input"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Email</label><input type="email" id="new-c-email" class="form-input"></div>
            <div class="form-group"><label class="form-label">Phone</label><input type="text" id="new-c-phone" class="form-input"></div>
          </div>
        `;
        showDrawer({
          title: 'Add Contact',
          content: content.outerHTML,
          actions: [
            { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
            { label: 'Save', className: 'btn-primary', onClick: (close) => {
              const dOverlay = document.querySelector('.drawer-overlay');
              const name = dOverlay.querySelector('#new-c-name').value.trim();
              if (!name) return showToast('Name is required', 'error');
              if (!person.contacts) person.contacts = [];
              person.contacts.push({
                name, role: dOverlay.querySelector('#new-c-role').value,
                email: dOverlay.querySelector('#new-c-email').value,
                phone: dOverlay.querySelector('#new-c-phone').value
              });
              store.update('customers', id, { contacts: person.contacts });
              showToast('Contact added', 'success');
              renderTabContent();
              render(); // update tab count
              close();
            }}
          ]
        });
      });
      tabContent.querySelectorAll('.btn-delete-contact').forEach(btn => {
        btn.addEventListener('click', () => {
          person.contacts.splice(btn.dataset.index, 1);
          store.update('customers', id, { contacts: person.contacts });
          showToast('Contact deleted', 'success');
          renderTabContent();
          render();
        });
      });

    } else if (activeTab === 'sites') {
      const sites = person.sites || [];
      tabContent.innerHTML = `
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Sites (${sites.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-site"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Site</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Site Name</th><th>Address</th><th>Notes</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${sites.map((s, i) => `
                  <tr>
                    <td class="font-medium">${escapeHTML(s.name)}</td>
                    <td>${escapeHTML(s.address)}</td>
                    <td class="text-secondary">${escapeHTML(s.notes || '—')}</td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-site" data-index="${i}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join('')}
                ${!sites.length ? '<tr><td colspan="4" style="text-align:center;padding:20px" class="text-secondary">No sites added</td></tr>' : ''}
              </tbody>
            </table>
          </div>
        </div>
      `;

      tabContent.querySelector('#btn-toggle-site').addEventListener('click', () => {
        const content = document.createElement('div');
        content.innerHTML = `
          <div class="form-row">
            <div class="form-group"><label class="form-label">Site Name *</label><input type="text" id="new-s-name" class="form-input" placeholder="e.g. Headquarters"></div>
            <div class="form-group"><label class="form-label">Address *</label><input type="text" id="new-s-address" class="form-input"></div>
          </div>
          <div class="form-group"><label class="form-label">Notes</label><input type="text" id="new-s-notes" class="form-input"></div>
        `;
        showDrawer({
          title: 'Add Site',
          content: content.outerHTML,
          actions: [
            { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
            { label: 'Save', className: 'btn-primary', onClick: (close) => {
              const dOverlay = document.querySelector('.drawer-overlay');
              const name = dOverlay.querySelector('#new-s-name').value.trim();
              const address = dOverlay.querySelector('#new-s-address').value.trim();
              if (!name || !address) return showToast('Name and Address are required', 'error');
              if (!person.sites) person.sites = [];
              person.sites.push({ name, address, notes: dOverlay.querySelector('#new-s-notes').value });
              store.update('customers', id, { sites: person.sites });
              showToast('Site added', 'success');
              renderTabContent();
              render(); // update tab count
              close();
            }}
          ]
        });
      });
      tabContent.querySelectorAll('.btn-delete-site').forEach(btn => {
        btn.addEventListener('click', () => {
          person.sites.splice(btn.dataset.index, 1);
          store.update('customers', id, { sites: person.sites });
          showToast('Site deleted', 'success');
          renderTabContent();
          render();
        });
      });

    } else if (activeTab === 'assets') {
      // Migrate legacy person.assets to global store
      if (person.assets && person.assets.length > 0) {
        person.assets.forEach(a => {
          store.create('assets', {
             name: a.name,
             serial: a.serial,
             site: a.site,
             installDate: a.installDate,
             ownerType: 'Customer',
             customerId: id,
             status: 'Active',
             type: 'Equipment'
          });
        });
        person.assets = [];
        store.update('customers', id, { assets: [] });
      }

      const assets = store.getAll('assets').filter(a => a.ownerType === 'Customer' && a.customerId === id);
      const sites = person.sites || [];
      tabContent.innerHTML = `
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Assets/Equipment (${assets.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-asset"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Asset</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Asset Name</th><th>Serial No.</th><th>Site</th><th>Install Date</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${assets.map((a, i) => `
                  <tr>
                    <td class="font-medium">${escapeHTML(a.name)}</td>
                    <td style="font-family:monospace" class="text-secondary">${escapeHTML(a.serial || '—')}</td>
                    <td>${escapeHTML(a.site || '—')}</td>
                    <td>${a.installDate ? new Date(a.installDate).toLocaleDateString() : '—'}</td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-asset" data-id="${a.id}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join('')}
                ${!assets.length ? '<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No assets tracked</td></tr>' : ''}
              </tbody>
            </table>
          </div>
        </div>
      `;

      tabContent.querySelector('#btn-toggle-asset').addEventListener('click', () => {
        showAssetQuickAdd({
          customerId: id,
          onSave: () => {
            renderTabContent();
            render(); // update tab count
          }
        });
      });

      tabContent.querySelectorAll('.btn-delete-asset').forEach(btn => {
        btn.addEventListener('click', () => {
          const assetId = btn.dataset.id;
          store.delete('assets', assetId);
          showToast('Asset disabled/deleted', 'success');
          renderTabContent();
          render();
        });
      });

    } else if (activeTab === 'jobs') {
      tabContent.innerHTML = renderRelatedTable(jobs, [
        { label: 'Job #', key: 'number' },
        { label: 'Title', key: 'title' },
        { label: 'Status', key: 'status', badge: true },
        { label: 'Technician', key: 'technicianName' },
      ], 'jobs', 'No jobs for this customer');
    } else if (activeTab === 'quotes') {
      tabContent.innerHTML = `
        <div style="margin-bottom:var(--space-base);display:flex;justify-content:flex-end">
          <button class="btn btn-primary btn-sm" id="btn-create-quote">
            <span class="material-icons-outlined">add</span> Create Quote
          </button>
        </div>
        ${renderRelatedTable(quotes, [
          { label: 'Quote #', key: 'number' },
          { label: 'Title', key: 'title' },
          { label: 'Status', key: 'status', badge: true },
          { label: 'Total', key: 'total', format: 'currency' },
        ], 'quotes', 'No quotes for this customer')}
      `;

      tabContent.querySelector('#btn-create-quote').addEventListener('click', () => {
        router.navigate('/quotes/new?customerId=' + id);
      });
    } else if (activeTab === 'invoices') {
      tabContent.innerHTML = renderRelatedTable(invoices, [
        { label: 'Invoice #', key: 'number' },
        { label: 'Status', key: 'status', badge: true },
        { label: 'Total', key: 'total', format: 'currency' },
        { label: 'Due', key: 'dueDate', format: 'date' },
      ], 'invoices', 'No invoices for this customer');
    }
  }

  render();
}

function detailRow(label, value) {
  return `
    <div style="display:flex;gap:8px">
      <span style="width:120px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${escapeHTML(label)}</span>
      <span style="font-size:var(--font-size-base)">${escapeHTML(value)}</span>
    </div>
  `;
}

function renderRelatedTable(items, cols, module, emptyMsg) {
  if (items.length === 0) {
    return `<div class="card"><div class="empty-state" style="padding:32px"><span class="material-icons-outlined">inbox</span><h3>${emptyMsg}</h3></div></div>`;
  }

  const statusBadge = (status) => {
    const cls = { 'Active': 'success', 'Completed': 'success', 'Paid': 'success', 'Accepted': 'success',
      'In Progress': 'primary', 'Sent': 'info', 'Scheduled': 'info',
      'Pending': 'warning', 'Draft': 'draft', 'On Hold': 'neutral',
      'Overdue': 'danger', 'Declined': 'danger', 'Void': 'void',
      'Invoiced': 'primary',
    };
    return `<span class="badge badge-${cls[status] || 'neutral'}">${escapeHTML(status)}</span>`;
  };

  return `
    <div class="card">
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr>${cols.map(c => `<th>${escapeHTML(c.label)}</th>`).join('')}</tr></thead>
          <tbody>
            ${items.map(item => `
              <tr style="cursor:pointer" onclick="window.location.hash='#/${module}/${escapeHTML(item.id)}'">
                ${cols.map(c => {
                  let val = item[c.key];
                  if (c.badge) val = statusBadge(val);
                  else if (c.format === 'currency') val = `$${(val || 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}`;
                  else if (c.format === 'date') val = val ? new Date(val).toLocaleDateString() : '—';
                  else val = escapeHTML(val);
                  return `<td>${val}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
