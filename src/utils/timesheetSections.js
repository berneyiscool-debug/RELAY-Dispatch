// ============================================
// RELAY — TIMESHEETS MODULE NAVIGATION
// ============================================
// The Timesheets area is four sections in the sidebar. A section that covers more
// than one view opens as a second menu level under its own item (?view=), the same way
// a rail category opens a submenu, so related screens sit together under their parent
// instead of competing as separate nav items or as an extra in-page switcher.
//
//   hours      — the payroll record: technician × day hours for a period
//   timesheets — hours booked against jobs
//   attendance — the session log: every clock in and out, with location
//   payroll    — the pay run, plus rostered-vs-worked variance
//
// Pre-consolidation ?tab= ids are still accepted so existing links keep resolving.

export const SECTIONS = [
  { id: 'hours', icon: 'hourglass_empty', label: 'Hours' },
  { id: 'timesheets', icon: 'schedule', label: 'Timesheets' },
  { id: 'attendance', icon: 'task_alt', label: 'Attendance' },
  { id: 'payroll', icon: 'payments', label: 'Payroll' },
];

export const SECTION_VIEWS = {
  payroll: [
    { id: 'run', icon: 'payments', label: 'Pay Run', hint: 'Clock hours per technician, with anything blocking payment' },
    { id: 'variance', icon: 'sync_alt', label: 'Roster vs Actual', hint: 'Rostered hours compared to hours actually worked' },
  ],
};

const DEFAULT_VIEW = { payroll: 'run' };

// ?tab= ids from before the consolidation → the section + view that absorbed them.
// "Who's In Today" is retired: live presence now lives in the Schedule panel, and a
// period of recorded hours is the Hours page.
const LEGACY_TABS = {
  'whos-in': { section: 'hours', view: null },
  'attendance-approvals': { section: 'hours', view: null },
  'schedule-vs-actual': { section: 'payroll', view: 'variance' },
};

/**
 * Resolve a ?tab= / ?view= pair (including legacy ids) to a valid section + view.
 * Unknown ids fall back to the Timesheets list rather than rendering nothing.
 */
export function resolveSection(tab, view) {
  const legacy = LEGACY_TABS[tab];
  const candidate = legacy ? legacy.section : tab;
  const section = SECTIONS.some(s => s.id === candidate) ? candidate : 'timesheets';
  const views = SECTION_VIEWS[section] || [];
  if (views.length === 0) return { section, view: null };

  const wanted = view || (legacy ? legacy.view : '') || DEFAULT_VIEW[section];
  const resolved = views.some(v => v.id === wanted) ? wanted : views[0].id;
  return { section, view: resolved };
}

export function sectionTitle(section) {
  return (SECTIONS.find(s => s.id === section) || SECTIONS[0]).label;
}

/** A section's views, or an empty list for sections that have just one screen. */
export function sectionViews(section) {
  return SECTION_VIEWS[section] || [];
}

/**
 * Page heading for a section + view: the view's label where the section has views
 * ("Pay Run"), otherwise the section's own label ("Hours"). The sidebar carries the
 * section context, so the heading names the exact screen you are on.
 */
export function viewTitle(section, view) {
  const match = sectionViews(section).find(v => v.id === view);
  return match ? match.label : sectionTitle(section);
}

/**
 * The sidebar's copy of the same shape: one entry per section, with the views of a
 * multi-screen section nested as `children`. Children are not rendered inline — a parent
 * with children opens them as the menu's next level, and a single-screen section stays a
 * plain link.
 */
export function sectionNav() {
  return SECTIONS.map(section => {
    const node = { id: section.id, icon: section.icon, label: section.label, path: sectionPath(section.id, null) };
    const views = sectionViews(section.id);
    if (views.length === 0) return node;

    node.children = views.map(view => ({
      id: view.id,
      icon: view.icon,
      label: view.label,
      hint: view.hint,
      path: sectionPath(section.id, view.id),
    }));
    return node;
  });
}

/** Hash-router path for a section, e.g. `/timesheets?tab=payroll&view=variance`. */
export function sectionPath(section, view) {
  return view ? `/timesheets?tab=${section}&view=${view}` : `/timesheets?tab=${section}`;
}
