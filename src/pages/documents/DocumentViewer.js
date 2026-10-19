// ============================================
// RELAY DISPATCH — DOCUMENT VIEWER
// ============================================

import { escapeHTML } from '../../utils/security.js';
import { store } from '../../data/store.js';
import { downloadDocument, resolveRenderable } from '../../utils/documentActions.js';
import { showToast } from '../../components/Notifications.js';
import { generateDocument, getPrintStyles } from '../../components/PrintPreview.js';
import { fontFaceCss } from '../../utils/fonts.js';

export function renderDocumentViewer(container) {
  let docData = null;
  try {
    const dataStr = localStorage.getItem('currentDocumentView');
    if (dataStr) {
      docData = JSON.parse(dataStr);
    }
  } catch (e) {
    console.error('Failed to parse document data:', e);
  }

  // Invoices, quotes and completed forms are drawn from their record as the
  // printed page, so there is no file URL to resolve.
  if (docData && docData.render) {
    const source = resolveRenderable(docData.render);
    if (source) {
      renderWithData({ ...docData, html: printableHtml(source) });
      return installCleanup();
    }
    docData = null;
  }

  if (!docData || !docData.url) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 40px; margin-top: 40px;">
        <span class="material-icons-outlined" style="font-size: 48px; color: var(--text-tertiary);">error_outline</span>
        <h3>Document Not Found</h3>
        <p class="text-secondary">The requested document could not be loaded or the session expired.</p>
        <button class="btn btn-primary" data-close-window data-tooltip="Close this tab and return to app" data-tooltip-pos="top" style="margin-top: 20px;">Close Tab</button>
      </div>
    `;
    return;
  }

  const isLocalRelative = docData.url && !docData.url.startsWith('data:') && !docData.url.startsWith('http');

  if (isLocalRelative) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; height: 100vh; background: var(--bg-color); justify-content: center; align-items: center;">
        <div class="spinner" style="margin-bottom: 20px; width: 40px; height: 40px; border: 4px solid var(--border-color); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <h3>Loading Local Document...</h3>
        <p class="text-secondary">Retrieving file from your local folder sync directory.</p>
      </div>
    `;

    if (!document.getElementById('spin-keyframes-style')) {
      const style = document.createElement('style');
      style.id = 'spin-keyframes-style';
      style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
    }

    store.getDocumentUrl(docData).then((resolvedUrl) => {
      renderWithData({ ...docData, url: resolvedUrl });
    }).catch((err) => {
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; height: 100vh; background: var(--bg-color); justify-content: center; align-items: center; padding: 40px; text-align: center;">
          <span class="material-icons-outlined" style="font-size: 48px; color: var(--color-danger); margin-bottom: 16px;">error_outline</span>
          <h3>Failed to Load Document</h3>
          <p class="text-secondary" style="max-width: 400px; margin-bottom: 20px;">
            ${escapeHTML(err.message || 'Could not access the local file directory. Please verify that folder sync is enabled and access is granted in settings.')}
          </p>
          <button class="btn btn-primary" data-close-window>Close Tab</button>
        </div>
      `;
    });
    installCleanup();
    return;
  }

  renderWithData(docData);
  installCleanup();

  function printableHtml({ type, data }) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8" />
      <style>${fontFaceCss()}</style>
      <style>${getPrintStyles(store.getSettings() || {})}</style>
      <style>html, body { background:#ffffff; margin:0; }</style>
    </head><body>${generateDocument(type, data)}</body></html>`;
  }

  // Saved HTML documents (e.g. from the print dialog) arrive as data: URLs.
  function decodeHtmlDataUrl(url) {
    const m = /^data:text\/html(;[^,]*)?,(.*)$/s.exec(url || '');
    if (!m) return null;
    try {
      return /;base64/.test(m[1] || '') ? atob(m[2]) : decodeURIComponent(m[2]);
    } catch {
      return null;
    }
  }

  function renderWithData(data) {
    const savedHtml = data.html ? null : decodeHtmlDataUrl(data.url);
    const page = data.html || savedHtml;
    const isImage = !page && data.type && data.type.startsWith('image/');
    const isPdf = !page && (data.type === 'application/pdf' || (data.name || '').toLowerCase().endsWith('.pdf'));
    const icon = page ? 'description' : isImage ? 'image' : isPdf ? 'picture_as_pdf' : 'description';

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; height: 100vh; background: var(--bg-color);">
        <div class="page-header" style="background: var(--content-bg); border-bottom: 1px solid var(--border-color); padding: 12px 24px; margin: 0;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex: 1; gap: 16px; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; background: var(--bg-color); border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color);">
                <span class="material-icons-outlined" style="color: var(--color-primary);">${icon}</span>
              </div>
              <div>
                <h2 style="margin: 0; font-size: 16px;">${escapeHTML(data.name || 'View Document')}</h2>
                <div class="text-secondary" style="font-size: 12px;">Read-Only View</div>
              </div>
            </div>
            <div class="doc-viewer-actions">
              ${page ? `<button class="btn btn-secondary btn-sm" id="doc-viewer-print" data-tooltip="Print this document" data-tooltip-pos="bottom"><span class="material-icons-outlined">print</span> Print</button>` : ''}
              <button class="btn btn-primary btn-sm" id="doc-viewer-download" data-tooltip="Download to this computer" data-tooltip-pos="bottom"><span class="material-icons-outlined">download</span> Download</button>
              <button class="btn btn-secondary btn-sm" data-close-window data-tooltip="Close viewer tab" data-tooltip-pos="left">Close</button>
            </div>
          </div>
        </div>
        
        <div style="flex: 1; overflow: auto; display: flex; align-items: center; justify-content: center; padding: 24px;">
          ${page ? `
            <iframe id="doc-viewer-page" title="${escapeHTML(data.name || 'Document')}" ${savedHtml ? 'sandbox="allow-same-origin allow-modals"' : ''} style="width: 210mm; max-width: 100%; height: 100%; border: none; box-shadow: var(--shadow-md); border-radius: 4px; background: white;"></iframe>
          ` : isImage ? `
            <img src="${escapeHTML(data.url)}" style="max-width: 100%; max-height: 100%; box-shadow: var(--shadow-md); border-radius: 4px;" alt="${escapeHTML(data.name)}" />
          ` : isPdf ? `
            <iframe src="${escapeHTML(data.url)}" style="width: 100%; height: 100%; border: none; box-shadow: var(--shadow-md); border-radius: 4px; background: white;"></iframe>
          ` : `
            <div class="card" style="padding: 40px; text-align: center; max-width: 400px;">
              <span class="material-icons-outlined" style="font-size: 48px; color: var(--text-tertiary); margin-bottom: 16px;">description</span>
              <h4>Cannot preview this file type</h4>
              <p class="text-secondary" style="margin-bottom: 24px;">This file type (${escapeHTML(data.type || 'Unknown')}) cannot be previewed in the browser.</p>
              <button class="btn btn-primary" data-viewer-download data-tooltip="Download document to computer" data-tooltip-pos="top">Download File</button>
            </div>
          `}
        </div>
      </div>
    `;

    const frame = container.querySelector('#doc-viewer-page');
    if (frame) frame.srcdoc = page;
    const printBtn = container.querySelector('#doc-viewer-print');
    if (printBtn && frame) printBtn.addEventListener('click', () => frame.contentWindow.print());

    // Download the original record rather than the resolved URL, so local-sync
    // files are re-read and storage URLs are fetched as a blob with the real name.
    container.querySelectorAll('#doc-viewer-download, [data-viewer-download]').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          await downloadDocument(docData);
        } catch (err) {
          showToast(`Could not download: ${err.message || err}`, 'error');
        } finally {
          btn.disabled = false;
        }
      });
    });

    // Make this full screen by hiding the standard app shell elements just for this route
    setTimeout(() => {
      const sidebar = document.querySelector('.sidebar');
      const topbar = document.querySelector('.topbar');
      const breadcrumb = document.getElementById('breadcrumb');
      const mainContent = document.getElementById('main-content');
      
      if (sidebar) sidebar.style.display = 'none';
      if (topbar) topbar.style.display = 'none';
      if (breadcrumb) breadcrumb.style.display = 'none';
      if (mainContent) {
        mainContent.style.padding = '0';
        mainContent.style.height = '100vh';
        mainContent.style.overflow = 'hidden';
      }
    }, 0);
  }
  
  // Cleanup on unmount (if they navigate away instead of closing)
  function installCleanup() {
    window.addEventListener('hashchange', cleanup);
  }

  function cleanup() {
    const sidebar = document.querySelector('.sidebar');
    const topbar = document.querySelector('.topbar');
    const breadcrumb = document.getElementById('breadcrumb');
    const mainContent = document.getElementById('main-content');
    
    if (sidebar) sidebar.style.display = '';
    if (topbar) topbar.style.display = '';
    if (breadcrumb) breadcrumb.style.display = '';
    if (mainContent) {
      mainContent.style.padding = '';
      mainContent.style.height = '';
      mainContent.style.overflow = '';
    }
    window.removeEventListener('hashchange', cleanup);
  }
}
