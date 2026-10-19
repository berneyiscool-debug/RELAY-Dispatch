// ============================================
// RELAY DISPATCH — DOCUMENT CENTER
// ============================================
// A file-explorer style browser over every document the business holds: the
// folder's contents (details list or tiles) with a details pane on the right
// for the selected item. Documents can be viewed in a new tab, their record
// opened, or downloaded.

import { store } from '../../data/store.js';
import { escapeHTML } from '../../utils/security.js';
import { showModal } from '../../components/Modal.js';
import { showToast } from '../../components/Notifications.js';
import {
  canView, canOpenRecord, canDownload,
  viewDocumentInNewTab, openRecordInNewTab, downloadDocument,
} from '../../utils/documentActions.js';

const ROOT = 'All Documents';
const VIEW_KEY = 'documentCenter.view';

const ALL_FOLDERS = [
  ROOT, 'Company Docs', 'Health & Safety', 'Templates',
  'Job Attachments', 'Customer Attachments', 'Digital Forms',
  'Invoices', 'Quotes', 'Purchase Orders',
];

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'uploadedAt', label: 'Date modified' },
  { key: 'kind', label: 'Type' },
  { key: 'size', label: 'Size' },
  { key: 'entityName', label: 'Linked to' },
];

// ---- File type presentation -------------------------------------------------

function fileExt(name) {
  const m = /\.([a-z0-9]{1,6})$/i.exec(name || '');
  return m ? m[1].toLowerCase() : '';
}

function fileKind(doc) {
  const t = doc.type || '';
  if (t === 'Invoice PDF' || t === 'Quote PDF' || t === 'PO PDF') return 'pdf';
  if (t === 'Digital Form' || t === 'Form Template' || t === 'Tasklist Template') return 'form';
  if (t.startsWith('image/')) return 'image';
  if (t === 'application/pdf') return 'pdf';
  const ext = fileExt(doc.name);
  if (ext === 'pdf') return 'pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic', 'bmp', 'svg'].includes(ext)) return 'image';
  if (['doc', 'docx', 'odt', 'rtf', 'txt'].includes(ext)) return 'doc';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return 'sheet';
  return 'file';
}

const KIND_META = {
  pdf: { icon: 'picture_as_pdf', label: 'PDF document' },
  image: { icon: 'image', label: 'Image' },
  doc: { icon: 'article', label: 'Document' },
  sheet: { icon: 'table_chart', label: 'Spreadsheet' },
  form: { icon: 'assignment', label: 'Form' },
  file: { icon: 'insert_drive_file', label: 'File' },
};

function typeLabel(doc) {
  if (['Invoice PDF', 'Quote PDF', 'PO PDF', 'Digital Form', 'Form Template', 'Tasklist Template'].includes(doc.type)) return doc.type;
  const ext = fileExt(doc.name);
  const base = KIND_META[fileKind(doc)].label;
  if (!ext || fileKind(doc) === 'pdf') return base;
  return `${ext.toUpperCase()} ${base.toLowerCase()}`;
}

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

function linkedPath(doc) {
  switch (doc.entityType) {
    case 'Job': return `#/jobs/${doc.entityId}`;
    case 'Customer': return `#/people/${doc.entityId}`;
    case 'Invoice': return `#/invoices/${doc.entityId}`;
    case 'Quote': return `#/quotes/${doc.entityId}`;
    case 'PO': return `#/purchase-orders/${doc.entityId}`;
    case 'Template': return '#/settings';
    default: return null;
  }
}

// ---- Gathering every document in the business -------------------------------

