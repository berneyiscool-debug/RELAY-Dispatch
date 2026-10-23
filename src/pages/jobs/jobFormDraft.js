// ============================================
// RELAY — JOB FORM DRAFT HELPERS
// ============================================
// The job form is one record split across five sidebar tabs, and every tab
// change re-renders the page from `jobFormDraft`. These helpers hold the rules
// that keep that single draft authoritative across re-renders, and that decide
// what a per-section save still needs before it can create the record.

export const EMERGENCY_CALLOUT_FEE = 150;

/**
 * Copy current form values into the draft.
 *
 * FormData omits disabled controls, so a key that disappears keeps its previous
 * value in the draft. Callers clear those explicitly (site/contact labels when
 * no customer is selected) rather than guessing here.
 */
export function mergeDraftValues(draft, values) {
  if (!draft || !values) return draft;
  Object.keys(values).forEach((key) => {
    draft[key] = values[key];
  });
  return draft;
}

/**
 * Fields that must exist before a brand-new job can be written. Section saves
 * create the record on the first save, so this gate applies to every section,
 * not just Details.
 *
 * @param {object} draft
 * @returns {{ field: string, label: string }[]}
 */
export function sectionSaveMissingFields(draft) {
  const missing = [];
  if (!String(draft?.title || '').trim()) missing.push({ field: 'title', label: 'Title' });
  if (!String(draft?.customerId || '').trim()) missing.push({ field: 'customerId', label: 'Customer' });
  return missing;
}

/**
 * The emergency callout fee follows the saved record, not the draft: capturing
 * the form mutates `isEmergency` on the draft before every save, so comparing
 * the draft with itself would silently skip the fee.
 *
 * @param {number} baseLabourCost labour cost on the stored job
 * @param {boolean} wasEmergency the stored job's emergency flag
 * @param {boolean} isEmergency the flag the user wants to save
 */
export function emergencyLabourCost(baseLabourCost, wasEmergency, isEmergency) {
  const base = Number(baseLabourCost) || 0;
  if (isEmergency && !wasEmergency) return base + EMERGENCY_CALLOUT_FEE;
  if (!isEmergency && wasEmergency) return Math.max(0, base - EMERGENCY_CALLOUT_FEE);
  return base;
}
