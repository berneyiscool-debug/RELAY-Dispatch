// ============================================
// RELAY DISPATCH — SETTINGS TAB RESOLUTION
// ============================================
// Some settings pages were renamed, merged or absorbed into a sub-tab. Their old
// `?tab=` links are kept working, so both the settings page (which content to
// render) and the sidebar (which group to drill into) have to agree on the
// canonical tab — otherwise the sidebar highlights nothing and loses its
// "Back to Settings" button while the content pane sits inside a submenu.

export const SETTINGS_DEFAULT_TAB = 'company';

const DEFAULT_TEMPLATES_SUBTAB = 'tasklists';
const DEFAULT_USERS_SUBTAB = 'users';

export const TAB_ALIASES = {
  // Templates & Forms absorbed the standalone task and quote-template pages.
  forms: { tab: 'templates_forms', templatesSubTab: 'forms' },
  tasks: { tab: 'templates_forms', templatesSubTab: 'tasklists' },
  tasklists: { tab: 'templates_forms', templatesSubTab: 'tasklists' },
  quote_templates: { tab: 'templates_forms', templatesSubTab: 'quotes' },
  quotes: { tab: 'templates_forms', templatesSubTab: 'quotes' },

  // Users absorbed the standalone user-type and password-recovery pages.
  users: { tab: 'users', usersSubTab: 'users' },
  user_types: { tab: 'users', usersSubTab: 'user_types' },
  password_recovery: { tab: 'users', usersSubTab: 'password_recovery' },

  // Email Templates was merged into the Email & Domain tab.
  email_templates: { tab: 'email' },

  // The model provider and credentials are RELAY's own, so the old AI/API
  // sub-tabs are gone.
  api_keys: { tab: 'company' },
  ai_assistant: { tab: 'company' },

  // Folder Sync and Local Data Backup described the same directory handle.
  folder_sync: { tab: 'local_storage' }
};

// Returns the canonical tab id plus the sub-tab each legacy link should open.
// Unknown values pass straight through, and an absent/blank value returns an
// empty tab so callers can apply their own landing default.
export function resolveSettingsTab(rawTab) {
  const raw = typeof rawTab === 'string' ? rawTab.trim() : '';
  const alias = raw ? TAB_ALIASES[raw] : null;
  return {
    tab: alias ? alias.tab : raw,
    templatesSubTab: (alias && alias.templatesSubTab) || DEFAULT_TEMPLATES_SUBTAB,
    usersSubTab: (alias && alias.usersSubTab) || DEFAULT_USERS_SUBTAB
  };
}
