// ============================================
// RELAY — DOCUMENT CENTER EDITS
// ============================================
// Rename, duplicate and delete for the files the Document Center lists. Each
// entry carries a `source` saying where its file is kept:
//   { type: 'doc', id }                                   an uploaded document
//   { type: 'list', collection, recordId, index }         record.attachments[index]
//   { type: 'log', recordId, logId, fileIndex }           a file posted to a job's
//                                                         activity log (fileIndex
//                                                         null for the older
//                                                         single-file entries)
// Invoices, quotes, POs, forms and templates have no `source`: they are records,
// changed on their own pages, so only a copy of them can be made here.

import { store } from '../../data/store.js';

/** True when the entry's file can be renamed or deleted from the Document Center. */
export function canEditFile(doc) {
  return !!(doc && doc.source);
}

/** Folder a copy of a linked file or a rendered record is saved into. */
export const COPY_FOLDER = 'Company Docs';

/** "Report.pdf" → "Report - Copy.pdf", keeping the extension. */
export function copyName(name) {
  const n = String(name || 'Untitled');
  const m = /^(.*?)(\.[a-z0-9]{1,6})?$/i.exec(n);
  return `${m[1] || n} - Copy${m[2] || ''}`;
}

/**
 * The new name with the old extension kept when the user left it off, so a
 * rename of "photo.jpg" to "Site photo" stays a .jpg.
 */
export function withExtension(newName, oldName) {
  const name = String(newName || '').trim();
  const ext = /(\.[a-z0-9]{1,6})$/i.exec(String(oldName || ''));
  if (!ext || /\.[a-z0-9]{1,6}$/i.test(name)) return name;
  return `${name}${ext[1]}`;
}

function attachmentList(src) {
  const rec = store.getById(src.collection, src.recordId);
  if (!rec || !Array.isArray(rec.attachments) || !rec.attachments[src.index]) {
    throw new Error('The file is no longer on its record.');
  }
  return rec.attachments.map(a => ({ ...a }));
}

function activityLog(src) {
  const job = store.getById('jobs', src.recordId);
  const log = job && Array.isArray(job.activityLog) ? job.activityLog : null;
  const entry = log && log.find(l => l.id === src.logId);
  if (!entry) throw new Error('The file is no longer on its job.');
  return log.map(l => (l.id === src.logId
    ? { ...l, ...(l.files ? { files: l.files.map(f => ({ ...f })) } : {}), ...(l.file ? { file: { ...l.file } } : {}) }
    : l));
}

function logFile(entry, src) {
  return src.fileIndex === null || src.fileIndex === undefined ? entry.file : (entry.files || [])[src.fileIndex];
}

/** Rename the file behind a Document Center entry. */
export function renameFile(doc, newName) {
  const name = String(newName || '').trim();
  if (!name) throw new Error('Enter a name.');
  const src = doc.source;
  if (!src) throw new Error('This item is renamed on its own page.');

  if (src.type === 'doc') {
    store.update('documents', src.id, { name });
  } else if (src.type === 'list') {
    const list = attachmentList(src);
    list[src.index].name = name;
    store.update(src.collection, src.recordId, { attachments: list });
  } else if (src.type === 'log') {
    const log = activityLog(src);
    const file = logFile(log.find(l => l.id === src.logId), src);
    if (!file) throw new Error('The file is no longer on its job.');
    file.name = name;
    store.update('jobs', src.recordId, { activityLog: log });
  }
}

/**
 * Delete the files behind these entries. Entries without a `source` are skipped
 * and counted, so the caller can say why they stayed.
 * @returns {{deleted: number, skipped: number}}
 */
export function deleteFiles(docs) {
  let deleted = 0;
  let skipped = 0;
  const lists = new Map(); // `${collection}|${recordId}` → indexes to drop
  const logs = new Map();  // job id → [{ logId, fileIndex }]

  docs.forEach(doc => {
    const src = doc && doc.source;
    if (!src) { skipped++; return; }
    if (src.type === 'doc') {
      store.delete('documents', src.id);
      deleted++;
    } else if (src.type === 'list') {
      const key = `${src.collection}|${src.recordId}`;
      if (!lists.has(key)) lists.set(key, { src, indexes: [] });
      lists.get(key).indexes.push(src.index);
    } else if (src.type === 'log') {
      if (!logs.has(src.recordId)) logs.set(src.recordId, []);
      logs.get(src.recordId).push(src);
    }
  });

  // Several files on one record are removed in a single update, highest index
  // first so the earlier indexes still point at the right files.
  lists.forEach(({ src, indexes }) => {
    const list = attachmentList({ ...src, index: indexes[0] });
    [...new Set(indexes)].sort((a, b) => b - a).forEach(i => { list.splice(i, 1); deleted++; });
    store.update(src.collection, src.recordId, { attachments: list });
  });

  logs.forEach((srcs, jobId) => {
    let log = activityLog(srcs[0]);
    srcs.slice().sort((a, b) => (b.fileIndex ?? -1) - (a.fileIndex ?? -1)).forEach(src => {
      const entry = log.find(l => l.id === src.logId);
      if (!entry) return;
      if (src.fileIndex === null || src.fileIndex === undefined) {
        entry.file = null;
      } else if (Array.isArray(entry.files)) {
        entry.files.splice(src.fileIndex, 1);
      }
      deleted++;
    });
    // A post that was only these files goes with them; one with a note keeps the note.
    log = log.filter(l => {
      if (!srcs.some(s => s.logId === l.id)) return true;
      const hasFiles = l.file || (Array.isArray(l.files) && l.files.length);
      return !!(hasFiles || (l.content && String(l.content).trim()));
    });
    store.update('jobs', jobId, { activityLog: log });
  });

  return { deleted, skipped };
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error || new Error('The file could not be read.'));
    r.readAsDataURL(file);
  });
}

/**
 * Make a copy of an entry as an uploaded document. An uploaded document is
 * copied into its own folder; a linked file or a rendered record (invoice,
 * quote, PO, form) is saved into Company Docs, since its source cannot hold a
 * second copy.
 * @param {object} doc a Document Center entry
 * @param {(doc: object) => Promise<File>} toFile reads the entry's bytes
 * @returns {Promise<object>} the new document record
 */
export async function duplicateFile(doc, toFile) {
  const inPlace = doc.source && doc.source.type === 'doc';
  const original = inPlace ? store.getById('documents', doc.source.id) : null;
  const folder = inPlace ? (original?.folder || doc.folder) : COPY_FOLDER;

  let url = original?.url;
  let type = original?.type;
  let size = original?.size;
  let name = doc.name;
  if (!url) {
    const file = await toFile(doc);
    url = await readAsDataUrl(file);
    type = file.type || doc.type || 'application/octet-stream';
    size = file.size;
    name = file.name || doc.name;
  }

  return store.create('documents', {
    name: copyName(name),
    type: type || 'unknown',
    size: size ?? null,
    url,
    folder,
    uploadedAt: new Date().toISOString(),
  });
}
