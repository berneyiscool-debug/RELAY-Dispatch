// ============================================
// RELAY — TIME TRACKING MODULE NAVIGATION
// ============================================
// Time Tracking (/timesheets, under Admin) is three screens, one per question a
// manager actually asks about time:
//
//   clock   — Clock History: every clock in and out per technician per day, the breaks
//             between them, and the approval of those clocked hours
//   jobs    — Job Hours: hours booked against jobs (a record, not something approved)
//   compare — Clocked vs Job Hours: what was on the clock next to what was booked to
//             jobs, so unbooked time is visible
//
// Retired ?tab= ids (the old Hours / Timesheets / Attendance / Payroll sections) still
// resolve to the screen that absorbed them, so existing links keep working.

export const MODULE_LABEL = 'Time Tracking';

export const SECTIONS = [
  { id: 'clock', icon: 'punch_clock', label: 'Clock History' },
  { id: 'jobs', icon: 'timer', label: 'Job Hours' },
  { id: 'compare', icon: 'compare_arrows', label: 'Clocked vs Job Hours' },
];

const DEFAULT_SECTION = 'clock';

// ?tab= ids from before the rework → the section that absorbed them.
const LEGACY_TABS = {
  hours: 'clock',
  attendance: 'clock',
  payroll: 'clock',
  'whos-in': 'clock',
  'attendance-approvals': 'clock',
  timesheets: 'jobs',
  'schedule-vs-actual': 'compare',
};

/**
 * Resolve a ?tab= id (including legacy ids) to a valid section. Every section is a
 * single screen now, so `view` is always null; the shape is kept for callers.
 */
export function resolveSection(tab) {
  const candidate = LEGACY_TABS[tab] || tab;
  const section = SECTIONS.some(s => s.id === candidate) ? candidate : DEFAULT_SECTION;
  return { section, view: null };
}

export function sectionTitle(section) {
  return (SECTIONS.find(s => s.id === section) || SECTIONS[0]).label;
}

/** Kept for callers that still ask; no section has sub-views. */
export function sectionViews() {
  return [];
}

export function viewTitle(section) {
  return sectionTitle(section);
}

/** The sidebar's copy of the same shape: one plain link per section. */
export function sectionNav() {
  return SECTIONS.map(section => ({
    id: section.id,
    icon: section.icon,
    label: section.label,
    path: sectionPath(section.id),
  }));
}

/** Hash-router path for a section, e.g. `/timesheets?tab=compare`. */
export function sectionPath(section) {
  return `/timesheets?tab=${section}`;
}
