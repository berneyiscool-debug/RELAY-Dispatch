import { store } from '../../data/store.js';
import { escapeHTML } from '../../utils/security.js';

export function renderDocumentBrowser(container) {
  // Aggregate mock files from all entities (e.g., jobs)
  const allDocs = [];

  store.getAll('jobs').forEach(job => {
    if (job.attachments && Array.isArray(job.attachments)) {
      job.attachments.forEach(att => {
        allDocs.push({
          id: att.id || Math.random().toString(36).substr(2, 9),
          name: att.name,
          url: att.url,
          type: att.type,
          size: att.size,
          uploadedAt: att.uploadedAt,
          entityType: 'Job',
          entityId: job.id,
          entityName: \`\${job.number} - \${job.title}\`
        });
      });
    }
  });

  // Future-proof: loop through customers for attachments if they have them
  store.getAll('customers').forEach(customer => {
    if (customer.attachments && Array.isArray(customer.attachments)) {
      customer.attachments.forEach(att => {
        allDocs.push({
          id: att.id || Math.random().toString(36).substr(2, 9),
          name: att.name,
          url: att.url,
          type: att.type,
          size: att.size,
          uploadedAt: att.uploadedAt,
          entityType: 'Customer',
          entityId: customer.id,
          entityName: customer.company
        });
      });
    }
  });

  allDocs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

  container.innerHTML = `
    <div class="page-header">
      <h1>Global Documents</h1>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search documents..." id="docs-search" />
      </div>
      <div class="toolbar-filters" style="margin-left: 10px;">
        <select id="docs-sort" class="form-select" style="width: auto;">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name_asc">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
        </select>
      </div>
    </div>

    <div class="card">
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Type</th>
              <th>Size</th>
              <th>Linked To</th>
              <th>Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="docs-tbody">
          </tbody>
        </table>
      </div>
    </div>
  `;

  const tbody = container.querySelector('#docs-tbody');

  function renderTable(docs) {
    if (docs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No documents found.</td></tr>';
      return;
    }

    tbody.innerHTML = docs.map(d => {
      const sizeStr = d.size ? (d.size / 1024).toFixed(1) + ' KB' : '-';
      const dateStr = d.uploadedAt ? new Date(d.uploadedAt).toLocaleString() : '-';
      const linkPath = d.entityType === 'Job' ? \`/jobs/\${d.entityId}\` : \`/people/\${d.entityId}\`;

      return `
        <tr>
          <td><div style="display:flex;align-items:center;gap:8px;"><span class="material-icons-outlined" style="color:var(--text-secondary)">insert_drive_file</span> ${escapeHTML(d.name)}</div></td>
          <td>${escapeHTML(d.type || '-')}</td>
          <td>${sizeStr}</td>
          <td><span class="badge badge-neutral">${d.entityType}</span> <a href="#${linkPath}">${escapeHTML(d.entityName)}</a></td>
          <td>${dateStr}</td>
          <td>
            <a href="${escapeHTML(d.url)}" target="_blank" class="btn btn-sm btn-outline">View</a>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderTable(allDocs);

  const searchInput = container.querySelector('#docs-search');
  const sortSelect = container.querySelector('#docs-sort');

  function updateView() {
    const q = searchInput.value.toLowerCase();
    const sortVal = sortSelect.value;

    let filtered = allDocs.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.entityName.toLowerCase().includes(q)
    );

    filtered.sort((a, b) => {
      if (sortVal === 'newest') return new Date(b.uploadedAt) - new Date(a.uploadedAt);
      if (sortVal === 'oldest') return new Date(a.uploadedAt) - new Date(b.uploadedAt);
      if (sortVal === 'name_asc') return a.name.localeCompare(b.name);
      if (sortVal === 'name_desc') return b.name.localeCompare(a.name);
      return 0;
    });

    renderTable(filtered);
  }

  searchInput.addEventListener('input', updateView);
  sortSelect.addEventListener('change', updateView);
}
