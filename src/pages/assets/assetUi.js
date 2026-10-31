// ============================================
// RELAY — SHARED ASSET UI
// ============================================
// Pieces the asset list and the asset page both show, so they never disagree:
// the next-service badge and the label print dialog.

import { store } from '../../data/store.js';
import { escapeHTML } from '../../utils/security.js';
import { showModal } from '../../components/Modal.js';
import { showToast } from '../../components/Notifications.js';
import { formatLocalDate } from '../../utils/dateUtils.js';
import { LABEL_SIZES } from '../../utils/stockLabels.js';
import { ASSET_LABEL_FIELDS, loadAssetLabelOptions, saveAssetLabelOptions, buildAssetLabelSheetHtml, assetLabelCode } from '../../utils/assetLabels.js';
import { renderLabelCodes, openLabelWindow, printLabelSheet } from '../../utils/labelPrint.js';

const STATE_BADGES = {
  overdue: ['badge-danger', 'Overdue'],
  'due-soon': ['badge-warning', 'Due Soon'],
  ok: ['badge-success', 'OK'],
};

/**
 * Badge plus "when" for an assetServiceStatus() result.
 * @returns {string} HTML
 */
export function serviceStatusHtml(status, asset) {
  if (status.state === 'retired') return '<span class="text-tertiary" style="font-size:12px">Retired</span>';
  if (status.state === 'none') return '<span class="text-tertiary" style="font-size:12px">Not Scheduled</span>';
  const [badge, label] = STATE_BADGES[status.state];
  const when = status.dueKey
    ? formatLocalDate(status.dueKey, { day: 'numeric', month: 'short', year: 'numeric' })
    : `At ${status.meterTarget} ${escapeHTML(asset.meterUnit || 'hrs')}`;
  return `<span style="display:inline-flex;flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:4px 8px"><span class="badge ${badge}">${label}</span><span class="text-secondary" style="font-size:12px;white-space:nowrap">${when}</span></span>`;
}

function ownerName(asset) {
  if (asset.ownerType !== 'Customer') return 'My Business';
  const customer = asset.customerId ? store.getById('customers', asset.customerId) : null;
  return customer?.company || asset.customerName || 'Customer';
}

/** Choose sticker size and details, then print tags for the given assets. */
export function openAssetLabelPrint(assets) {
  const saved = loadAssetLabelOptions();
  const noSerial = assets.filter(a => !String(a.serial || a.identifier || '').trim()).length;
  const content = document.createElement('div');
  content.innerHTML = `
    <div class="form-group">
      <label class="form-label">Sticker size</label>
      <select class="form-select" id="label-size">
        ${LABEL_SIZES.map(s => `<option value="${s.key}"${s.key === saved.size ? ' selected' : ''}>${escapeHTML(s.label)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Show on each sticker</label>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px 16px;">
        ${ASSET_LABEL_FIELDS.map(f => `
          <label style="display:flex; align-items:center; gap:8px; font-size:13px; cursor:pointer;">
            <input type="checkbox" value="${f.key}"${saved.fields.includes(f.key) ? ' checked' : ''} /> ${escapeHTML(f.label)}
          </label>`).join('')}
      </div>
      <small class="text-tertiary" style="display:block; margin-top:8px;">
        The barcode and QR code carry the asset's serial number, or its record ID when it has none${noSerial ? ` (${noSerial === assets.length ? (noSerial === 1 ? 'this one' : 'all of these') : `${noSerial} of these`})` : ''}. Scanning one into search finds the asset.
      </small>
    </div>
  `;

  showModal({
    title: `Print Labels (${assets.length} asset${assets.length === 1 ? '' : 's'})`,
    content,
    actions: [
      { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
      { label: 'Print', className: 'btn-primary', onClick: async c => {
        const options = {
          size: content.querySelector('#label-size').value,
          fields: [...content.querySelectorAll('input[type="checkbox"]:checked')].map(el => el.value),
        };
        if (!options.fields.length) {
          showToast('Choose at least one thing to show on the stickers', 'error');
          return;
        }
        saveAssetLabelOptions(options);
        // Opened before the codes render so the popup still counts as
        // coming from this click.
        const printWindow = openLabelWindow();
        if (!printWindow) {
          showToast('Allow pop-ups to print labels', 'error');
          return;
        }
        c();
        const codes = await renderLabelCodes(assets.map(assetLabelCode), options.fields);
        printLabelSheet(printWindow, buildAssetLabelSheetHtml(assets, options, codes, ownerName));
      }}
    ]
  });
}
