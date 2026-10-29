// ============================================
// RELAY — SAVED PDF FOLDER
// ============================================
// Every PDF the app makes (quotes, invoices, POs, forms, reports, documents) is
// saved into a folder the user picks once in Settings, sorted into a subfolder
// per kind, so they can be found again in File Explorer / Finder. The folder is
// remembered on this computer (its handle lives in IndexedDB, like the sync and
// backup folders). With no folder picked, or no browser support, PDFs download
// as normal.

import { showToast } from '../components/Notifications.js';

// Its own database rather than the company's, so the folder stays picked across
// sign-outs, company switches and the demo.
const DB_NAME = 'relay-pdf-folder';
const DB_STORE = 'config';
const CONFIG_KEY = 'pdf_directory_handle';

/** Subfolder each kind of PDF is saved into. */
export const PDF_SUBFOLDERS = {
  invoice: 'Invoices',
  quote: 'Quotes',
  po: 'Purchase Orders',
  form: 'Forms',
  'form-template': 'Form Templates',
  'tasklist-template': 'Task Lists',
  report: 'Reports',
  document: 'Documents',
};

let folderHandle = null;
let loaded = false;

let dbPromise = null;
function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE, { keyPath: 'key' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  }
  return dbPromise;
}

async function configStore(mode) {
  const db = await openDb();
  return db ? db.transaction(DB_STORE, mode).objectStore(DB_STORE) : null;
}

function request(req) {
  return new Promise((resolve) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

export function pdfFolderSupported() {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
}

/** The picked folder, or null. */
export async function getPdfFolder() {
  if (!loaded) {
    const cs = await configStore('readonly');
    const row = cs ? await request(cs.get(CONFIG_KEY)) : null;
    folderHandle = (row && row.value) || folderHandle;
    loaded = true;
  }
  return folderHandle;
}

async function permission(handle) {
  try { return await handle.queryPermission({ mode: 'readwrite' }); } catch { return 'denied'; }
}

/** { supported, name, permission } for the Settings card. */
export async function pdfFolderStatus() {
  const handle = pdfFolderSupported() ? await getPdfFolder() : null;
  return {
    supported: pdfFolderSupported(),
    name: handle ? handle.name : null,
    permission: handle ? await permission(handle) : null,
  };
}

/** Ask the user to pick the folder. Resolves false when they cancel. */
export async function choosePdfFolder() {
  let handle;
  try {
    handle = await window.showDirectoryPicker({ id: 'relay-pdfs', mode: 'readwrite' });
  } catch (err) {
    if (err && err.name === 'AbortError') return false;
    throw err;
  }
  folderHandle = handle;
  loaded = true;
  const cs = await configStore('readwrite');
  if (cs) await request(cs.put({ key: CONFIG_KEY, value: handle }));
  return true;
}

/** Forget the folder; PDFs download as normal again. */
export async function clearPdfFolder() {
  folderHandle = null;
  loaded = true;
  const cs = await configStore('readwrite');
  if (cs) await request(cs.delete(CONFIG_KEY));
}

/**
 * Make sure the folder can be written to. Browsers forget the permission
 * between sessions and only ask again from a click, so call this first thing
 * in the click handler, before the PDF is built.
 * @returns {Promise<boolean>} true when PDFs will go into the folder
 */
export async function preparePdfFolder() {
  const handle = pdfFolderSupported() ? await getPdfFolder() : null;
  if (!handle) return false;
  let state = await permission(handle);
  if (state === 'prompt') {
    try { state = await handle.requestPermission({ mode: 'readwrite' }); } catch { /* no click to ask from */ }
  }
  return state === 'granted';
}

function downloadBlob(blob, filename) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename || 'document.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before freeing the blob.
  setTimeout(() => URL.revokeObjectURL(href), 10000);
}

/**
 * Save a PDF into the folder's subfolder for its kind, or download it when no
 * folder is set up. A file with the same name is replaced, so the folder holds
 * the latest copy of each document.
 * @param {Blob} blob
 * @param {string} filename
 * @param {keyof PDF_SUBFOLDERS} kind
 * @param {{ quiet?: boolean }} [opts] quiet skips the "Saved to…" toast (bulk saves report once)
 * @returns {Promise<string|null>} where it was saved ("Folder/Invoices"), or null when downloaded
 */
export async function savePdf(blob, filename, kind, { quiet = false } = {}) {
  const handle = pdfFolderSupported() ? await getPdfFolder() : null;
  if (handle && await permission(handle) === 'granted') {
    try {
      const sub = PDF_SUBFOLDERS[kind] || PDF_SUBFOLDERS.document;
      const dir = await handle.getDirectoryHandle(sub, { create: true });
      const file = await dir.getFileHandle(filename, { create: true });
      const out = await file.createWritable();
      await out.write(blob);
      await out.close();
      const where = `${handle.name}/${sub}`;
      if (!quiet) showToast(`Saved ${filename} to ${where}`, 'success');
      return where;
    } catch (err) {
      console.warn('Saving into the PDF folder failed; downloading instead.', err);
      showToast("Couldn't save into your PDF folder, so it was downloaded instead", 'error');
    }
  } else if (handle) {
    showToast('Allow access to your PDF folder in Settings › Local Storage. Downloaded instead.', 'info');
  }
  downloadBlob(blob, filename);
  return null;
}
