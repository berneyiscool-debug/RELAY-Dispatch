// ============================================
// SIMPRO CLONE — DOCUMENT VIEWER
// ============================================

import { escapeHTML } from '../../utils/security.js';

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

  if (!docData || !docData.url) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 40px; margin-top: 40px;">
        <span class="material-icons-outlined" style="font-size: 48px; color: var(--text-tertiary);">error_outline</span>
        <h3>Document Not Found</h3>
        <p class="text-secondary">The requested document could not be loaded or the session expired.</p>
        <button class="btn btn-primary" onclick="window.close()" data-tooltip="Close this tab and return to app" data-tooltip-pos="top" style="margin-top: 20px;">Close Tab</button>
      </div>
    `;
    return;
  }

  const isImage = docData.type && docData.type.startsWith('image/');
  const isPdf = docData.type === 'application/pdf' || docData.name.toLowerCase().endsWith('.pdf');

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; height: 100vh; background: var(--bg-color);">
      <div class="page-header" style="background: var(--content-bg); border-bottom: 1px solid var(--border-color); padding: 12px 24px; margin: 0;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; background: var(--bg-color); border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color);">
              <span class="material-icons-outlined" style="color: var(--color-primary);">${isImage ? 'image' : isPdf ? 'picture_as_pdf' : 'description'}</span>
            </div>
            <div>
              <h2 style="margin: 0; font-size: 16px;">${escapeHTML(docData.name || 'View Document')}</h2>
              <div class="text-secondary" style="font-size: 12px;">Read-Only View</div>
            </div>
          </div>
          <div>
            <button class="btn btn-secondary btn-sm" onclick="window.close()" data-tooltip="Close viewer tab" data-tooltip-pos="left">Close</button>
          </div>
        </div>
      </div>
      
      <div style="flex: 1; overflow: auto; display: flex; align-items: center; justify-content: center; padding: 24px;">
        ${isImage ? `
          <img src="${escapeHTML(docData.url)}" style="max-width: 100%; max-height: 100%; box-shadow: var(--shadow-md); border-radius: 4px;" alt="${escapeHTML(docData.name)}" />
        ` : isPdf ? `
          <iframe src="${escapeHTML(docData.url)}" style="width: 100%; height: 100%; border: none; box-shadow: var(--shadow-md); border-radius: 4px; background: white;"></iframe>
        ` : `
          <div class="card" style="padding: 40px; text-align: center; max-width: 400px;">
            <span class="material-icons-outlined" style="font-size: 48px; color: var(--text-tertiary); margin-bottom: 16px;">description</span>
            <h4>Cannot preview this file type</h4>
            <p class="text-secondary" style="margin-bottom: 24px;">This file type (${escapeHTML(docData.type || 'Unknown')}) cannot be previewed in the browser.</p>
            <a href="${escapeHTML(docData.url)}" download="${escapeHTML(docData.name)}" class="btn btn-primary" data-tooltip="Download document to computer" data-tooltip-pos="top">Download File</a>
          </div>
        `}
      </div>
    </div>
  `;
  
  // Make this full screen by hiding the standard app shell elements just for this route
  // In a real app we'd have a layout component, but here we can just modify the DOM
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
  
  // Cleanup on unmount (if they navigate away instead of closing)
  const cleanup = () => {
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
  };
  window.addEventListener('hashchange', cleanup);
}
