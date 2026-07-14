import { supabase } from '../../utils/supabase.js';
import { storageGet, storageSet } from '../../utils/tauriStore.js';
import { applyTheme } from '../../utils/theme.js';

const logoLarge = new URL('../../assets/RELAY_Dispatch_Logo.png', import.meta.url).href;


// Preset colors for local account avatars
const AVATAR_COLORS = [
  '#FF5C00', // Antigravity orange
  '#1B6DE0', // Blue
  '#16A34A', // Green
  '#9333EA', // Purple
  '#DC2626', // Red
  '#D97706', // Amber
  '#0891B2', // Cyan
  '#DB2777', // Pink
];

// Helper to hash password using SHA-256 Web Crypto API
async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper for relative time formatting
function formatRelativeTime(dateString) {
  if (!dateString) return 'Never used';
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

// HTML escaped helper
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const RELAY_LOGO_SVG = `<svg viewBox="0 0 75.592812 53.598302" style="width: 100%; height: 100%;" xmlns="http://www.w3.org/2000/svg"><g fill="#FF5C00"><g transform="translate(-19.023693,-210.20382)"><g transform="matrix(0.3804654,0,0,0.3804654,-83.598864,122.48096)"><g transform="translate(107.79013)"><g transform="translate(-22.948867,-9.0404629)"><path d="m 267.58275,347.28778 q 0.0535,9.78228 1.22947,17.15908 q 1.22947,7.3768 3.74185,11.27903 -2.40547,2.29856 -7.16298,3.42112 -4.7575,1.17601 -7.69753,1.17601 -9.515,-0.10691 -13.31031,-7.10952 -3.31422,-6.20079 -3.31422,-15.92962 0,-1.28292 0.26728,-7.64407 q 0.26728,-6.41461 3.52803,-20.04566 q 3.26076,-13.63104 7.80445,-26.94136 q 4.54368,-13.31031 8.87354,-23.94787 q 1.22947,-0.10691 2.45893,-0.10691 q 2.56585,0 5.39897,0.58801 q 2.83311,0.588 4.32986,4.16949 q 0.69491,1.65711 0.69491,4.38332 0,3.15385 -0.90873,7.64407 -2.19166,10.26338 -3.63495,20.63366 q 1.28292,0.64147 2.72621,0.64147 q 2.88657,0 7.3768,-3.1004 q 4.49023,-3.10039 8.49936,-9.62191 q 3.79531,-6.09388 3.79531,-12.34813 v -0.80182 q -1.12256,-11.33248 -7.69753,-14.80706 -3.74186,-1.97784 -8.44591,-1.97784 -3.58149,0 -10.47719,1.87093 q -6.84225,1.81747 -16.94526,8.71318 q -10.04955,6.8957 -18.17473,16.3038 q -8.07171,9.35464 -11.6532,19.5111 -1.92439,5.29205 -1.92439,10.31683 0,4.54368 1.60366,8.87354 -5.66624,0.96219 -10.37029,0.96219 -6.41461,0 -12.82922,-2.40547 -6.36115,-2.45894 -9.14081,-9.03391 -1.33638,-3.26076 -1.33638,-6.89571 0,-3.6884 1.38983,-7.80444 q 4.00913,-10.53065 18.01436,-22.07694 q 14.05869,-11.59976 34.05089,-20.36639 q 20.04565,-8.76663 42.06914,-10.90484 q 2.56584,-0.16036 4.97132,-0.16036 q 11.38593,0 19.77838,4.59714 q 8.4459,4.59713 12.6154,13.47068 q 3.84877,8.07171 3.84877,17.42635 0,0.80183 -0.21382,6.36116 -0.16037,5.55932 -4.49023,14.91396 q -4.32986,9.30119 -12.1343,15.34161 -7.80444,6.04042 -18.49546,6.46806 q 8.87354,6.41461 19.5111,7.10953 q 1.17601,0.0534 2.35203,0.0534 9.67537,0 20.90093,-5.07823 0.26728,3.79531 0.26728,7.10953 0,9.0339 -2.35203,16.14343 q -2.35202,7.10952 -7.32334,10.90484 -4.97132,3.79531 -10.63756,4.49022 -2.13821,0.26728 -4.11604,0.26728 -3.42113,0 -6.46807,-0.74837 -5.8266,-1.38984 -11.38593,-6.20079 q -5.50587,-4.7575 -10.47719,-11.65321 q -4.91787,-6.8957 -8.98046,-14.59324 z" /><path d="m 370.43971,354.90523 -15.22212,-9.62244 -16.8901,6.24731 4.44762,-17.45058 -11.16089,-14.13291 17.97088,-1.16261 9.9923,-14.98194 6.659,16.73206 17.33647,4.87357 -13.85539,11.50358 z" /><path d="m 348.39147,304.71497 -3.17554,-13.39823 -12.4452,-5.89179 11.76117,-7.16041 1.75766,-13.65677 10.44434,8.97286 13.53148,-2.54853 -5.30619,12.70593 6.60527,12.08167 -13.72376,-1.12015 z" /><path d="m 334.8158,263.90614 -5.7247,-6.06772 -8.31437,0.67863 4.00173,-7.31954 -3.21471,-7.6977 8.19789,1.544 6.32758,-5.43609 1.06484,8.27379 7.12538,4.33803 -7.53978,3.56946 z" /></g></g></g></g></svg>`;

export function renderLaunchScreen(container, onComplete) {
  // Reset active themes to default for clean canvas
  applyTheme(null);

  // Hide the standard app shell elements
  const sidebar = document.querySelector('.sidebar');
  const topbar = document.querySelector('.topbar');
  const breadcrumb = document.getElementById('breadcrumb');

  if (sidebar) sidebar.style.display = 'none';
  if (topbar) topbar.style.display = 'none';
  if (breadcrumb) breadcrumb.style.display = 'none';

  // Force the main-content container to be full screen without default app padding or spacing class
  if (container) {
    container.style.padding = '0';
    container.classList.remove('non-dashboard-schedule-page');
  }

  // State variables
  let cloudView = 'signin'; // 'signin' | 'signup'
  let accounts = [];
  let isCreatingLocalAccount = false;
  let activePasswordPromptId = null;
  let activeAuthMode = 'cloud'; // 'cloud' | 'local'
  let pendingLocalDirHandle = null;
  let majoritySide = 'left'; // 'left' | 'right'

  // Injected scoped styles
  const styles = `
    .launch-screen {
      display: flex;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(135deg, #FFEBE3 0%, #F5F7FF 50%, #E6EEFF 100%);
      color: #1e293b;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      overflow: hidden;
      box-sizing: border-box;
      position: relative;
    }
    @media (max-width: 960px) {
      .launch-screen {
        flex-direction: column;
        height: auto;
        min-height: 100vh;
        overflow-y: auto;
      }
    }
    .launch-bg-glow {
      position: absolute;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 92, 0, 0.15) 0%, rgba(255, 92, 0, 0) 70%);
      top: -150px;
      right: -100px;
      z-index: 0;
      pointer-events: none;
      filter: blur(40px);
    }
    .launch-bg-glow-2 {
      position: absolute;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(27, 109, 224, 0.12) 0%, rgba(27, 109, 224, 0) 75%);
      bottom: -200px;
      left: -150px;
      z-index: 0;
      pointer-events: none;
      filter: blur(50px);
    }
    .launch-panel {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 24px 36px;
      box-sizing: border-box;
      overflow-y: auto;
      z-index: 1;
      position: relative;
      min-width: 0;
      background: rgba(255, 255, 255, 0.35);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }
    .launch-panel-left {
      border-right: 1px solid rgba(0, 0, 0, 0.08);
      transition: flex 0.5s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s;
    }
    .launch-panel-right {
      transition: flex 0.5s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s;
    }
    
    /* Active/Collapsed indicators and selectors */
    .launch-panel-indicator {
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      height: 100%;
      width: 100%;
      box-sizing: border-box;
    }
    .launch-panel-indicator .indicator-icon {
      font-size: 24px;
      color: #FF5C00;
      background: rgba(255, 92, 0, 0.1);
      padding: 10px;
      border-radius: 50%;
      transition: transform 0.3s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .launch-panel.collapsed:hover .launch-panel-indicator .indicator-icon {
      transform: scale(1.1);
    }
    .indicator-text {
      writing-mode: vertical-rl;
      text-orientation: mixed;
      transform: rotate(180deg);
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #475569;
      white-space: nowrap;
      margin-top: 12px;
    }
    .indicator-arrow {
      display: none;
    }

    @media (min-width: 961px) {
      .launch-screen.majority-left .launch-panel-left {
        flex: 1 1 0% !important;
        background: rgba(255, 255, 255, 0.35) !important;
      }
      .launch-screen.majority-left .launch-panel-right {
        flex: 0 0 60px !important;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.15) !important;
        border-left: 1px solid rgba(0, 0, 0, 0.06);
        padding: 40px 10px !important;
      }
      .launch-screen.majority-left .launch-panel-right .launch-panel-content {
        display: none !important;
      }
      .launch-screen.majority-left .launch-panel-right .launch-panel-indicator {
        display: flex !important;
      }

      .launch-screen.majority-right .launch-panel-right {
        flex: 1 1 0% !important;
        background: rgba(255, 255, 255, 0.35) !important;
      }
      .launch-screen.majority-right .launch-panel-left {
        flex: 0 0 60px !important;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.15) !important;
        border-right: 1px solid rgba(0, 0, 0, 0.06);
        padding: 40px 10px !important;
      }
      .launch-screen.majority-right .launch-panel-left .launch-panel-content {
        display: none !important;
      }
      .launch-screen.majority-right .launch-panel-left .launch-panel-indicator {
        display: flex !important;
      }
    }

    @media (max-width: 960px) {
      .launch-screen {
        flex-direction: column !important;
        height: 100vh !important;
        overflow: hidden !important;
      }
      .launch-panel {
        padding: 16px 12px !important;
        transition: flex 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        box-sizing: border-box;
      }
      .launch-panel-left {
        border-right: none;
      }
      
      /* Mobile active/collapsed logic */
      .launch-screen.majority-left .launch-panel-left {
        flex: 1 1 0% !important;
        overflow-y: auto;
      }
      .launch-screen.majority-left .launch-panel-right {
        flex: 0 0 54px !important;
        overflow: hidden !important;
        background: rgba(255, 255, 255, 0.25) !important;
        border-top: 1px solid rgba(0, 0, 0, 0.06);
        cursor: pointer;
        padding: 12px 16px !important;
      }
      .launch-screen.majority-left .launch-panel-right .launch-panel-content {
        display: none !important;
      }
      .launch-screen.majority-left .launch-panel-right .launch-panel-indicator {
        display: flex !important;
        flex-direction: row !important;
        justify-content: space-between !important;
        align-items: center !important;
        height: 100% !important;
        width: 100% !important;
      }
      
      .launch-screen.majority-right .launch-panel-right {
        flex: 1 1 0% !important;
        overflow-y: auto;
      }
      .launch-screen.majority-right .launch-panel-left {
        flex: 0 0 54px !important;
        overflow: hidden !important;
        background: rgba(255, 255, 255, 0.25) !important;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        cursor: pointer;
        padding: 12px 16px !important;
      }
      .launch-screen.majority-right .launch-panel-left .launch-panel-content {
        display: none !important;
      }
      .launch-screen.majority-right .launch-panel-left .launch-panel-indicator {
        display: flex !important;
        flex-direction: row !important;
        justify-content: space-between !important;
        align-items: center !important;
        height: 100% !important;
        width: 100% !important;
      }
      
      /* Reset vertical rotated text on mobile */
      .indicator-text {
        writing-mode: horizontal-tb !important;
        text-orientation: unset !important;
        transform: none !important;
        font-size: 13px !important;
        margin: 0 !important;
      }
      .launch-panel-indicator .indicator-icon {
        padding: 6px !important;
        font-size: 18px !important;
      }
      .indicator-arrow {
        display: inline-block;
        color: #475569;
        font-size: 20px !important;
      }
    }

    .launch-panel-content {
      max-width: 420px;
      width: 100%;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
    }
    
    /* We hide the sliding divider button as we have the interactive collapsed sidebars */
    .launch-divider {
      display: none !important;
    }

    .launch-title {
      font-size: 22px;
      font-weight: 800;
      margin: 0 0 4px 0;
      letter-spacing: -0.025em;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #0f172a !important;
    }
    .launch-subtitle {
      font-size: 12.5px;
      color: #475569;
      margin: 0 0 14px 0;
      line-height: 1.5;
      text-align: center;
    }
    .launch-feature-list {
      margin: 16px 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .launch-feature-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: #475569;
    }
    .launch-feature-item.soon {
      opacity: 0.5;
    }
    .launch-feature-badge {
      background: rgba(255, 92, 0, 0.1);
      color: #FF5C00;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .launch-form-group {
      margin-bottom: 10px;
    }
    .launch-form-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 4px;
      text-align: left;
    }
    .launch-input-wrapper {
      position: relative;
    }
    .launch-input-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #64748b;
      font-size: 18px;
    }
    .launch-input {
      width: 100%;
      padding: 8px 12px 8px 34px;
      background-color: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 8px;
      color: #0f172a;
      font-size: 13px;
      box-sizing: border-box;
      transition: border-color 0.2s, background-color 0.2s;
    }
    .launch-input:focus {
      outline: none;
      border-color: #FF5C00;
      background-color: #ffffff;
    }
    .launch-btn {
      width: 100%;
      padding: 9px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      border: none;
      transition: background-color 0.2s, transform 0.1s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .launch-btn:active {
      transform: scale(0.98);
    }
    .launch-btn-primary {
      background-color: #FF5C00;
      color: white;
    }
    .launch-btn-primary:hover {
      background-color: #e04f00;
    }
    .launch-btn-secondary {
      background-color: rgba(255, 255, 255, 0.6);
      border: 1px solid rgba(0, 0, 0, 0.12);
      color: #0f172a;
    }
    .launch-btn-secondary:hover {
      background-color: rgba(255, 255, 255, 0.9);
    }
    .account-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 24px;
    }
    .account-item-wrapper {
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 8px;
      overflow: hidden;
      background-color: rgba(255, 255, 255, 0.5);
      transition: border-color 0.2s, background-color 0.2s;
    }
    .account-item-wrapper:hover {
      border-color: #94a3b8;
      background-color: rgba(255,255,255,0.8);
    }
    .account-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px;
      cursor: pointer;
      user-select: none;
    }
    .account-details {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .account-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: white;
      font-size: 16px;
    }
    .account-name {
      font-weight: 600;
      font-size: 14px;
      margin: 0 0 2px 0;
      text-align: left;
      color: #0f172a;
    }
    .account-meta {
      font-size: 11px;
      color: #64748b;
      text-align: left;
    }
    .account-icon {
      color: #64748b;
      font-size: 20px;
    }
    .password-prompt-box {
      background-color: rgba(0,0,0,0.03);
      border-top: 1px solid rgba(0, 0, 0, 0.08);
      padding: 12px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .password-prompt-input {
      flex: 1;
      padding: 8px 12px;
      background-color: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 6px;
      color: #0f172a;
      font-size: 13px;
    }
    .password-prompt-input:focus {
      outline: none;
      border-color: #FF5C00;
    }
    .password-prompt-btn {
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
    }
    .password-prompt-submit {
      background-color: #FF5C00;
      color: white;
    }
    .password-prompt-submit:hover {
      background-color: #e04f00;
    }
    .password-prompt-cancel {
      background: transparent;
      color: #64748b;
    }
    .password-prompt-cancel:hover {
      color: #0f172a;
    }
    .new-account-form {
      border: 1px dashed rgba(0, 0, 0, 0.15);
      border-radius: 8px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: rgba(255, 255, 255, 0.2);
    }
    .store-badges {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }
    .store-badge-placeholder {
      height: 36px;
      width: 120px;
      border-radius: 6px;
      border: 1px solid rgba(0, 0, 0, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      color: #475569;
      background: rgba(255,255,255,0.4);
      text-transform: uppercase;
    }
    .auth-error {
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 8px;
      padding: 12px;
      color: #ef4444;
      font-size: 13px;
      margin-bottom: 16px;
      line-height: 1.4;
    }
  `;

  // Inject style block
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  const init = async () => {
    accounts = await storageGet('relay_accounts') || [];

    // Self-heal: if the local account index was lost (e.g. localStorage was cleared
    // during an app update) but per-account data still lives in IndexedDB, rebuild the
    // account list from the surviving databases so local businesses are never orphaned.
    if (accounts.length === 0 && typeof indexedDB !== 'undefined' && indexedDB.databases) {
      try {
        const dbs = await indexedDB.databases();
        const recovered = [];
        (dbs || []).forEach((info) => {
          const match = info && info.name && info.name.match(/^RelayDispatchDB_(acct_[A-Za-z0-9]+)$/);
          if (!match) return;
          recovered.push({
            id: match[1],
            businessName: 'Recovered Business',
            avatarColor: AVATAR_COLORS[recovered.length % AVATAR_COLORS.length],
            createdAt: new Date().toISOString(),
            lastAccessedAt: new Date().toISOString(),
            hasPassword: false,
            passwordHash: null
          });
        });
        if (recovered.length > 0) {
          accounts = recovered;
          await storageSet('relay_accounts', accounts);
          console.warn(`RELAY: recovered ${recovered.length} local business account(s) from IndexedDB.`);
        }
      } catch (e) {
        console.error('RELAY: account recovery failed:', e);
      }
    }
    // Sort accounts: lastAccessedAt descending, then createdAt descending
    accounts.sort((a, b) => {
      const timeA = new Date(a.lastAccessedAt || a.createdAt).getTime();
      const timeB = new Date(b.lastAccessedAt || b.createdAt).getTime();
      return timeB - timeA;
    });
    render();
  };

  const render = () => {
    container.innerHTML = `
      <div class="launch-screen majority-${majoritySide}">
        <div class="launch-bg-glow"></div>
        <div class="launch-bg-glow-2"></div>

        <!-- Left Column: Auth (Cloud / Local) -->
        <div class="launch-panel launch-panel-left ${majoritySide === 'right' ? 'collapsed' : ''}">
          <!-- Collapsed indicator -->
          <div class="launch-panel-indicator">
            <span class="material-icons-outlined indicator-icon">cloud</span>
            <span class="indicator-text">Cloud &amp; Local Services</span>
            <span class="material-icons-outlined indicator-arrow">keyboard_arrow_up</span>
          </div>

          <div class="launch-panel-content">
            <div style="max-height: 36px; max-width: 200px; margin: 0 auto 16px auto; display: flex; justify-content: center; align-items: center;">
              <img src="${logoLarge}" alt="Dispatch Logo" style="max-height: 36px; max-width: 200px; object-fit: contain; display: block;" />
            </div>

            <!-- Toggle between Cloud and Local Services -->
            <div class="auth-mode-toggle" style="display: flex; gap: 8px; margin-bottom: 16px; background: rgba(0, 0, 0, 0.04); padding: 4px; border-radius: 8px; border: 1px solid rgba(0, 0, 0, 0.08);">
              <button class="toggle-tab" id="btn-toggle-cloud" style="flex: 1; padding: 6px 10px; border: none; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px; background: ${activeAuthMode === 'cloud' ? '#FF5C00' : 'transparent'}; color: ${activeAuthMode === 'cloud' ? '#ffffff' : '#475569'};">
                <span class="material-icons-outlined" style="font-size: 14px;">cloud_queue</span>
                <span>Cloud Services</span>
              </button>
              <button class="toggle-tab" id="btn-toggle-local" style="flex: 1; padding: 6px 10px; border: none; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px; background: ${activeAuthMode === 'local' ? '#FF5C00' : 'transparent'}; color: ${activeAuthMode === 'local' ? '#ffffff' : '#475569'};">
                <span class="material-icons-outlined" style="font-size: 14px;">computer</span>
                <span>Local Services</span>
              </button>
            </div>

            ${activeAuthMode === 'cloud' 
              ? (cloudView === 'signin' ? renderCloudSignInHTML() : renderCloudSignUpHTML())
              : renderLocalServicesSignInHTML()
            }
          </div>
        </div>

        <!-- Sliding Divider with Arrow Button (hidden visually, active for layout compatibility) -->
        <div class="launch-divider">
          <button class="launch-divider-btn" id="btn-slide-divider" title="Slide divider">
            <span class="material-icons-outlined">${majoritySide === 'left' ? 'chevron_left' : 'chevron_right'}</span>
          </button>
        </div>

        <!-- Right Column: Local DB selection (Local Admin side) -->
        <div class="launch-panel launch-panel-right ${majoritySide === 'left' ? 'collapsed' : ''}">
          <!-- Collapsed indicator -->
          <div class="launch-panel-indicator">
            <span class="material-icons-outlined indicator-icon">shield</span>
            <span class="indicator-text">Local Admin Mode</span>
            <span class="material-icons-outlined indicator-arrow">keyboard_arrow_down</span>
          </div>

          <div class="launch-panel-content">
            <h2 class="launch-title">
              <span class="material-icons-outlined" style="font-size: 22px; color: #64748b;">shield</span> Local Admin
            </h2>
            <p class="launch-subtitle">Single-user offline admin mode. Your data is stored locally on this machine.</p>

            ${renderLocalAccountsHTML()}
          </div>

          <!-- Description when empty -->
          ${accounts.length === 0 && !isCreatingLocalAccount ? `
            <div class="launch-panel-content" style="text-align: center; color: #64748b; font-size: 13px; margin-top: 16px;">
              No setup required. Click "New local account" to get started.
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Attach event listeners
    attachEventListeners();
  };

  const renderLocalServicesSignInHTML = () => {
    return `
      <h2 class="launch-title" style="color: #FF5C00;">
        <span class="material-icons-outlined" style="font-size: 22px; color: #FF5C00;">computer</span> Local Services
      </h2>
      <p class="launch-subtitle">Sign in to a local multi-user business database on this machine.</p>

      <div id="local-auth-error" class="auth-error" style="display: none;">
        <span class="material-icons-outlined" style="font-size:18px;">error_outline</span>
        <span id="local-auth-error-text"></span>
      </div>

      <form id="local-signin-form" style="display: flex; flex-direction: column; gap: 10px;">
        <div class="launch-form-group">
          <label class="launch-form-label">Business Profile</label>
          <div class="launch-input-wrapper">
            <span class="material-icons-outlined launch-input-icon">business</span>
            <select id="local-signin-profile" class="launch-input" style="appearance: none; background: #0f172a; border: none; color: #f8fafc; width: 100%; padding-left: 36px; height: 40px; border-radius: 6px; font-family: inherit; font-size: 14px;" required>
              ${accounts.length === 0 
                ? '<option value="" disabled selected>No profiles available. Create one on the right.</option>' 
                : accounts.map((acc, index) => `<option value="${acc.id}" ${index === 0 ? 'selected' : ''}>${escapeHTML(acc.businessName)}</option>`).join('')
              }
            </select>
            <span class="material-icons-outlined" style="position: absolute; right: 12px; top: 11px; color: #64748b; pointer-events: none;">expand_more</span>
          </div>
        </div>

        <div class="launch-form-group">
          <label class="launch-form-label">Username or Email</label>
          <div class="launch-input-wrapper">
            <span class="material-icons-outlined launch-input-icon">person</span>
            <input type="text" id="local-signin-username" class="launch-input" placeholder="e.g. jake or john@company.local" required>
          </div>
        </div>

        <div class="launch-form-group">
          <label class="launch-form-label">Password</label>
          <div class="launch-input-wrapper">
            <span class="material-icons-outlined launch-input-icon">lock</span>
            <input type="password" id="local-signin-password" class="launch-input" placeholder="••••••••" required>
          </div>
        </div>

        <button type="submit" class="launch-btn launch-btn-primary" id="btn-local-signin-submit">
          Sign In Offline
        </button>
        <div style="text-align: center; margin-top: 10px; font-size: 13px;">
          <a href="#" id="link-local-forgot" style="color: #FF5C00; text-decoration: none; font-weight: 600;">Forgot password?</a>
        </div>
      </form>
    `;
  };

  const renderCloudSignInHTML = () => {
    return `
      <h2 class="launch-title" style="color: #FF5C00;">
        <span class="material-icons-outlined" style="font-size: 22px; color: #FF5C00;">cloud_queue</span> RELAY Cloud Services
      </h2>
      <p class="launch-subtitle">Sign in to sync your data across devices and access your team.</p>

      <div id="cloud-error" class="auth-error" style="display: none;">
        <span class="material-icons-outlined" style="font-size:18px;">error_outline</span>
        <span id="cloud-error-text"></span>
      </div>

      <form id="cloud-signin-form" style="display: flex; flex-direction: column; gap: 10px;">
        <div class="launch-form-group">
          <label class="launch-form-label">Username or Email</label>
          <div class="launch-input-wrapper">
            <span class="material-icons-outlined launch-input-icon">person</span>
            <input type="text" id="cloud-email" class="launch-input" placeholder="username@company or name@company.com" required>
          </div>
        </div>

        <div class="launch-form-group">
          <label class="launch-form-label">Password</label>
          <div class="launch-input-wrapper">
            <span class="material-icons-outlined launch-input-icon">lock</span>
            <input type="password" id="cloud-password" class="launch-input" placeholder="••••••••" required>
          </div>
        </div>

        <button type="submit" class="launch-btn launch-btn-primary" id="btn-cloud-submit">
          Sign In
        </button>

        <div style="text-align: center; margin-top: 10px; font-size: 13px; display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
          <span>Don't have an account? <a href="#" id="link-show-signup" style="color: #FF5C00; text-decoration: none; font-weight: 600;">Create account</a></span>
          <span style="color: #cbd5e1;">•</span>
          <a href="#" id="link-cloud-forgot" style="color: #FF5C00; text-decoration: none; font-weight: 600;">Forgot password?</a>
        </div>
      </form>
    `;
  };

  const renderCloudSignUpHTML = () => {
    return `
      <h2 class="launch-title" style="color: #FF5C00;">
        <span class="material-icons-outlined" style="font-size: 22px; color: #FF5C00;">business</span> Register Company
      </h2>
      <p class="launch-subtitle">Set up a new company profile and administrator account in the cloud.</p>

      <div id="cloud-error" class="auth-error" style="display: none;">
        <span class="material-icons-outlined" style="font-size:18px;">error_outline</span>
        <span id="cloud-error-text"></span>
      </div>

      <form id="cloud-signup-form" style="display: flex; flex-direction: column; gap: 10px;">
        <div class="launch-form-group">
          <label class="launch-form-label">Company Name</label>
          <div class="launch-input-wrapper">
            <span class="material-icons-outlined launch-input-icon">business</span>
            <input type="text" id="signup-company" class="launch-input" placeholder="Acme Electrical Services" required>
          </div>
        </div>

        <div class="launch-form-group">
          <label class="launch-form-label">Admin Full Name</label>
          <div class="launch-input-wrapper">
            <span class="material-icons-outlined launch-input-icon">badge</span>
            <input type="text" id="signup-name" class="launch-input" placeholder="John Doe" required>
          </div>
        </div>

        <div class="launch-form-group">
          <label class="launch-form-label">Admin Phone</label>
          <div class="launch-input-wrapper">
            <span class="material-icons-outlined launch-input-icon">phone</span>
            <input type="text" id="signup-phone" class="launch-input" placeholder="0412 345 678" required>
          </div>
        </div>

        <div class="launch-form-group">
          <label class="launch-form-label">Admin Email Address</label>
          <div class="launch-input-wrapper">
            <span class="material-icons-outlined launch-input-icon">email</span>
            <input type="email" id="signup-email" class="launch-input" placeholder="admin@acme.com" required>
          </div>
        </div>

        <div class="launch-form-group">
          <label class="launch-form-label">Password</label>
          <div class="launch-input-wrapper">
            <span class="material-icons-outlined launch-input-icon">lock</span>
            <input type="password" id="signup-password" class="launch-input" placeholder="Min. 6 characters" required>
          </div>
        </div>

        <button type="submit" class="launch-btn launch-btn-primary" id="btn-cloud-submit">
          Create Company &amp; Admin
        </button>

        <div style="text-align: center; margin-top: 10px; font-size: 13px;">
          Already have an account? <a href="#" id="link-show-signin" style="color: #FF5C00; text-decoration: none; font-weight: 600;">Sign in</a>
        </div>
      </form>
    `;
  };

  const renderLocalAccountsHTML = () => {
    let html = '<div class="account-list">';

    accounts.forEach(acct => {
      const isPromptOpen = activePasswordPromptId === acct.id;
      const initials = acct.businessName ? acct.businessName.trim().charAt(0).toUpperCase() : 'L';
      const lastUsed = formatRelativeTime(acct.lastAccessedAt || acct.createdAt);

      html += `
        <div class="account-item-wrapper" style="${isPromptOpen ? 'border-color: #94a3b8; background-color: rgba(255,255,255,0.01);' : ''}">
          <div class="account-item" data-id="${acct.id}">
            <div class="account-details">
              <div class="account-avatar" style="background-color: ${acct.avatarColor || '#FF5C00'}">
                ${escapeHTML(initials)}
              </div>
              <div>
                <h4 class="account-name">${escapeHTML(acct.businessName)}</h4>
                <div class="account-meta">
                  Last used ${lastUsed} 
                  ${acct.hasPassword ? '• <span class="material-icons-outlined" style="font-size:11px; vertical-align: middle; margin-left: 2px;">lock</span> PIN protected' : ''}
                </div>
              </div>
            </div>
            <span class="material-icons-outlined account-icon">
              ${acct.hasPassword ? 'lock_outline' : 'chevron_right'}
            </span>
          </div>

          ${isPromptOpen ? `
            <div class="password-prompt-box">
              <input type="password" class="password-prompt-input" id="pwd-input-${acct.id}" placeholder="Enter PIN/password" autofocus />
              <button class="password-prompt-btn password-prompt-submit" data-id="${acct.id}">Unlock</button>
              <button class="password-prompt-btn password-prompt-cancel">Cancel</button>
            </div>
            <div style="margin: -6px 14px 10px 14px; text-align: right; font-size: 11px;">
              <a href="#" class="link-local-profile-forgot" data-id="${acct.id}" style="color: #FF5C00; text-decoration: none; font-weight: 600;">Forgot PIN?</a>
            </div>
            <div class="auth-error pwd-error" id="pwd-error-${acct.id}" style="display: none; margin: 0 14px 12px 14px; padding: 8px 12px; font-size: 12px;"></div>
          ` : ''}
        </div>
      `;
    });
 
    html += '</div>';
 
    if (isCreatingLocalAccount) {
      const isDirSupported = typeof window !== 'undefined' && !!window.showDirectoryPicker;
      let dirSyncHtml = '';
      if (isDirSupported) {
        dirSyncHtml = `
          <div class="launch-form-group" style="margin-bottom: 8px;">
            <label class="launch-form-label" style="color: #94a3b8;">Local Directory for Storage (Required)</label>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button type="button" class="launch-btn launch-btn-secondary" id="btn-local-pick-dir" style="margin: 0; padding: 8px 12px; font-size: 13px; flex: 1; border-color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left;">
                <span class="material-icons-outlined" style="font-size: 16px; margin-right: 4px; vertical-align: middle;">folder</span>
                <span id="local-pick-dir-label">${pendingLocalDirHandle ? escapeHTML(pendingLocalDirHandle.name) : 'Choose folder...'}</span>
              </button>
            </div>
            <div class="text-tertiary" style="font-size: 11px; margin-top: 4px; color: #64748b; line-height: 1.4;">
              Saves database records and attachments directly to this computer folder (ideal for OneDrive/Dropbox/Network share).
            </div>
          </div>
        `;
      }
 
      html += `
        <div class="new-account-form">
          <h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600;">Create Local Business Profile</h4>
          <div class="launch-form-group" style="margin-bottom: 8px;">
            <label class="launch-form-label" style="color: #94a3b8;">Business Name</label>
            <input type="text" id="local-business-name" class="launch-input" placeholder="e.g. Side Electrical" style="padding-left: 12px;" required />
          </div>
          <div class="launch-form-group" style="margin-bottom: 8px;">
            <label class="launch-form-label" style="color: #94a3b8;">Protect with PIN/Password (Optional)</label>
            <input type="password" id="local-business-password" class="launch-input" placeholder="Leave blank for no password" style="padding-left: 12px;" />
          </div>
          
          <div id="local-recovery-fields" style="display: none; margin-top: 8px;">
            <div class="launch-form-group" style="margin-bottom: 8px;">
              <label class="launch-form-label" style="color: #94a3b8;">Recovery Question</label>
              <div class="launch-input-wrapper">
                <select id="local-recovery-question-select" class="launch-input" style="appearance: none; background: #0f172a; border: none; color: #f8fafc; width: 100%; padding-left: 12px; height: 36px; border-radius: 6px; font-family: inherit; font-size: 13px;">
                  <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                  <option value="In what city or town did your parents meet?">In what city or town did your parents meet?</option>
                  <option value="What was the name of your first school?">What was the name of your first school?</option>
                  <option value="What was your favorite childhood food?">What was your favorite childhood food?</option>
                  <option value="custom">Write a custom question...</option>
                </select>
                <span class="material-icons-outlined" style="position: absolute; right: 12px; top: 9px; color: #64748b; pointer-events: none;">expand_more</span>
              </div>
            </div>
            <div class="launch-form-group" id="local-recovery-custom-group" style="display: none; margin-bottom: 8px;">
              <label class="launch-form-label" style="color: #94a3b8;">Custom Question</label>
              <input type="text" id="local-recovery-question-custom" class="launch-input" placeholder="Type your custom question" style="padding-left: 12px;" />
            </div>
            <div class="launch-form-group" style="margin-bottom: 8px;">
              <label class="launch-form-label" style="color: #94a3b8;">Recovery Answer</label>
              <input type="text" id="local-recovery-answer" class="launch-input" placeholder="Enter answer (case-insensitive)" style="padding-left: 12px;" />
            </div>
          </div>

          ${dirSyncHtml}
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <button class="launch-btn launch-btn-primary" id="btn-save-local-account" style="flex: 1;">Create Profile</button>
            <button class="launch-btn launch-btn-secondary" id="btn-cancel-local-account" style="flex: 1;">Cancel</button>
          </div>
        </div>
      `;
    } else {
      html += `
        <div style="margin-top: 16px; display: flex; gap: 8px;">
          <button class="launch-btn launch-btn-secondary" id="btn-show-create-local" style="flex: 1; padding: 10px 16px;">
            <span class="material-icons-outlined" style="font-size: 16px; margin-right: 6px; vertical-align: middle;">add</span>New Profile
          </button>
          <button class="launch-btn launch-btn-secondary" id="btn-link-existing-dir" style="flex: 1; padding: 10px 16px;" title="Link an existing folder containing dispatch db files">
            <span class="material-icons-outlined" style="font-size: 16px; margin-right: 6px; vertical-align: middle;">link</span>Link Folder
          </button>
        </div>
      `;
    }

    return html;
  };

  const attachEventListeners = () => {
    // Panel selection for collapsed states
    const panelLeft = container.querySelector('.launch-panel-left');
    if (panelLeft) {
      panelLeft.addEventListener('click', (e) => {
        if (majoritySide === 'right') {
          majoritySide = 'left';
          render();
        }
      });
    }

    const panelRight = container.querySelector('.launch-panel-right');
    if (panelRight) {
      panelRight.addEventListener('click', (e) => {
        if (majoritySide === 'left') {
          majoritySide = 'right';
          render();
        }
      });
    }

    // Toggle between Cloud and Local Services
    const btnToggleCloud = container.querySelector('#btn-toggle-cloud');
    if (btnToggleCloud) {
      btnToggleCloud.addEventListener('click', (e) => {
        e.stopPropagation();
        activeAuthMode = 'cloud';
        render();
      });
    }

    const btnToggleLocal = container.querySelector('#btn-toggle-local');
    if (btnToggleLocal) {
      btnToggleLocal.addEventListener('click', (e) => {
        e.stopPropagation();
        activeAuthMode = 'local';
        render();
      });
    }

    // Toggle Divider Slider
    const btnSlideDivider = container.querySelector('#btn-slide-divider');
    if (btnSlideDivider) {
      btnSlideDivider.addEventListener('click', (e) => {
        e.stopPropagation();
        majoritySide = majoritySide === 'left' ? 'right' : 'left';
        render();
      });
    }

    // Local multi-user sign in form
    const localSigninForm = container.querySelector('#local-signin-form');
    if (localSigninForm) {
      localSigninForm.addEventListener('submit', handleLocalMultiuserSignIn);
    }

    // Local Directory Pickers (New Profile creation)
    const btnLocalPickDir = container.querySelector('#btn-local-pick-dir');
    if (btnLocalPickDir) {
      btnLocalPickDir.addEventListener('click', async () => {
        try {
          const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
          pendingLocalDirHandle = handle;
          render();
        } catch (err) {
          console.error('Directory selection failed:', err);
        }
      });
    }

    const btnLocalClearDir = container.querySelector('#btn-local-clear-dir');
    if (btnLocalClearDir) {
      btnLocalClearDir.addEventListener('click', () => {
        pendingLocalDirHandle = null;
        render();
      });
    }

    // Link Existing local synced folder
    const btnLinkExistingDir = container.querySelector('#btn-link-existing-dir');
    if (btnLinkExistingDir) {
      btnLinkExistingDir.addEventListener('click', handleLinkExistingDir);
    }

    // Left side panel views
    const linkShowSignup = container.querySelector('#link-show-signup');
    if (linkShowSignup) {
      linkShowSignup.addEventListener('click', (e) => {
        e.preventDefault();
        cloudView = 'signup';
        render();
      });
    }

    const linkShowSignin = container.querySelector('#link-show-signin');
    if (linkShowSignin) {
      linkShowSignin.addEventListener('click', (e) => {
        e.preventDefault();
        cloudView = 'signin';
        render();
      });
    }

    // Cloud Forms Submissions
    const signinForm = container.querySelector('#cloud-signin-form');
    if (signinForm) {
      signinForm.addEventListener('submit', handleCloudSignIn);
    }

    const signupForm = container.querySelector('#cloud-signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', handleCloudSignUp);
    }

    // Local Accounts click handlers
    const accountItems = container.querySelectorAll('.account-item');
    accountItems.forEach(item => {
      item.addEventListener('click', () => {
        const accountId = item.dataset.id;
        const acct = accounts.find(a => a.id === accountId);
        if (!acct) return;

        if (acct.hasPassword) {
          activePasswordPromptId = accountId;
          render();
        } else {
          onComplete({ mode: 'local', accountId });
        }
      });
    });

    // Local password unlock buttons
    const unlockBtn = container.querySelector('.password-prompt-submit');
    if (unlockBtn) {
      unlockBtn.addEventListener('click', handleLocalUnlock);
    }

    // Enter press on local password prompt
    const pwdInputEl = container.querySelector('.password-prompt-input');
    if (pwdInputEl) {
      pwdInputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          handleLocalUnlock();
        }
      });
    }

    // Local password cancels
    const cancelBtn = container.querySelector('.password-prompt-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        activePasswordPromptId = null;
        render();
      });
    }

    // Show Create Local form
    const btnShowCreateLocal = container.querySelector('#btn-show-create-local');
    if (btnShowCreateLocal) {
      btnShowCreateLocal.addEventListener('click', () => {
        isCreatingLocalAccount = true;
        render();
      });
    }

    // Save Local Account
    const btnSaveLocalAccount = container.querySelector('#btn-save-local-account');
    if (btnSaveLocalAccount) {
      btnSaveLocalAccount.addEventListener('click', handleCreateLocalAccount);
    }

    const localNameInput = container.querySelector('#local-business-name');
    const localPwdInput = container.querySelector('#local-business-password');
    if (localNameInput) {
      localNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleCreateLocalAccount(e);
      });
    }
    if (localPwdInput) {
      localPwdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleCreateLocalAccount(e);
      });
    }

    // Toggle recovery fields display in local profile creation
    const recFields = container.querySelector('#local-recovery-fields');
    if (localPwdInput && recFields) {
      localPwdInput.addEventListener('input', () => {
        recFields.style.display = localPwdInput.value ? 'block' : 'none';
      });
      // Initial state check in case input value is preserved by browser
      recFields.style.display = localPwdInput.value ? 'block' : 'none';
    }

    const questSelect = container.querySelector('#local-recovery-question-select');
    const customGroup = container.querySelector('#local-recovery-custom-group');
    if (questSelect && customGroup) {
      questSelect.addEventListener('change', () => {
        customGroup.style.display = questSelect.value === 'custom' ? 'block' : 'none';
      });
    }

    // Cloud forgot link
    const linkCloudForgot = container.querySelector('#link-cloud-forgot');
    if (linkCloudForgot) {
      linkCloudForgot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleCloudForgot();
      });
    }

    // Local multiuser forgot link
    const linkLocalForgot = container.querySelector('#link-local-forgot');
    if (linkLocalForgot) {
      linkLocalForgot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleLocalMultiuserForgot();
      });
    }

    // Local profile forgot links
    const forgotLinks = container.querySelectorAll('.link-local-profile-forgot');
    forgotLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const accountId = link.dataset.id;
        handleLocalProfileForgot(accountId);
      });
    });

    // Cancel Create Local
    const btnCancelLocalAccount = container.querySelector('#btn-cancel-local-account');
    if (btnCancelLocalAccount) {
      btnCancelLocalAccount.addEventListener('click', () => {
        isCreatingLocalAccount = false;
        render();
      });
    }
  };

  const handleCloudSignIn = async (e) => {
    e.preventDefault();
    const errorEl = container.querySelector('#cloud-error');
    const errorTextEl = container.querySelector('#cloud-error-text');
    const submitBtn = container.querySelector('#btn-cloud-submit');
    
    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerText = 'Signing In...';

    const rawInput = container.querySelector('#cloud-email').value.trim();
    const password = container.querySelector('#cloud-password').value;

    let authEmail = rawInput;
    if (authEmail.includes('@')) {
      const parts = authEmail.split('@');
      const domain = parts[1];
      if (domain && !domain.includes('.')) {
        authEmail = `${parts[0].toLowerCase()}@${domain.toLowerCase()}.relay.internal`;
      }
    }

    try {
      // Sign in with password via Supabase
      let signInResult = await supabase.auth.signInWithPassword({ email: authEmail, password });
      
      // Fallback for legacy .fieldforge.internal users if new domain fails
      if (signInResult.error && authEmail.endsWith('.relay.internal')) {
        const legacyEmail = authEmail.replace('.relay.internal', '.fieldforge.internal');
        const fallbackResult = await supabase.auth.signInWithPassword({ email: legacyEmail, password });
        if (!fallbackResult.error) {
          signInResult = fallbackResult;
        }
      }
      
      if (signInResult.error) throw signInResult.error;
      const { data } = signInResult;

      // Call parent onComplete with cloud parameters
      onComplete({ mode: 'cloud', userId: data.user.id });

    } catch (err) {
      console.error('Cloud Sign In Error:', err);
      errorTextEl.innerText = err.message || 'Incorrect username/email or password.';
      errorEl.style.display = 'flex';
      submitBtn.disabled = false;
      submitBtn.innerText = 'Sign In';
    }
  };

  const handleCloudSignUp = async (e) => {
    e.preventDefault();
    const errorEl = container.querySelector('#cloud-error');
    const errorTextEl = container.querySelector('#cloud-error-text');
    const submitBtn = container.querySelector('#btn-cloud-submit');
    
    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerText = 'Registering...';

    const companyName = container.querySelector('#signup-company').value.trim();
    const adminName = container.querySelector('#signup-name').value.trim();
    const adminPhone = container.querySelector('#signup-phone').value.trim();
    const email = container.querySelector('#signup-email').value.trim();
    const password = container.querySelector('#signup-password').value;

    if (password.length < 6) {
      errorTextEl.innerText = 'Password must be at least 6 characters.';
      errorEl.style.display = 'flex';
      submitBtn.disabled = false;
      submitBtn.innerText = 'Create Company & Admin';
      return;
    }

    try {
      // 1. Sign up user in Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: adminName,
            phone: adminPhone
          }
        }
      });
      if (error) throw error;

      if (!data.user) {
        throw new Error('Verification required or signup was blocked. Check your email inbox.');
      }

      // 2. Call security definer RPC function to create company and profile records
      const { data: companyId, error: rpcError } = await supabase.rpc('create_company_and_admin', {
        user_id: data.user.id,
        company_name: companyName,
        admin_name: adminName,
        admin_phone: adminPhone
      });

      if (rpcError) throw rpcError;

      // Call parent onComplete with cloud parameters
      onComplete({ mode: 'cloud', userId: data.user.id });

    } catch (err) {
      console.error('Cloud Sign Up Error:', err);
      errorTextEl.innerText = err.message || 'An error occurred during registration.';
      errorEl.style.display = 'flex';
      submitBtn.disabled = false;
      submitBtn.innerText = 'Create Company & Admin';
    }
  };

  const handleLocalUnlock = async () => {
    const pwdInput = container.querySelector(`#pwd-input-${activePasswordPromptId}`);
    const pwdError = container.querySelector(`#pwd-error-${activePasswordPromptId}`);
    if (!pwdInput) return;

    const password = pwdInput.value;
    const acct = accounts.find(a => a.id === activePasswordPromptId);
    if (!acct) return;

    pwdError.style.display = 'none';

    try {
      const hashedInput = await hashPassword(password);
      if (hashedInput === acct.passwordHash) {
        const accountId = activePasswordPromptId;
        activePasswordPromptId = null;
        onComplete({ mode: 'local', accountId });
      } else {
        pwdError.innerText = 'Incorrect PIN/password. Please try again.';
        pwdError.style.display = 'flex';
      }
    } catch (e) {
      console.error('Bcrypt-lite hash comparison failed', e);
      pwdError.innerText = 'System error unlocking account.';
      pwdError.style.display = 'flex';
    }
  };

  const handleLocalMultiuserSignIn = async (e) => {
    e.preventDefault();
    const errorEl = container.querySelector('#local-auth-error');
    const errorTextEl = container.querySelector('#local-auth-error-text');
    const submitBtn = container.querySelector('#btn-local-signin-submit');

    const profileSelect = container.querySelector('#local-signin-profile');
    if (!profileSelect || !profileSelect.value) {
      errorTextEl.innerText = 'Please select a Business Profile.';
      errorEl.style.display = 'flex';
      return;
    }

    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    const originalText = submitBtn.innerText;
    submitBtn.innerText = 'Checking local database...';

    const accountId = profileSelect.value;
    const usernameInput = container.querySelector('#local-signin-username').value.trim().toLowerCase();
    const passwordInput = container.querySelector('#local-signin-password').value;

    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('relay_active_account', accountId);
      }
      const { store } = window.__fieldForge;
      
      // Temporary connect to namespaced store to load its cache & technicians
      await store.initializeUser({ companyId: accountId });

      const technicians = store.getAll('technicians') || [];
      const tech = technicians.find(t => 
        (t.email && t.email.toLowerCase() === usernameInput) || 
        (t.username && t.username.toLowerCase() === usernameInput) ||
        (t.name && t.name.toLowerCase() === usernameInput)
      );

      if (!tech) {
        throw new Error('User not found in local database. Check username/email.');
      }

      // Default password is '123456' if not set
      const expectedPassword = tech.password || '123456';
      if (passwordInput !== expectedPassword) {
        throw new Error('Incorrect offline password. Please try again.');
      }

      // Build specific role
      let role = 'technician';
      let userTypeName = 'Technician';
      const utId = tech.userTypeId || '';
      if (utId === 'ut_admin' || utId.endsWith('_ut_admin')) {
        role = 'admin';
        userTypeName = 'Admin';
      } else if (utId === 'ut_manager' || utId.endsWith('_ut_manager')) {
        role = 'manager';
        userTypeName = 'Manager';
      } else if (utId === 'ut_office' || utId.endsWith('_ut_office')) {
        role = 'office';
        userTypeName = 'Office Staff';
      }

      const localUser = {
        id: tech.id,
        companyId: accountId,
        name: tech.name,
        role: role,
        userTypeName: userTypeName,
        userTypeId: tech.userTypeId || `${accountId}_ut_tech`,
        color: tech.color || '#3B82F6',
        theme: tech.theme || 'light'
      };

      onComplete({ mode: 'local_multiuser', user: localUser, accountId });

    } catch (err) {
      console.error('Local Auth Error:', err);
      errorTextEl.innerText = err.message || 'An error occurred during local sign in.';
      errorEl.style.display = 'flex';
      submitBtn.disabled = false;
      submitBtn.innerText = originalText;
    }
  };

  const handleLinkExistingDir = async () => {
    if (typeof window === 'undefined' || !window.showDirectoryPicker) {
      alert('Local folder access is not supported by your current browser.');
      return;
    }

    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      
      let businessName = dirHandle.name;
      try {
        const dataDir = await dirHandle.getDirectoryHandle('data');
        const fileHandle = await dataDir.getFileHandle('settings.json');
        const file = await fileHandle.getFile();
        const text = await file.text();
        const s = JSON.parse(text);
        if (s.name) businessName = s.name;
      } catch (e) {
        console.warn('Could not read existing settings from directory, using folder name:', e);
      }

      const newAccountId = 'acct_' + Math.random().toString(36).substr(2, 9);
      const avatarColor = AVATAR_COLORS[accounts.length % AVATAR_COLORS.length];
      const newAccount = {
        id: newAccountId,
        businessName,
        avatarColor,
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        hasPassword: false,
        passwordHash: null
      };

      accounts.push(newAccount);
      await storageSet('relay_accounts', accounts);

      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('relay_active_account', newAccountId);
      }
      const { store } = window.__fieldForge;
      
      // Initialize namespaced DB connection
      await store.initializeUser({ companyId: newAccountId });
      
      // Save directory handle
      await store.setLocalDirectory(dirHandle);

      onComplete({ mode: 'local', accountId: newAccountId });

    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to link directory:', err);
        alert('Failed to link directory: ' + err.message);
      }
    }
  };

  const handleCreateLocalAccount = async (e) => {
    if (e) e.preventDefault();
    const nameInput = container.querySelector('#local-business-name');
    const pwdInput = container.querySelector('#local-business-password');
    if (!nameInput) return;

    const businessName = nameInput.value.trim();
    const password = pwdInput ? pwdInput.value : '';

    if (!businessName) return; // HTML5 required triggers this too, but safety check

    if (!pendingLocalDirHandle) {
      const formEl = container.querySelector('.new-account-form');
      let errEl = formEl.querySelector('.auth-error');
      if (!errEl) {
        errEl = document.createElement('div');
        errEl.className = 'auth-error';
        errEl.style.cssText = 'display: flex; align-items: center; gap: 8px; background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 8px 12px; color: #ef4444; font-size: 12px; margin-bottom: 12px; line-height: 1.4;';
        formEl.insertBefore(errEl, formEl.firstChild);
      }
      errEl.innerHTML = '<span class="material-icons-outlined" style="font-size:18px;">error_outline</span><span>Please select a local directory for storage.</span>';
      return;
    }

    const newAccountId = 'acct_' + Math.random().toString(36).substr(2, 9);
    const avatarColor = AVATAR_COLORS[accounts.length % AVATAR_COLORS.length];
    
    let hasPassword = false;
    let passwordHash = null;
    let recoveryQuestion = null;
    let recoveryAnswerHash = null;

    if (password) {
      hasPassword = true;
      passwordHash = await hashPassword(password);

      const selectQuestion = container.querySelector('#local-recovery-question-select').value;
      const customQuestion = container.querySelector('#local-recovery-question-custom').value.trim();
      const answerVal = container.querySelector('#local-recovery-answer').value.trim().toLowerCase();

      recoveryQuestion = selectQuestion === 'custom' ? customQuestion : selectQuestion;
      if (!recoveryQuestion) {
        const formEl = container.querySelector('.new-account-form');
        let errEl = formEl.querySelector('.auth-error');
        if (!errEl) {
          errEl = document.createElement('div');
          errEl.className = 'auth-error';
          errEl.style.cssText = 'display: flex; align-items: center; gap: 8px; background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 8px 12px; color: #ef4444; font-size: 12px; margin-bottom: 12px; line-height: 1.4;';
          formEl.insertBefore(errEl, formEl.firstChild);
        }
        errEl.innerHTML = '<span class="material-icons-outlined" style="font-size:18px;">error_outline</span><span>Please set a recovery question.</span>';
        errEl.style.display = 'flex';
        return;
      }
      if (!answerVal) {
        const formEl = container.querySelector('.new-account-form');
        let errEl = formEl.querySelector('.auth-error');
        if (!errEl) {
          errEl = document.createElement('div');
          errEl.className = 'auth-error';
          errEl.style.cssText = 'display: flex; align-items: center; gap: 8px; background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 8px 12px; color: #ef4444; font-size: 12px; margin-bottom: 12px; line-height: 1.4;';
          formEl.insertBefore(errEl, formEl.firstChild);
        }
        errEl.innerHTML = '<span class="material-icons-outlined" style="font-size:18px;">error_outline</span><span>Please enter a recovery answer.</span>';
        errEl.style.display = 'flex';
        return;
      }
      recoveryAnswerHash = await hashPassword(answerVal);
    }

    const newAccount = {
      id: newAccountId,
      businessName,
      avatarColor,
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      hasPassword,
      passwordHash,
      recoveryQuestion,
      recoveryAnswerHash
    };

    accounts.push(newAccount);
    await storageSet('relay_accounts', accounts);

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('relay_active_account', newAccountId);
    }

    // Save directory handle if selected
    if (pendingLocalDirHandle) {
      try {
        const { store } = window.__fieldForge;
        await store.initializeUser({ companyId: newAccountId });
        await store.setLocalDirectory(pendingLocalDirHandle);
      } catch (err) {
        console.error('Failed to set directory handle during account creation:', err);
      }
    } else {
      // Just initialize namespaced DB connection for seeding
      try {
        const { store } = window.__fieldForge;
        await store.initializeUser({ companyId: newAccountId });
      } catch (err) {
        console.error('Failed to initialize local account store:', err);
      }
    }

    pendingLocalDirHandle = null;
    isCreatingLocalAccount = false;
    onComplete({ mode: 'local', accountId: newAccountId });
  };

  const showModal = ({ title, contentHtml, onConfirm, confirmText = 'Submit', cancelText = 'Cancel' }) => {
    const overlay = document.createElement('div');
    overlay.className = 'launch-modal-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
    `;
    
    overlay.innerHTML = `
      <div class="launch-modal-card" style="
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        border-radius: 12px;
        max-width: 440px;
        width: 100%;
        padding: 24px;
        box-sizing: border-box;
        color: #1e293b;
        font-family: 'Inter', sans-serif;
      ">
        <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px; color: #0f172a;">
          <span class="material-icons-outlined" style="color: #FF5C00; font-size: 22px;">help_outline</span>
          ${title}
        </h3>
        <div class="launch-modal-body" style="margin-bottom: 20px; font-size: 13px; line-height: 1.5; color: #475569;">
          ${contentHtml}
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button class="launch-btn launch-btn-secondary launch-modal-cancel" style="width: auto; padding: 8px 16px; margin: 0;">${cancelText}</button>
          <button class="launch-btn launch-btn-primary launch-modal-confirm" style="width: auto; padding: 8px 16px; margin: 0;">${confirmText}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    const close = () => overlay.remove();
    
    overlay.querySelector('.launch-modal-cancel').addEventListener('click', close);
    overlay.querySelector('.launch-modal-confirm').addEventListener('click', () => {
      onConfirm(overlay, close);
    });
  };

  const handleCloudForgot = () => {
    showModal({
      title: 'Reset Cloud Password',
      contentHtml: `
        <p>Enter your cloud email address. We will send you a password reset link.</p>
        <div class="launch-form-group" style="margin-top: 12px;">
          <label class="launch-form-label">Email Address</label>
          <input type="email" id="modal-cloud-email" class="launch-input" placeholder="admin@company.com" style="padding-left: 12px;" required />
        </div>
        <div id="modal-cloud-error" class="auth-error" style="display: none; margin-top: 12px; padding: 8px 12px; font-size: 12px;"></div>
        <div id="modal-cloud-success" style="display: none; color: #16a34a; font-size: 13px; margin-top: 12px; line-height: 1.4;"></div>
      `,
      confirmText: 'Send Reset Email',
      onConfirm: async (overlay, close) => {
        const emailInput = overlay.querySelector('#modal-cloud-email');
        const errorEl = overlay.querySelector('#modal-cloud-error');
        const successEl = overlay.querySelector('#modal-cloud-success');
        const confirmBtn = overlay.querySelector('.launch-modal-confirm');
        
        if (!emailInput) return;
        const email = emailInput.value.trim();
        if (!email) {
          errorEl.innerText = 'Please enter your email.';
          errorEl.style.display = 'flex';
          return;
        }

        errorEl.style.display = 'none';
        confirmBtn.disabled = true;
        confirmBtn.innerText = 'Sending...';

        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/#reset-password'
          });
          if (error) throw error;

          successEl.innerHTML = `
            <span class="material-icons-outlined" style="vertical-align: middle; font-size: 16px; margin-right: 4px;">check_circle</span>
            Reset email sent successfully. Check your inbox.
          `;
          successEl.style.display = 'block';
          confirmBtn.style.display = 'none';
        } catch (err) {
          console.error(err);
          errorEl.innerText = err.message || 'Failed to send reset email.';
          errorEl.style.display = 'flex';
          confirmBtn.disabled = false;
          confirmBtn.innerText = 'Send Reset Email';
        }
      }
    });
  };

  const handleLocalMultiuserForgot = () => {
    const profileSelect = container.querySelector('#local-signin-profile');
    if (!profileSelect || !profileSelect.value) {
      alert('Please select a Business Profile first.');
      return;
    }

    const accountId = profileSelect.value;

    showModal({
      title: 'Reset Offline Password',
      contentHtml: `
        <p>Enter your Username or Email. We will check the local database and submit a password reset request to your administrator.</p>
        <div class="launch-form-group" style="margin-top: 12px;">
          <label class="launch-form-label">Username or Email</label>
          <input type="text" id="modal-local-user" class="launch-input" placeholder="e.g. jake" style="padding-left: 12px;" required />
        </div>
        <div id="modal-local-error" class="auth-error" style="display: none; margin-top: 12px; padding: 8px 12px; font-size: 12px;"></div>
        <div id="modal-local-success" style="display: none; color: #16a34a; font-size: 13px; margin-top: 12px; line-height: 1.4;"></div>
      `,
      confirmText: 'Request Admin Reset',
      onConfirm: async (overlay, close) => {
        const userInput = overlay.querySelector('#modal-local-user');
        const errorEl = overlay.querySelector('#modal-local-error');
        const successEl = overlay.querySelector('#modal-local-success');
        const confirmBtn = overlay.querySelector('.launch-modal-confirm');
        
        if (!userInput) return;
        const rawInput = userInput.value.trim().toLowerCase();
        if (!rawInput) {
          errorEl.innerText = 'Please enter your username or email.';
          errorEl.style.display = 'flex';
          return;
        }

        errorEl.style.display = 'none';
        confirmBtn.disabled = true;
        confirmBtn.innerText = 'Checking...';

        try {
          const { store } = window.__fieldForge;
          await store.initializeUser({ companyId: accountId });
          
          const technicians = store.getAll('technicians') || [];
          const tech = technicians.find(t => 
            (t.email && t.email.toLowerCase() === rawInput) || 
            (t.username && t.username.toLowerCase() === rawInput) ||
            (t.name && t.name.toLowerCase() === rawInput)
          );

          if (!tech) {
            throw new Error('User not found in local database. Check username/email.');
          }

          // Create a reset request in local store
          const requests = store.getAll('passwordResetRequests') || [];
          const alreadyPending = requests.some(r => r.technician_id === tech.id && r.status === 'pending');
          
          if (!alreadyPending) {
            await store.create('passwordResetRequests', {
              id: 'req_' + Math.random().toString(36).substr(2, 9),
              technician_id: tech.id,
              employee_id: tech.username || tech.email || tech.name,
              requested_at: new Date().toISOString(),
              status: 'pending'
            });
          }

          successEl.innerHTML = `
            <span class="material-icons-outlined" style="vertical-align: middle; font-size: 16px; margin-right: 4px;">check_circle</span>
            Request submitted. Ask your manager/admin to approve it in Settings > Team.
          `;
          successEl.style.display = 'block';
          confirmBtn.style.display = 'none';
        } catch (err) {
          console.error(err);
          errorEl.innerText = err.message || 'Failed to submit reset request.';
          errorEl.style.display = 'flex';
          confirmBtn.disabled = false;
          confirmBtn.innerText = 'Request Admin Reset';
        }
      }
    });
  };

  const handleLocalProfileForgot = (accountId) => {
    const acct = accounts.find(a => a.id === accountId);
    if (!acct) return;

    if (!acct.recoveryQuestion || !acct.recoveryAnswerHash) {
      showModal({
        title: 'Recovery Not Configured',
        contentHtml: `
          <p>No recovery question was configured for this local business profile.</p>
          <p style="margin-top: 8px; color: #ef4444; font-weight: 600;">If you have lost access, you will need to delete this profile and use "Link Folder" to reconnect the database with a new profile.</p>
        `,
        confirmText: 'OK',
        cancelText: 'Cancel',
        onConfirm: (overlay, close) => close()
      });
      return;
    }

    showModal({
      title: 'Reset Profile PIN',
      contentHtml: `
        <p>Answer your security recovery question to reset your PIN.</p>
        <div style="margin: 12px 0; padding: 10px 14px; background: rgba(0, 0, 0, 0.04); border-radius: 6px; font-size: 13px; font-weight: 600; color: #0f172a;">
          Question: ${escapeHTML(acct.recoveryQuestion)}
        </div>
        <div class="launch-form-group">
          <label class="launch-form-label">Secret Answer</label>
          <input type="text" id="modal-recovery-answer" class="launch-input" placeholder="Enter answer" style="padding-left: 12px;" autocomplete="off" required />
        </div>
        <div id="modal-recovery-error" class="auth-error" style="display: none; margin-top: 12px; padding: 8px 12px; font-size: 12px;"></div>
      `,
      confirmText: 'Verify Answer',
      onConfirm: async (overlay, close) => {
        const answerInput = overlay.querySelector('#modal-recovery-answer');
        const errorEl = overlay.querySelector('#modal-recovery-error');
        if (!answerInput) return;
        
        const answer = answerInput.value.trim().toLowerCase();
        if (!answer) {
          errorEl.innerText = 'Please enter your answer.';
          errorEl.style.display = 'flex';
          return;
        }

        errorEl.style.display = 'none';
        const hashedAnswer = await hashPassword(answer);
        if (hashedAnswer === acct.recoveryAnswerHash) {
          // Success: prompt for new PIN
          overlay.querySelector('.launch-modal-body').innerHTML = `
            <p style="color: #16a34a; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
              <span class="material-icons-outlined">check_circle</span> Answer verified successfully.
            </p>
            <p>Enter a new password/PIN for this profile. Leave blank for no password protection.</p>
            <div class="launch-form-group" style="margin-top: 12px;">
              <label class="launch-form-label">New PIN / Password</label>
              <input type="password" id="modal-new-pin" class="launch-input" placeholder="Leave blank to remove PIN" style="padding-left: 12px;" />
            </div>
            <div id="modal-new-pin-error" class="auth-error" style="display: none; margin-top: 12px; padding: 8px 12px; font-size: 12px;"></div>
          `;
          
          const confirmBtn = overlay.querySelector('.launch-modal-confirm');
          confirmBtn.innerText = 'Update PIN';
          
          // Re-bind confirm listener
          const newConfirmBtn = confirmBtn.cloneNode(true);
          confirmBtn.replaceWith(newConfirmBtn);
          newConfirmBtn.addEventListener('click', async () => {
            const newPinEl = overlay.querySelector('#modal-new-pin');
            const newPin = newPinEl ? newPinEl.value : '';
            
            let newHasPassword = false;
            let newPasswordHash = null;
            if (newPin) {
              newHasPassword = true;
              newPasswordHash = await hashPassword(newPin);
            }
            
            acct.hasPassword = newHasPassword;
            acct.passwordHash = newPasswordHash;
            
            // Save accounts
            await storageSet('relay_accounts', accounts);
            
            alert('PIN updated successfully.');
            close();
            render();
          });
        } else {
          errorEl.innerText = 'Incorrect answer. Please try again.';
          errorEl.style.display = 'flex';
        }
      }
    });
  };

  // Run initialization
  init();
}
