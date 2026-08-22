// ============================================
// RELAY — CANONICAL STATUS COLORS
// ============================================
// Single source of truth for status colors used in charts, status dots and
// legends. Previously each page defined its own slightly-different palette
// (e.g. "Invoiced" was purple in Reports but grey in the Schedule modal).

export const JOB_STATUS_COLORS = {
  'Pending': '#F59E0B',
  'Scheduled': '#3B82F6',
  'In Progress': '#1B6DE0',
  'On Hold': '#6B7280',
  'Completed': '#10B981',
  'Invoiced': '#8B5CF6',
  'Recurring Template': '#9333EA',
  'Active Templates': '#9333EA'
};

export const DOC_STATUS_COLORS = {
  'Draft': '#6B7280',
  'Finalised': '#1B6DE0',
  'Sent': '#3B82F6',
  'Accepted': '#10B981',
  'Declined': '#EF4444',
  'Paid': '#10B981',
  'Overdue': '#EF4444',
  'Void': '#6B7280'
};

export const JOB_STATUS_BADGES = {
  'Pending': 'badge-warning',
  'Scheduled': 'badge-info',
  'In Progress': 'badge-primary',
  'On Hold': 'badge-neutral',
  'Completed': 'badge-success',
  'Invoiced': 'badge-primary',
  'Recurring Template': 'badge-purple'
};

export const PRIORITY_BADGES = {
  'Low': 'badge-neutral',
  'Medium': 'badge-warning',
  'High': 'badge-danger',
  'Urgent': 'badge-danger'
};
