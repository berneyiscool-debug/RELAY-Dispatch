// ============================================
// SIMPRO CLONE — DOCUMENT SYSTEM PAGE
// ============================================

import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { escapeHTML } from '../../utils/security.js';
import { showModal } from '../../components/Modal.js';
import { showToast } from '../../components/Notifications.js';

export function renderDocumentBrowser(container) {
  let currentFolder = 'All Documents';

  function render() {
    const allDocs = [];

    // Global Documents
    store.getAll('documents').forEach(doc => {
      allDocs.push({
        id: doc.id,
        name: doc.name,
        url: doc.url,
        type: doc.type,
        size: doc.size,
        uploadedAt: doc.uploadedAt,
        folder: doc.folder || 'Company Docs',
        entityType: 'Global',
        entityId: 'global',
        entityName: 'Company'
      });
    });

    // Job Attachments & Forms
    store.getAll('jobs').forEach(job => {
      if (job.attachments && Array.isArray(job.attachments)) {
        job.attachments.forEach(att => {
          allDocs.push({
            id: att.id || Math.random().toString(36).substr(2, 9),
            name: att.name,
            url: att.url || att.data || '#',
            type: att.type,
            size: att.size,
            uploadedAt: att.uploadedAt || att.date || new Date().toISOString(),
            folder: 'Job Attachments',
            entityType: 'Job',
            entityId: job.id,
            entityName: `${job.number} - ${job.title}`
          });
        });
      }
      if (job.forms && Array.isArray(job.forms)) {
        job.forms.forEach((form, i) => {
          allDocs.push({
            id: `form_${job.id}_${i}`,
            name: `${form.type} - ${new Date(form.date).toLocaleDateString()}`,
            url: `#/jobs/${job.id}`,
            type: 'Digital Form',
            size: null,
            uploadedAt: form.date,
            folder: 'Digital Forms',
            entityType: 'Job',
            entityId: job.id,
            entityName: `${job.number} - ${job.title}`
          });
        });
      }
    });

    // Customer Attachments
    store.getAll('customers').forEach(customer => {
      if (customer.attachments && Array.isArray(customer.attachments)) {
        customer.attachments.forEach(att => {
          allDocs.push({
            id: att.id || Math.random().toString(36).substr(2, 9),
            name: att.name,
            url: att.url || att.data || '#',
            type: att.type,
            size: att.size,
            uploadedAt: att.uploadedAt || new Date().toISOString(),
            folder: 'Customer Attachments',
            entityType: 'Customer',
            entityId: customer.id,
            entityName: customer.company
          });
        });
      }
    });



    allDocs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    let displayDocs = allDocs;
    if (currentFolder !== 'All Documents') {
      displayDocs = allDocs.filter(d => d.folder === currentFolder);
    }

    const folders = ['All Documents', 'Company Docs', 'Health & Safety', 'Templates', 'Job Attachments', 'Customer Attachments', 'Digital Forms', 'Invoices', 'Quotes'];

    container.innerHTML = `
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center;">
        <h1>Document Center</h1>
        <button class="btn btn-primary" id="btn-upload-doc"><span class="material-icons-outlined">upload_file</span> Upload Document</button>
      </div>

      <div style="display:flex; gap:24px; align-items:flex-start; margin-top:24px;">
        <!-- Sidebar Folders -->
        <div class="card" style="width:250px; flex-shrink:0;">
          <div class="card-body" style="padding:12px">
            <h4 style="margin:0 0 12px 8px; font-size:12px; text-transform:uppercase; color:var(--text-tertiary)">Categories</h4>
            <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:4px;" id="folder-list">
              ${folders.map(f => {
                let icon = 'folder';
                if (f === 'All Documents') icon = 'dashboard';
                else if (f === 'Company Docs') icon = 'domain';
                else if (f === 'Health & Safety') icon = 'health_and_safety';
                else if (f === 'Templates') icon = 'file_copy';
                else if (f === 'Job Attachments') icon = 'build';
                else if (f === 'Customer Attachments') icon = 'people';
                else if (f === 'Digital Forms') icon = 'assignment';
                else if (f === 'Invoices') icon = 'receipt_long';
                else if (f === 'Quotes') icon = 'request_quote';
                
                const isActive = currentFolder === f;
                const count = f === 'All Documents' ? allDocs.length : allDocs.filter(d => d.folder === f).length;
                
                return `
                <li>
                  <button class="btn btn-ghost ${isActive ? 'active' : ''}" data-folder="${f}" style="width:100%; justify-content:space-between; padding:8px 12px; background:${isActive ? 'var(--color-primary-bg)' : 'transparent'}; color:${isActive ? 'var(--primary-color)' : 'var(--text-primary)'}; font-weight:${isActive ? '600' : '400'}">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span class="material-icons-outlined" style="font-size:18px">${icon}</span> ${f}
                    </div>
                    <span class="badge badge-neutral" style="font-size:10px">${count}</span>
                  </button>
                </li>
              `}).join('')}
            </ul>
          </div>
        </div>

        <!-- Main Content -->
        <div class="card" style="flex:1; min-width:0;">
          <div class="card-header" style="padding:16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color)">
            <h3 style="margin:0">${currentFolder}</h3>
            <div class="toolbar-search">
              <span class="material-icons-outlined">search</span>
              <input type="text" placeholder="Search ${currentFolder.toLowerCase()}..." id="docs-search" />
            </div>
          </div>
          <div class="card-body" style="padding:0; overflow-x:auto;">
            <div id="docs-table-container"></div>
          </div>
        </div>
      </div>
    `;

    // Folder switching
    container.querySelectorAll('#folder-list button').forEach(btn => {
      btn.addEventListener('click', () => {
        currentFolder = btn.dataset.folder;
        render();
      });
    });

    let filteredData = [...displayDocs];

    const columns = [
      { key: 'name', label: 'File Name', render: (r) => {
          let icon = 'insert_drive_file';
          if (r.type === 'Invoice PDF' || r.type === 'Quote PDF') icon = 'picture_as_pdf';
          else if (r.type === 'Digital Form') icon = 'assignment';
          else if (r.type && r.type.includes('image')) icon = 'image';
          return `<div style="display:flex;align-items:center;gap:8px;"><span class="material-icons-outlined" style="color:var(--text-secondary)">${icon}</span> <span class="font-medium truncate" style="max-width:300px" title="${escapeHTML(r.name)}">${escapeHTML(r.name)}</span></div>`;
      }},
      { key: 'folder', label: 'Category', render: (r) => escapeHTML(r.folder || '—') },
      { key: 'size', label: 'Size', render: (r) => r.size ? (r.size / 1024).toFixed(1) + ' KB' : '—' },
      { key: 'entityName', label: 'Linked To', render: (r) => {
          if (r.entityType === 'Global') return '<span class="text-secondary" style="font-size:12px">Company Shared</span>';
          const linkPath = r.entityType === 'Job' ? `#/jobs/${r.entityId}` : r.entityType === 'Customer' ? `#/people/${r.entityId}` : r.entityType === 'Invoice' ? `#/invoices/${r.entityId}` : `#/quotes/${r.entityId}`;
          return `<span class="badge badge-neutral">${r.entityType}</span> <a href="${linkPath}">${escapeHTML(r.entityName)}</a>`;
        }
      },
      { key: 'uploadedAt', label: 'Uploaded', render: (r) => r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString() : '—' },
      { key: 'actions', label: '', width: '80px', render: (r) => `<a href="${escapeHTML(r.url)}" target="_blank" class="btn btn-sm btn-outline" style="text-decoration:none">View</a>` }
    ];

    const table = createDataTable({ 
      columns, 
      data: filteredData, 
      emptyMessage: 'No documents found in this category.', 
      emptyIcon: 'folder_open' 
    });
    
    container.querySelector('#docs-table-container').appendChild(table);

    const searchInput = container.querySelector('#docs-search');

    function updateView() {
      const q = searchInput.value.toLowerCase();
      filteredData = displayDocs.filter(d =>
        d.name.toLowerCase().includes(q) ||
        (d.entityName && d.entityName.toLowerCase().includes(q)) ||
        (d.folder && d.folder.toLowerCase().includes(q))
      );
      table.updateData(filteredData);
    }

    searchInput.addEventListener('input', updateView);

    container.querySelector('#btn-upload-doc').addEventListener('click', () => {
      const uploadFolders = folders.filter(f => f !== 'All Documents');
      const content = document.createElement('div');
      content.innerHTML = `
        <div class="form-group">
          <label class="form-label">Category / Folder</label>
          <select class="form-select" id="upload-folder">
            ${uploadFolders.map(f => `<option value="${f}">${f}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Select File</label>
          <input type="file" class="form-input" id="upload-file-input" accept="image/*,.pdf,.doc,.docx" />
        </div>
      `;
      showModal({
        title: 'Upload Global Document',
        content,
        actions: [
          { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
          { label: 'Upload', className: 'btn-primary', onClick: (close) => {
            const fileInput = document.getElementById('upload-file-input');
            const folder = document.getElementById('upload-folder').value;
            if (!fileInput.files.length) {
              showToast('Please select a file', 'error');
              return;
            }
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
              store.create('documents', {
                name: file.name,
                type: file.type || 'unknown',
                size: file.size,
                url: e.target.result,
                folder: folder,
                uploadedAt: new Date().toISOString()
              });
              showToast('Document uploaded successfully', 'success');
              render();
              close();
            };
            reader.readAsDataURL(file);
          }}
        ]
      });
    });
  }

  render();
}
