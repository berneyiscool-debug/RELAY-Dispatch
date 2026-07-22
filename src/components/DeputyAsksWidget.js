import { store } from '../data/store.js';
import { parseAndExecuteActions } from './RelayAssistant.js';
import { router } from '../router.js';

export function renderDeputyAsksWidget(data, item) {
  // Listen for changes
  setTimeout(() => {
    const el = document.querySelector(`.dash-widget[data-instance-id="${item.instanceId}"]`);
    if (el && !el.dataset.asksBound) {
      el.dataset.asksBound = '1';
      store.on('deputyAsks', () => {
        if (window.__fieldForge && window.__fieldForge.reloadDashboard) {
          window.__fieldForge.reloadDashboard();
        }
      });
    }
    
    // Bind approve/dismiss actions
    if (el) {
      el.addEventListener('click', async (e) => {
        const approveBtn = e.target.closest('.btn-approve-ask');
        const dismissBtn = e.target.closest('.btn-dismiss-ask');
        
        if (approveBtn) {
          const askId = approveBtn.dataset.id;
          const ask = store.getById('deputyAsks', askId);
          if (ask) {
            approveBtn.disabled = true;
            approveBtn.innerHTML = `<span class="material-icons-outlined" style="font-size:14px; animation:spin 1s linear infinite;">autorenew</span> Executing...`;
            
            // Execute the action
            await parseAndExecuteActions(ask.proposedAction);
            
            // Mark as resolved
            store.update('deputyAsks', askId, { status: 'resolved', updated_at: new Date().toISOString() });
          }
        }
        
        if (dismissBtn) {
          const askId = dismissBtn.dataset.id;
          store.update('deputyAsks', askId, { status: 'dismissed', updated_at: new Date().toISOString() });
        }
      });
    }
  }, 0);

  const asks = store.getAll('deputyAsks') || [];
  const pendingAsks = asks.filter(a => a.status === 'pending').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (pendingAsks.length === 0) {
    return `<div style="padding: 24px 16px; text-align: center; color: var(--text-tertiary);">
      <span class="material-icons-outlined" style="font-size: 32px; opacity: 0.5; margin-bottom: 8px;">check_circle</span>
      <div>No pending proposals</div>
    </div>`;
  }

  return pendingAsks.map(ask => `
    <div style="padding: 12px; border-bottom: 1px solid var(--border-color); background: var(--bg-color);">
      <div style="display: flex; gap: 8px; margin-bottom: 4px;">
        <span class="material-icons-outlined" style="font-size: 16px; color: var(--color-primary); margin-top: 2px;">auto_awesome</span>
        <div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">${ask.title}</div>
      </div>
      <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.4; padding-left: 24px; margin-bottom: 8px;">
        ${ask.description}
      </div>
      <div style="display: flex; gap: 8px; padding-left: 24px;">
        <button class="btn btn-primary btn-sm btn-approve-ask" data-id="${ask.id}">Approve</button>
        <button class="btn btn-secondary btn-sm btn-dismiss-ask" data-id="${ask.id}">Dismiss</button>
      </div>
    </div>
  `).join('');
}
