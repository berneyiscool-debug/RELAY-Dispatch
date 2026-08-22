// ============================================
// FIELDFORGE — PRICING & MARKUP UTILS
// ============================================

/**
 * Rounds a currency value to 2 decimals, avoiding the floating-point drift
 * (e.g. 55.55 * 0.1 = 5.5550000000000006) that would otherwise be persisted
 * into numeric DB columns and PDFs. Use for every GST/total computation.
 * @param {number} value
 * @returns {number}
 */
export function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates the billable price for a material item based on tiered settings.
 * @param {number} unitCost - The internal cost of the item.
 * @param {object} settings - The global settings object from store.getSettings().
 * @returns {number} - The billable price (cost + markup).
 */
export function calculateBillableMaterialPrice(unitCost, settings) {
  if (!unitCost || unitCost <= 0) return 0;
  
  const config = settings.materialMarkup || { defaultPercent: 30, minMarkupAmount: 0, useTiers: false, tiers: [] };
  let markupPercent = config.defaultPercent || 30;

  if (config.useTiers && config.tiers && config.tiers.length > 0) {
    // Tiers are expected to be sorted by upTo (handled in Settings.js save)
    const tier = config.tiers.find(t => t.upTo === null || unitCost <= t.upTo);
    if (tier) {
      markupPercent = tier.percent;
    }
  }

  const markupAmount = unitCost * (markupPercent / 100);
  const finalMarkup = Math.max(markupAmount, config.minMarkupAmount || 0);
  
  return unitCost + finalMarkup;
}

/**
 * Calculates total billable materials for an array of items.
 */
export function calculateTotalBillableMaterials(materials, settings) {
  return materials.reduce((sum, m) => {
    const billableUnit = calculateBillableMaterialPrice(m.unitCost || 0, settings);
    return sum + (billableUnit * (m.quantity || 1));
  }, 0);
}
