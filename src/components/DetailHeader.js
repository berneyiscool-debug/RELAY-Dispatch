// ============================================
// RELAY DISPATCH — REUSABLE DETAIL HEADER
// ============================================

// `backPath`/`backLabel` are opt-in (named to match the sidebar's contextual
// back control): when set, a back button is rendered as the first element of the
// header. The header is markup only, so the caller binds the click — pages that
// need to confirm before leaving can intercept it.
export function renderDetailHeader({ title, icon, iconBgColor = 'var(--color-primary-light)', iconTextColor = 'var(--color-primary)', metaHtml = '', actionsHtml = '', backPath = '', backLabel = 'Back' }) {
  const backButton = backPath
    ? `<button type="button" class="btn btn-ghost btn-sm btn-icon btn-view-back" title="${backLabel}" aria-label="${backLabel}" style="padding:4px; min-width:34px; min-height:34px; flex-shrink:0"><span class="material-icons-outlined" style="font-size:18px">arrow_back</span></button>`
    : '';

  return `
    <div class="detail-header">
      <div class="detail-header-info">
        ${backButton}
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