function collectDocuments() {
  const out = [];
  const push = (d) => out.push({ ...d, kind: '' });

  store.getAll('documents').forEach(doc => {
    push({
      id: doc.id, name: doc.name, url: doc.url, type: doc.type, size: doc.size,
      uploadedAt: doc.uploadedAt, folder: doc.folder || 'Company Docs',
      entityType: 'Global', entityId: 'global', entityName: 'Company',
    });
  });

  store.getAll('jobs').forEach(job => {
    const jobRef = { folder: 'Job Attachments', entityType: 'Job', entityId: job.id, entityName: `${job.number} - ${job.title}` };

    (Array.isArray(job.attachments) ? job.attachments : []).forEach((att, i) => {
      push({
        id: att.id || `job_${job.id}_att_${i}`, name: att.name, url: att.url || att.data || '#',
        type: att.type, size: att.size,
        uploadedAt: att.uploadedAt || att.date || job.createdAt || new Date().toISOString(),
        ...jobRef,
      });
    });

    (Array.isArray(job.activityLog) ? job.activityLog : []).forEach(log => {
      if (log.type === 'attachment' && log.file) {
        push({
          id: log.id, name: log.file.name, url: log.file.url || log.file.data || '#',
          type: log.file.type, size: log.file.size, uploadedAt: log.date, ...jobRef,
        });
      }
      if (log.type === 'combined' && Array.isArray(log.files)) {
        log.files.forEach((f, idx) => {
          push({
            id: `${log.id}_${idx}`, name: f.name, url: f.url || f.data || '#',
            type: f.type, size: f.size, uploadedAt: log.date, ...jobRef,
          });
        });
      }
    });

    (Array.isArray(job.forms) ? job.forms : []).forEach((form, i) => {
      push({
        id: `form_${job.id}_${i}`, name: `${form.type} - ${new Date(form.date).toLocaleDateString()}`,
        url: `#/jobs/${job.id}`, type: 'Digital Form', size: null, uploadedAt: form.date,
        ...jobRef, folder: 'Digital Forms',
      });
    });
  });

  // Compliance forms / checksheets filled in on jobs. These are drawn as their
  // printed page when viewed or downloaded.
  store.getAll('formInstances').forEach(fi => {
    const template = store.getById('formTemplates', fi.templateId);
    if (!template) return;
    const job = fi.jobId ? store.getById('jobs', fi.jobId) : null;
    const status = fi.status && fi.status !== 'Completed' ? ` (${fi.status})` : '';
    push({
      id: `fi_${fi.id}`, name: `${template.name}${job ? ` - ${job.number}` : ''}${status}`,
      url: null, type: 'Digital Form', size: null,
      uploadedAt: fi.submittedAt || fi.updatedAt || fi.createdAt,
      folder: 'Digital Forms', render: { kind: 'form', id: fi.id },
      recordPath: fi.jobId ? `#/jobs/${fi.jobId}?tab=forms&form=${encodeURIComponent(fi.id)}` : null,
      entityType: 'Job', entityId: fi.jobId, entityName: job ? `${job.number} - ${job.title}` : '',
    });
  });

  store.getAll('customers').forEach(customer => {
    (Array.isArray(customer.attachments) ? customer.attachments : []).forEach((att, i) => {
      push({
        id: att.id || `cust_${customer.id}_att_${i}`, name: att.name, url: att.url || att.data || '#',
        type: att.type, size: att.size,
        uploadedAt: att.uploadedAt || customer.createdAt || new Date().toISOString(),
        folder: 'Customer Attachments', entityType: 'Customer', entityId: customer.id, entityName: customer.company,
      });
    });
  });

  store.getAll('invoices').forEach(inv => {
    push({
      id: inv.id, name: `Invoice ${inv.number}.pdf`, url: `#/invoices/${inv.id}`, type: 'Invoice PDF',
      size: null, uploadedAt: inv.issueDate, folder: 'Invoices', render: { kind: 'invoice', id: inv.id },
      entityType: 'Invoice', entityId: inv.id, entityName: `Inv ${inv.number} - ${inv.customerName}`,
    });
  });

  store.getAll('quotes').forEach(quote => {
    push({
      id: quote.id, name: `Quote ${quote.number}.pdf`, url: `#/quotes/${quote.id}`, type: 'Quote PDF',
      size: null, uploadedAt: quote.createdAt, folder: 'Quotes', render: { kind: 'quote', id: quote.id },
      entityType: 'Quote', entityId: quote.id, entityName: `Quote ${quote.number} - ${quote.customerName}`,
    });
  });

  store.getAll('purchaseOrders').forEach(po => {
    push({
      id: po.id, name: `PO ${po.number}.pdf`, url: `#/purchase-orders/${po.id}`, type: 'PO PDF',
      size: null, uploadedAt: po.issueDate, folder: 'Purchase Orders',
      entityType: 'PO', entityId: po.id, entityName: `PO ${po.number} - ${po.supplierName}`,
    });
  });

  store.getAll('taskTemplates').forEach(t => {
    push({
      id: `task_tmpl_${t.id}`, name: `${t.name} (Tasklist Template)`, url: '#/settings', type: 'Tasklist Template',
      render: { kind: 'tasklist-template', id: t.id },
      size: null, uploadedAt: t.createdAt || new Date().toISOString(), folder: 'Templates',
      entityType: 'Template', entityId: t.id, entityName: 'Settings / Tasklist Templates',
    });
  });

  store.getAll('formTemplates').forEach(ft => {
    push({
      id: `form_tmpl_${ft.id}`, name: `${ft.name} (Compliance Form Template)`, url: '#/settings', type: 'Form Template',
      render: { kind: 'form-template', id: ft.id },
      size: null, uploadedAt: ft.createdAt || ft.updatedAt || new Date().toISOString(), folder: 'Templates',
      entityType: 'Template', entityId: ft.id, entityName: 'Settings / Compliance Forms',
    });
  });

  out.forEach(d => {
    d.name = d.name || 'Untitled';
    d.kind = typeLabel(d);
    if (!d.recordPath && d.entityType !== 'Global') d.recordPath = linkedPath(d);
  });
  return out;
}

// ---- Page ------------------------------------------------------------------

