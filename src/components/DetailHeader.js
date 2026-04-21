// ============================================
// SIMPRO CLONE — REUSABLE DETAIL HEADER
// ============================================

export function renderDetailHeader({ title, icon, iconBgColor = 'var(--color-primary-light)', iconTextColor = 'var(--color-primary)', metaHtml = '', actionsHtml = '' }) {
  return `
    <div class="detail-header">
      <div class="detail-header-info">
        <div class="detail-header-icon" style="background:${iconBgColor};color:${iconTextColor}">
          <span class="material-icons-outlined">${icon}</span>
        </div>
        <div>
          <div class="detail-header-text"><h2>${title}</h2></div>
          ${metaHtml ? `<div class="detail-header-meta">${metaHtml}</div>` : ''}
        </div>
      </div>
      <div class="flex gap-sm">
        ${actionsHtml}
      </div>
    </div>
  `;
}
