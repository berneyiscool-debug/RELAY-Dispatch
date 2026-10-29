// ============================================
// RELAY — SAVED PDFS FOLDER (Settings card)
// ============================================
// Pick the folder every PDF the app makes is saved into. Remembered on this
// computer; see utils/pdfFolder.js.

import { escapeHTML } from '../utils/security.js';
import { showToast } from './Notifications.js';
import { PDF_SUBFOLDERS, pdfFolderStatus, choosePdfFolder, clearPdfFolder, preparePdfFolder } from '../utils/pdfFolder.js';

const SHOWN_SUBFOLDERS = ['quote', 'invoice', 'po', 'form', 'report', 'document'];

export function renderPdfFolderCard(host) {
  async function render() {
    const status = await pdfFolderStatus();
    const subfolders = SHOWN_SUBFOLDERS.map(k => `<code>${escapeHTML(PDF_SUBFOLDERS[k])}</code>`).join(', ');

    let body;
    if (!status.supported) {
      body = `
        <p class="text-secondary" style="margin:0; line-height:1.5;">
          This browser can't save into a folder, so PDFs go to your Downloads folder. Use Chrome, Edge or the RELAY desktop app to pick a folder.
        </p>`;
    } else if (!status.name) {
      body = `
        <div style="display:flex; align-items:center; gap:8px; color:var(--text-secondary);">
          <span class="material-icons-outlined" style="color:var(--text-tertiary);">folder_off</span>
          <span>No folder picked. PDFs go to your Downloads folder.</span>
        </div>
        <div><button class="btn btn-primary" id="btn-pdf-folder-pick"><span class="material-icons-outlined">folder</span> Choose PDF Folder…</button></div>
        <p class="text-tertiary" style="margin:0; font-size:12px; line-height:1.5;">
          Pick a folder <em>inside</em> Documents, Desktop or OneDrive (for example <code>Documents\\RELAY PDFs</code>). Browsers don't let apps use Desktop, Documents, Downloads or your user folder themselves.
        </p>`;
    } else {
      const needsAccess = status.permission !== 'granted';
      body = `
        <div style="background:${needsAccess ? 'var(--color-warning-bg)' : 'var(--color-success-bg)'}; border-left:4px solid ${needsAccess ? 'var(--color-warning)' : 'var(--color-success)'}; padding:10px 12px; border-radius:4px; line-height:1.5;">
          <strong>${escapeHTML(status.name)}</strong><br/>
          <span class="text-secondary">${needsAccess
            ? 'Your browser asks again each session. It will ask the next time you save a PDF, or allow it now.'
            : 'PDFs you save go into this folder.'}</span>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          ${needsAccess ? '<button class="btn btn-warning" id="btn-pdf-folder-allow"><span class="material-icons-outlined">vpn_key</span> Allow Access</button>' : ''}
          <button class="btn btn-secondary" id="btn-pdf-folder-pick"><span class="material-icons-outlined">folder</span> Change Folder…</button>
          <button class="btn btn-ghost" id="btn-pdf-folder-clear" style="color:var(--color-danger);"><span class="material-icons-outlined">link_off</span> Stop Using</button>
        </div>`;
    }

    host.innerHTML = `
      <div class="card" style="max-width:100%; margin-bottom:var(--space-lg);">
        <div class="card-header" style="display:flex; align-items:center; gap:8px;">
          <span class="material-icons-outlined" style="color:var(--color-primary)">picture_as_pdf</span>
          <h4 style="margin:0;">Saved PDFs</h4>
        </div>
        <div class="card-body" style="display:flex; flex-direction:column; gap:12px;">
          <p class="text-secondary" style="margin:0; line-height:1.5;">
            Every PDF you save from RELAY (quotes, invoices, purchase orders, forms, reports and documents) goes into this folder, sorted into ${subfolders}. Saving the same document again replaces the older copy. The folder is remembered on this computer.
          </p>
          ${body}
        </div>
      </div>`;

    host.querySelector('#btn-pdf-folder-pick')?.addEventListener('click', async () => {
      try {
        if (await choosePdfFolder()) {
          showToast('PDF folder set', 'success');
        } else {
          showToast("No folder was set. Your browser won't let apps use Desktop, Documents, Downloads or your user folder directly. Make a folder inside one of them (e.g. Documents\\RELAY PDFs) and pick that.", 'info', 9000);
        }
      } catch (err) {
        console.error('Choosing the PDF folder failed:', err);
        showToast(`Couldn't use that folder: ${err.message || err}`, 'error');
      }
      render();
    });
    host.querySelector('#btn-pdf-folder-allow')?.addEventListener('click', async () => {
      if (!(await preparePdfFolder())) showToast('Access was not allowed', 'error');
      render();
    });
    host.querySelector('#btn-pdf-folder-clear')?.addEventListener('click', async () => {
      await clearPdfFolder();
      showToast('PDFs will go to your Downloads folder', 'info');
      render();
    });
  }

  render();
}