export function renderDocumentBrowser(container, params) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"role":"admin"}');

  function getVisibleFolders() {
    if (currentUser.role === 'admin' || currentUser.role === 'manager') return ALL_FOLDERS;
    const allowed = [ROOT, 'Health & Safety', 'Job Attachments', 'Customer Attachments', 'Digital Forms', 'Purchase Orders'];
    const ut = currentUser.userTypeId ? store.getById('userTypes', currentUser.userTypeId) : null;
    if (ut && ut.permissions) {
      const qPerm = ut.permissions.find(p => p.module === 'Quotes');
      const iPerm = ut.permissions.find(p => p.module === 'Invoices');
      if (qPerm && qPerm.view) allowed.push('Quotes');
      if (iPerm && iPerm.view) allowed.push('Invoices');
    }
    return ALL_FOLDERS.filter(f => allowed.includes(f));
  }

  const state = {
    folder: (params && params.tab) || ROOT,
    query: '',
    sortKey: 'uploadedAt',
    sortDir: -1,
    view: readView(),
    selected: new Set(),
    anchorId: null, // shift-click range anchor
  };

  let allDocs = [];
  let visibleFolders = [];
  let shown = [];
  let contextMenu = null;

  function readView() {
    try { return localStorage.getItem(VIEW_KEY) === 'tiles' ? 'tiles' : 'details'; } catch { return 'details'; }
  }

  function loadData() {
    visibleFolders = getVisibleFolders();
    if (!visibleFolders.includes(state.folder)) state.folder = ROOT;
    allDocs = collectDocuments().filter(d => visibleFolders.includes(d.folder));
  }

  function computeShown() {
    const q = state.query.trim().toLowerCase();
    let list = state.folder === ROOT ? allDocs : allDocs.filter(d => d.folder === state.folder);
    if (q) {
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        (d.entityName && d.entityName.toLowerCase().includes(q)) ||
        (d.folder && d.folder.toLowerCase().includes(q)) ||
        d.kind.toLowerCase().includes(q));
    }
    const { sortKey: k, sortDir: dir } = state;
    list = [...list].sort((a, b) => {
      let av = a[k], bv = b[k];
      if (k === 'uploadedAt') { av = new Date(av).getTime() || 0; bv = new Date(bv).getTime() || 0; }
      else if (k === 'size') { av = av || 0; bv = bv || 0; }
      else { av = String(av || '').toLowerCase(); bv = String(bv || '').toLowerCase(); }
      return av < bv ? -dir : av > bv ? dir : 0;
    });
    shown = list;
    // Drop selections that are no longer on screen.
    const ids = new Set(shown.map(d => d.id));
    [...state.selected].forEach(id => { if (!ids.has(id)) state.selected.delete(id); });
  }

  function selectedDocs() {
    return shown.filter(d => state.selected.has(d.id));
  }

  // ---- Markup ---------------------------------------------------------------

  // At the top level (and not searching) the folders are listed ahead of the
  // files, as Explorer does. A click opens the folder.
  function showFolderEntries() {
    return state.folder === ROOT && !state.query.trim();
  }

  function folderEntries() {
    const counts = {};
    allDocs.forEach(d => { counts[d.folder] = (counts[d.folder] || 0) + 1; });
    return visibleFolders.filter(f => f !== ROOT).map(f => ({ name: f, count: counts[f] || 0 }));
  }

  function folderCountLabel(n) {
    return `${n} item${n === 1 ? '' : 's'}`;
  }

  function addressHtml() {
    const crumbs = [`<button type="button" class="dx-crumb" data-folder="${ROOT}"><span class="material-icons-outlined">folder_special</span>Documents</button>`];
    if (state.folder !== ROOT) {
      crumbs.push('<span class="material-icons-outlined dx-crumb-sep">chevron_right</span>');
      crumbs.push(`<button type="button" class="dx-crumb" data-folder="${escapeHTML(state.folder)}">${escapeHTML(state.folder)}</button>`);
    }
    if (state.query.trim()) {
      crumbs.push('<span class="material-icons-outlined dx-crumb-sep">chevron_right</span>');
      crumbs.push(`<span class="dx-crumb dx-crumb-static">Search results</span>`);
    }
    return crumbs.join('');
  }

  function iconHtml(doc, size = '') {
    const kind = fileKind(doc);
    return `<span class="material-icons-outlined dx-icon dx-icon-${kind}${size}">${KIND_META[kind].icon}</span>`;
  }

  function rowActionsHtml(doc) {
    const view = canView(doc)
      ? `<button type="button" class="btn-icon dx-act" data-act="view" data-id="${escapeHTML(doc.id)}" data-tooltip="View in new tab" data-tooltip-pos="left" aria-label="View"><span class="material-icons-outlined">visibility</span></button>`
      : '';
    const open = canOpenRecord(doc)
      ? `<button type="button" class="btn-icon dx-act" data-act="record" data-id="${escapeHTML(doc.id)}" data-tooltip="Open record in new tab" data-tooltip-pos="left" aria-label="Open record"><span class="material-icons-outlined">open_in_new</span></button>`
      : '';
    const dl = canDownload(doc)
      ? `<button type="button" class="btn-icon dx-act" data-act="download" data-id="${escapeHTML(doc.id)}" data-tooltip="Download" data-tooltip-pos="left" aria-label="Download"><span class="material-icons-outlined">download</span></button>`
      : '';
    return `<span class="dx-row-actions">${open}${dl}</span>`;
  }

  function detailsViewHtml() {
    const head = COLUMNS.map(c => {
      const active = state.sortKey === c.key;
      const arrow = active ? `<span class="material-icons-outlined dx-sort">${state.sortDir === 1 ? 'arrow_upward' : 'arrow_downward'}</span>` : '';
      return `<button type="button" class="dx-th dx-col-${c.key}${active ? ' active' : ''}" data-sort="${c.key}">${c.label}${arrow}</button>`;
    }).join('');
    const folderRows = showFolderEntries() ? folderEntries().map(f => `
      <div class="dx-row dx-folder" data-folder="${escapeHTML(f.name)}" role="row">
        <div class="dx-td dx-col-name"><span class="material-icons-outlined dx-icon dx-icon-folder">folder</span><span class="dx-name">${escapeHTML(f.name)}</span></div>
        <div class="dx-td dx-col-uploadedAt"></div>
        <div class="dx-td dx-col-kind">File folder</div>
        <div class="dx-td dx-col-size">${folderCountLabel(f.count)}</div>
        <div class="dx-td dx-col-entityName"></div>
      </div>`).join('') : '';
    const rows = folderRows + shown.map(d => `
      <div class="dx-row${state.selected.has(d.id) ? ' selected' : ''}" data-id="${escapeHTML(d.id)}" role="row" tabindex="-1">
        <div class="dx-td dx-col-name">${iconHtml(d)}<span class="dx-name" title="${escapeHTML(d.name)}">${escapeHTML(d.name)}</span>${rowActionsHtml(d)}</div>
        <div class="dx-td dx-col-uploadedAt">${escapeHTML(formatDate(d.uploadedAt))}</div>
        <div class="dx-td dx-col-kind">${escapeHTML(d.kind)}</div>
        <div class="dx-td dx-col-size">${escapeHTML(formatSize(d.size))}</div>
        <div class="dx-td dx-col-entityName">${d.entityType === 'Global' ? '<span class="text-tertiary">Company shared</span>' : escapeHTML(d.entityName || '')}</div>
      </div>`).join('');
    return `<div class="dx-details" role="grid"><div class="dx-thead" role="row">${head}</div><div class="dx-tbody">${rows}</div></div>`;
  }

  function tilesViewHtml() {
    const folderTiles = showFolderEntries() ? folderEntries().map(f => `
      <div class="dx-tile dx-folder" data-folder="${escapeHTML(f.name)}" title="${escapeHTML(f.name)} — ${folderCountLabel(f.count)}">
        <span class="material-icons-outlined dx-icon dx-icon-folder dx-icon-lg">folder</span>
        <span class="dx-tile-name">${escapeHTML(f.name)}</span>
      </div>`).join('') : '';
    return `<div class="dx-tiles">${folderTiles}${shown.map(d => `
      <div class="dx-tile${state.selected.has(d.id) ? ' selected' : ''}" data-id="${escapeHTML(d.id)}" tabindex="-1" title="${escapeHTML(d.name)}">
        ${iconHtml(d, ' dx-icon-lg')}
        <span class="dx-tile-name">${escapeHTML(d.name)}</span>
      </div>`).join('')}</div>`;
  }

  function emptyHtml() {
    const searching = !!state.query.trim();
    return `
      <div class="dx-empty">
        <span class="material-icons-outlined">${searching ? 'search_off' : 'folder_open'}</span>
        <div>${searching ? 'No items match your search.' : 'This folder is empty.'}</div>
      </div>`;
  }

  function previewPaneHtml() {
    const sel = selectedDocs();
    if (sel.length === 0) {
      return `<div class="dx-preview-empty"><span class="material-icons-outlined">touch_app</span><div>Select a file to see its details</div></div>`;
    }
    if (sel.length > 1) {
      const bytes = sel.reduce((s, d) => s + (d.size || 0), 0);
      const dl = sel.filter(canDownload).length;
      return `
        <div class="dx-preview-thumb"><span class="material-icons-outlined dx-icon dx-icon-xl">library_books</span></div>
        <div class="dx-preview-name">${sel.length} items selected</div>
        ${bytes ? `<div class="dx-preview-sub">${formatSize(bytes)}</div>` : ''}
        <div class="dx-preview-actions">
          <button type="button" class="btn btn-primary btn-sm" data-act="download-selected" ${dl ? '' : 'disabled'}><span class="material-icons-outlined">download</span> Download ${dl === sel.length ? 'all' : `${dl} files`}</button>
        </div>`;
    }
    const d = sel[0];
    const isImage = fileKind(d) === 'image' && canDownload(d) && !d.render;
    const rows = [
      ['Type', d.kind],
      ['Size', formatSize(d.size) || '—'],
      ['Modified', formatDate(d.uploadedAt) || '—'],
      ['Folder', d.folder],
      ['Linked to', d.entityType === 'Global' ? 'Company shared' : d.entityName],
    ];
    return `
      <div class="dx-preview-thumb">${isImage ? '<div class="dx-thumb-loading"></div>' : iconHtml(d, ' dx-icon-xl')}</div>
      <div class="dx-preview-name" title="${escapeHTML(d.name)}">${escapeHTML(d.name)}</div>
      <div class="dx-preview-actions">
        ${canView(d) ? `<button type="button" class="btn btn-primary btn-sm" data-act="view" data-id="${escapeHTML(d.id)}"><span class="material-icons-outlined">visibility</span> View</button>` : ''}
        ${canDownload(d) ? `<button type="button" class="btn btn-secondary btn-sm" data-act="download" data-id="${escapeHTML(d.id)}"><span class="material-icons-outlined">download</span> Download</button>` : ''}
        ${canOpenRecord(d) ? `<button type="button" class="btn btn-secondary btn-sm" data-act="record" data-id="${escapeHTML(d.id)}"><span class="material-icons-outlined">open_in_new</span> Open record</button>` : ''}
      </div>
      <dl class="dx-props">
        ${rows.map(([k, v]) => `<dt>${k}</dt><dd>${escapeHTML(v || '—')}</dd>`).join('')}
      </dl>
    `;
  }

  function statusHtml() {
    const sel = selectedDocs();
    const parts = [`${shown.length} item${shown.length === 1 ? '' : 's'}`];
    if (sel.length) {
      const bytes = sel.reduce((s, d) => s + (d.size || 0), 0);
      parts.push(`${sel.length} selected${bytes ? ` · ${formatSize(bytes)}` : ''}`);
    }
    return parts.map(p => `<span>${p}</span>`).join('');
  }

  function toolbarState() {
    const sel = selectedDocs();
    const one = sel.length === 1 ? sel[0] : null;
    const allGlobal = sel.length > 0 && sel.every(d => d.entityType === 'Global');
    return {
      view: !!(one && canView(one)),
      record: !!(one && canOpenRecord(one)),
      download: sel.some(canDownload),
      move: allGlobal,
      del: allGlobal,
    };
  }

  // ---- Render ---------------------------------------------------------------

  function render() {
    loadData();
    computeShown();

    container.innerHTML = `
      <div class="dx" tabindex="0" aria-label="Document Center">
        <div class="dx-toolbar">
          <button type="button" class="btn btn-primary btn-sm" data-act="upload"><span class="material-icons-outlined">upload_file</span> Upload</button>
          <span class="dx-tb-sep"></span>
          <button type="button" class="dx-tb-btn" data-act="view-selected" data-tooltip="View the document in a new tab (Enter)" data-tooltip-pos="bottom"><span class="material-icons-outlined">visibility</span><span>View</span></button>
          <button type="button" class="dx-tb-btn" data-act="record-selected" data-tooltip="Open the job, invoice or customer it belongs to" data-tooltip-pos="bottom"><span class="material-icons-outlined">open_in_new</span><span>Open record</span></button>
          <button type="button" class="dx-tb-btn" data-act="download-selected" data-tooltip="Download to this computer" data-tooltip-pos="bottom"><span class="material-icons-outlined">download</span><span>Download</span></button>
          <button type="button" class="dx-tb-btn" data-act="move" data-tooltip="Move uploaded documents to another folder" data-tooltip-pos="bottom"><span class="material-icons-outlined">drive_file_move</span><span>Move</span></button>
          <button type="button" class="dx-tb-btn dx-tb-danger" data-act="delete" data-tooltip="Delete uploaded documents (Del)" data-tooltip-pos="bottom"><span class="material-icons-outlined">delete</span><span>Delete</span></button>
          <span class="dx-tb-spacer"></span>
          <div class="dx-viewtoggle" role="group" aria-label="View">
            <button type="button" class="dx-tb-btn" data-view="details" data-tooltip="Details" data-tooltip-pos="bottom" aria-label="Details view"><span class="material-icons-outlined">view_list</span></button>
            <button type="button" class="dx-tb-btn" data-view="tiles" data-tooltip="Large icons" data-tooltip-pos="bottom" aria-label="Large icons view"><span class="material-icons-outlined">grid_view</span></button>
          </div>
        </div>
        <div class="dx-addressbar">
          <button type="button" class="dx-nav-btn" data-act="back" aria-label="Back" data-tooltip="Back" data-tooltip-pos="bottom"><span class="material-icons-outlined">arrow_back</span></button>
          <button type="button" class="dx-nav-btn" data-act="forward" aria-label="Forward" data-tooltip="Forward" data-tooltip-pos="bottom"><span class="material-icons-outlined">arrow_forward</span></button>
          <button type="button" class="dx-nav-btn" data-act="up" aria-label="Up" data-tooltip="Up to Documents" data-tooltip-pos="bottom"><span class="material-icons-outlined">arrow_upward</span></button>
          <div class="dx-address" id="dx-address"></div>
          <div class="dx-search">
            <span class="material-icons-outlined">search</span>
            <input type="text" id="dx-search" placeholder="Search" value="${escapeHTML(state.query)}" />
          </div>
        </div>
        <div class="dx-body">
          <div class="dx-main" id="dx-main"></div>
          <aside class="dx-preview" id="dx-preview"></aside>
        </div>
        <div class="dx-status" id="dx-status"></div>
      </div>
    `;
    wire();
    refresh();
  }

  // Re-render the dynamic regions without rebuilding the shell, so the search
  // box keeps focus while typing.
  function refresh() {
    computeShown();
    const q = (s) => container.querySelector(s);
    q('#dx-address').innerHTML = addressHtml();
    const hasItems = shown.length || (showFolderEntries() && folderEntries().length);
    q('#dx-main').innerHTML = hasItems ? (state.view === 'tiles' ? tilesViewHtml() : detailsViewHtml()) : emptyHtml();
    refreshSelection();
    q('[data-act="up"]').disabled = state.folder === ROOT;
    container.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === state.view));
  }

  // Selection-only changes: restyle rows, update toolbar, preview and status.
  function refreshSelection() {
    container.querySelectorAll('#dx-main [data-id]').forEach(el => {
      el.classList.toggle('selected', state.selected.has(el.dataset.id));
    });
    const ts = toolbarState();
    const set = (act, on) => { const b = container.querySelector(`.dx-toolbar [data-act="${act}"]`); if (b) b.disabled = !on; };
    set('view-selected', ts.view);
    set('record-selected', ts.record);
    set('download-selected', ts.download);
    set('move', ts.move);
    set('delete', ts.del);
    container.querySelector('#dx-preview').innerHTML = previewPaneHtml();
    container.querySelector('#dx-status').innerHTML = statusHtml();
    loadPreviewImage();
  }

  function loadPreviewImage() {
    const slot = container.querySelector('#dx-preview .dx-thumb-loading');
    const sel = selectedDocs();
    if (!slot || sel.length !== 1) return;
    const d = sel[0];
    store.getDocumentUrl(d).then(url => {
      if (!url || !slot.isConnected) return;
      const img = document.createElement('img');
      img.alt = d.name;
      img.src = url;
      img.onerror = () => { slot.outerHTML = iconHtml(d, ' dx-icon-xl'); };
      slot.replaceWith(img);
    }).catch(() => { if (slot.isConnected) slot.outerHTML = iconHtml(d, ' dx-icon-xl'); });
  }

  // ---- Navigation -----------------------------------------------------------

  // Folders are routes (the same ?tab= links the sidebar uses), so the app
  // sidebar stays in step and the browser's back/forward walk folder history.
  function goTo(folder) {
    if (!visibleFolders.includes(folder) || folder === state.folder) return;
    window.location.hash = `#/documents?tab=${encodeURIComponent(folder)}`;
  }

  // ---- Actions --------------------------------------------------------------

  const byId = (id) => shown.find(d => d.id === id) || allDocs.find(d => d.id === id);

  function viewDoc(doc) {
    if (!doc) return;
    if (!viewDocumentInNewTab(doc)) showToast('This item has no document to view.', 'error');
  }

  function openRecord(doc) {
    if (!doc) return;
    if (!openRecordInNewTab(doc)) showToast('This item is not linked to a record.', 'error');
  }

  // Double-click / Enter: show the document when there is one, else its record.
  function openDefault(doc) {
    if (!doc) return;
    if (canView(doc)) viewDoc(doc); else openRecord(doc);
  }

  async function downloadDocs(docs) {
    const files = docs.filter(canDownload);
    if (!files.length) { showToast('Nothing in the selection can be downloaded.', 'error'); return; }
    if (files.length > 1) showToast(`Downloading ${files.length} files…`, 'info');
    let failed = 0;
    for (const d of files) {
      try {
        await downloadDocument(d);
      } catch (err) {
        failed++;
        console.error('Download failed:', d.name, err);
        if (files.length === 1) showToast(`Could not download ${d.name}: ${err.message || err}`, 'error');
      }
    }
    if (files.length > 1 && failed) showToast(`${failed} of ${files.length} downloads failed.`, 'error');
  }

  function moveSelected() {
    const ids = selectedDocs().filter(d => d.entityType === 'Global').map(d => d.id);
    if (!ids.length) return;
    const uploadFolders = visibleFolders.filter(f => f !== ROOT);
    const content = document.createElement('div');
    content.innerHTML = `
      <div class="form-group">
        <label class="form-label">Move to folder</label>
        <select class="form-select" id="dx-move-folder">
          ${uploadFolders.map(f => `<option value="${escapeHTML(f)}"${f === state.folder ? ' selected' : ''}>${escapeHTML(f)}</option>`).join('')}
        </select>
      </div>`;
    showModal({
      title: `Move ${ids.length} document${ids.length === 1 ? '' : 's'}`,
      content,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
        { label: 'Move', className: 'btn-primary', onClick: c => {
          const folder = content.querySelector('#dx-move-folder').value;
          ids.forEach(id => store.update('documents', id, { folder }));
          state.selected.clear();
          loadData();
          refresh();
          showToast(`Moved ${ids.length} document${ids.length === 1 ? '' : 's'} to ${folder}`, 'success');
          c();
        }},
      ],
    });
  }

  function deleteSelected() {
    const sel = selectedDocs();
    const ids = sel.filter(d => d.entityType === 'Global').map(d => d.id);
    if (!ids.length) return;
    const skipped = sel.length - ids.length;
    showModal({
      title: 'Delete documents',
      content: `<p>Delete ${ids.length} uploaded document${ids.length === 1 ? '' : 's'}? This cannot be undone.</p>${skipped ? `<p class="text-secondary">${skipped} linked attachment${skipped === 1 ? '' : 's'} will be kept — remove those from their job or customer.</p>` : ''}`,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
        { label: 'Delete', className: 'btn-danger', onClick: c => {
          ids.forEach(id => store.delete('documents', id));
          state.selected.clear();
          loadData();
          refresh();
          showToast(`Deleted ${ids.length} document${ids.length === 1 ? '' : 's'}`, 'success');
          c();
        }},
      ],
    });
  }

  function upload() {
    const uploadFolders = visibleFolders.filter(f => f !== ROOT);
    const content = document.createElement('div');
    content.innerHTML = `
      <div class="form-group">
        <label class="form-label">Folder</label>
        <select class="form-select" id="upload-folder">
          ${uploadFolders.map(f => `<option value="${escapeHTML(f)}"${f === state.folder ? ' selected' : ''}>${escapeHTML(f)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Select file</label>
        <input type="file" class="form-input" id="upload-file-input" accept="image/*,.pdf,.doc,.docx" />
      </div>`;
    showModal({
      title: 'Upload document',
      content,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
        { label: 'Upload', className: 'btn-primary', onClick: (close) => {
          const fileInput = content.querySelector('#upload-file-input');
          const folder = content.querySelector('#upload-folder').value;
          if (!fileInput.files.length) { showToast('Please select a file', 'error'); return; }
          const file = fileInput.files[0];
          const reader = new FileReader();
          reader.onload = (e) => {
            const record = {
              name: file.name, type: file.type || 'unknown', size: file.size,
              url: e.target.result, folder, uploadedAt: new Date().toISOString(),
            };
            store.create('documents', record);
            showToast('Document uploaded', 'success');
            loadData();
            if (state.folder !== ROOT && state.folder !== folder) goTo(folder);
            state.selected = new Set(record.id ? [record.id] : []);
            refresh();
            close();
          };
          reader.readAsDataURL(file);
        }},
      ],
    });
  }

  // ---- Selection ------------------------------------------------------------

  function selectFromClick(id, e) {
    const additive = e.ctrlKey || e.metaKey;
    if (e.shiftKey && state.anchorId) {
      const ids = shown.map(d => d.id);
      const a = ids.indexOf(state.anchorId);
      const b = ids.indexOf(id);
      if (a !== -1 && b !== -1) {
        if (!additive) state.selected.clear();
        ids.slice(Math.min(a, b), Math.max(a, b) + 1).forEach(x => state.selected.add(x));
        refreshSelection();
        return;
      }
    }
    if (additive) {
      if (state.selected.has(id)) state.selected.delete(id); else state.selected.add(id);
    } else {
      state.selected = new Set([id]);
    }
    state.anchorId = id;
    refreshSelection();
  }

  function moveFocus(delta, extend) {
    if (!shown.length) return;
    const ids = shown.map(d => d.id);
    const current = [...state.selected].pop();
    let i = current ? ids.indexOf(current) : -1;
    i = Math.max(0, Math.min(ids.length - 1, i + delta));
    const id = ids[i];
    if (extend && state.anchorId) {
      const a = ids.indexOf(state.anchorId);
      state.selected = new Set(ids.slice(Math.min(a, i), Math.max(a, i) + 1));
      // Keep the moving end last so the next arrow press continues from it.
      state.selected.delete(id); state.selected.add(id);
    } else {
      state.selected = new Set([id]);
      state.anchorId = id;
    }
    refreshSelection();
    const el = container.querySelector(`#dx-main [data-id="${CSS.escape(id)}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  // ---- Context menu ---------------------------------------------------------

  function closeContextMenu() {
    if (contextMenu) { contextMenu.remove(); contextMenu = null; }
  }

  function showContextMenu(x, y) {
    closeContextMenu();
    const sel = selectedDocs();
    if (!sel.length) return;
    const one = sel.length === 1 ? sel[0] : null;
    const ts = toolbarState();
    const item = (act, icon, label, enabled = true, danger = false) =>
      `<button type="button" class="dropdown-item${danger ? ' text-danger' : ''}" data-ctx="${act}" ${enabled ? '' : 'disabled style="opacity:.45;pointer-events:none"'}><span class="material-icons-outlined" style="font-size:16px">${icon}</span> ${label}</button>`;

    contextMenu = document.createElement('div');
    contextMenu.className = 'dropdown-menu';
    contextMenu.style.cssText = `position:fixed;top:${y}px;left:${x}px;right:auto;z-index:var(--z-dropdown);min-width:200px;`;
    contextMenu.innerHTML = `
      ${item('view', 'visibility', 'View in new tab', ts.view)}
      ${item('download', 'download', sel.length > 1 ? `Download (${sel.filter(canDownload).length})` : 'Download', ts.download)}
      ${item('record', 'open_in_new', 'Open record in new tab', ts.record)}
      <div class="dropdown-divider"></div>
      ${item('move', 'drive_file_move', 'Move to…', ts.move)}
      ${item('delete', 'delete', 'Delete', ts.del, true)}`;
    document.body.appendChild(contextMenu);

    const rect = contextMenu.getBoundingClientRect();
    const pad = 8;
    if (rect.right > window.innerWidth - pad) contextMenu.style.left = `${Math.max(pad, x - rect.width)}px`;
    if (rect.bottom > window.innerHeight - pad) contextMenu.style.top = `${Math.max(pad, y - rect.height)}px`;

    contextMenu.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ctx]');
      if (!b) return;
      const act = b.dataset.ctx;
      closeContextMenu();
      if (act === 'view') viewDoc(one);
      else if (act === 'download') downloadDocs(sel);
      else if (act === 'record') openRecord(one);
      else if (act === 'move') moveSelected();
      else if (act === 'delete') deleteSelected();
    });
  }

  // ---- Wiring ---------------------------------------------------------------

  function wire() {
    const root = container.querySelector('.dx');

    root.addEventListener('click', (e) => {
      const folderBtn = e.target.closest('[data-folder]');
      if (folderBtn) { goTo(folderBtn.dataset.folder); return; }

      const sortBtn = e.target.closest('[data-sort]');
      if (sortBtn) {
        const k = sortBtn.dataset.sort;
        if (state.sortKey === k) state.sortDir *= -1;
        else { state.sortKey = k; state.sortDir = k === 'uploadedAt' || k === 'size' ? -1 : 1; }
        refresh();
        return;
      }

      const viewBtn = e.target.closest('[data-view]');
      if (viewBtn) {
        state.view = viewBtn.dataset.view;
        try { localStorage.setItem(VIEW_KEY, state.view); } catch { /* per-viewer nicety */ }
        refresh();
        return;
      }

      const actBtn = e.target.closest('[data-act]');
      if (actBtn) {
        e.stopPropagation();
        const act = actBtn.dataset.act;
        const doc = actBtn.dataset.id ? byId(actBtn.dataset.id) : null;
        switch (act) {
          case 'view': viewDoc(doc); break;
          case 'record': openRecord(doc); break;
          case 'download': downloadDocs([doc]); break;
          case 'view-selected': { const s = selectedDocs(); if (s.length === 1) viewDoc(s[0]); break; }
          case 'record-selected': { const s = selectedDocs(); if (s.length === 1) openRecord(s[0]); break; }
          case 'download-selected': downloadDocs(selectedDocs()); break;
          case 'move': moveSelected(); break;
          case 'delete': deleteSelected(); break;
          case 'upload': upload(); break;
          case 'back': window.history.back(); break;
          case 'forward': window.history.forward(); break;
          case 'up': goTo(ROOT); break;
        }
        return;
      }

      const item = e.target.closest('#dx-main [data-id]');
      if (item) { selectFromClick(item.dataset.id, e); return; }

      // Click on empty space in the file area clears the selection.
      if (e.target.closest('#dx-main') && state.selected.size) {
        state.selected.clear();
        refreshSelection();
      }
    });

    root.addEventListener('dblclick', (e) => {
      const item = e.target.closest('#dx-main [data-id]');
      if (item && !e.target.closest('[data-act]')) openDefault(byId(item.dataset.id));
    });

    root.addEventListener('contextmenu', (e) => {
      const item = e.target.closest('#dx-main [data-id]');
      if (!item) return;
      e.preventDefault();
      if (!state.selected.has(item.dataset.id)) {
        state.selected = new Set([item.dataset.id]);
        state.anchorId = item.dataset.id;
        refreshSelection();
      }
      showContextMenu(e.clientX, e.clientY);
    });

    root.addEventListener('keydown', (e) => {
      if (e.target.closest('input, select, textarea')) return;
      const tiles = state.view === 'tiles';
      const perRow = tiles ? tilesPerRow() : 1;
      if (e.key === 'ArrowDown') { e.preventDefault(); moveFocus(perRow, e.shiftKey); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moveFocus(-perRow, e.shiftKey); }
      else if (tiles && e.key === 'ArrowRight') { e.preventDefault(); moveFocus(1, e.shiftKey); }
      else if (tiles && e.key === 'ArrowLeft') { e.preventDefault(); moveFocus(-1, e.shiftKey); }
      else if (e.key === 'Enter') { const s = selectedDocs(); if (s.length === 1) openDefault(s[0]); }
      else if (e.key === 'Delete') { if (toolbarState().del) deleteSelected(); }
      else if (e.key === 'Backspace') { e.preventDefault(); goTo(ROOT); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        state.selected = new Set(shown.map(d => d.id));
        refreshSelection();
      } else if (e.key === 'Escape') { state.selected.clear(); refreshSelection(); }
    });

    const search = container.querySelector('#dx-search');
    search.addEventListener('input', () => { state.query = search.value; refresh(); });
    search.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { search.value = ''; state.query = ''; refresh(); }
    });

    document.addEventListener('mousedown', onDocMouseDown, true);
    window.addEventListener('scroll', closeContextMenu, true);
    window.addEventListener('hashchange', teardown);
  }

  function tilesPerRow() {
    const grid = container.querySelector('.dx-tiles');
    if (!grid) return 1;
    const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    return Math.max(1, cols);
  }

  function onDocMouseDown(e) {
    if (contextMenu && !contextMenu.contains(e.target)) closeContextMenu();
  }

  function teardown() {
    closeContextMenu();
    document.removeEventListener('mousedown', onDocMouseDown, true);
    window.removeEventListener('scroll', closeContextMenu, true);
    window.removeEventListener('hashchange', teardown);
  }

  render();
}
