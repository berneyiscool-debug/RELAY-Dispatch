// ============================================
// RELAY — TOOLBAR FILTER TAGS (shared by list pages)
// ============================================

// Builds the list of filter tags for a given data set. Each tag has a stable
// `key` used to match records, and a human `label` (with counts) for the UI.
export function getToolbarFilterTags(originalData, filterType) {
  const tags = [{ key: 'all', label: `All (${originalData.length})` }];

  if (filterType === 'stock') {
    const categories = [...new Set(originalData.map(s => s.category))];
    categories.forEach(cat => {
      const count = originalData.filter(s => s.category === cat).length;
      if (count > 0) tags.push({ key: `cat:${cat}`, label: `${cat} (${count})` });
    });

    const inStockCount = originalData.filter(s => {
      const totalQty = (s.locations || []).reduce((sum, l) => sum + l.quantity, 0);
      return totalQty > (s.reorderLevel || 0);
    }).length;
    if (inStockCount > 0) tags.push({ key: 'smart:instock', label: `In Stock (${inStockCount})` });

    const lowStockCount = originalData.filter(s => {
      const totalQty = (s.locations || []).reduce((sum, l) => sum + l.quantity, 0);
      return totalQty <= (s.reorderLevel || 0) && totalQty > 0;
    }).length;
    if (lowStockCount > 0) tags.push({ key: 'smart:lowstock', label: `Low Stock (${lowStockCount})` });

    const outStockCount = originalData.filter(s => {
      const totalQty = (s.locations || []).reduce((sum, l) => sum + l.quantity, 0);
      return totalQty === 0;
    }).length;
    if (outStockCount > 0) tags.push({ key: 'smart:outofstock', label: `Out of Stock (${outStockCount})` });

    const hiCostCount = originalData.filter(s => (s.unitPrice || 0) > 100).length;
    if (hiCostCount > 0) tags.push({ key: 'smart:highcost', label: `High Cost (> $100) (${hiCostCount})` });

  } else if (filterType === 'kits') {
    const categories = [...new Set(originalData.map(k => k.category).filter(Boolean))].sort();
    categories.forEach(cat => {
      const count = originalData.filter(k => k.category === cat).length;
      if (count > 0) tags.push({ key: `cat:${cat}`, label: `${cat} (${count})` });
    });

    const hiMarginCount = originalData.filter(k => {
      const margin = k.totalPrice > 0 ? ((k.totalPrice - k.totalCost) / k.totalPrice * 100) : 0;
      return margin >= 30;
    }).length;
    if (hiMarginCount > 0) tags.push({ key: 'smart:himargin', label: `High Margin (≥ 30%) (${hiMarginCount})` });
  }

  return tags;
}

// Returns true when a record matches a single filter tag key.
export function toolbarFilterMatches(item, filterKey, filterType) {
  if (filterKey === 'all') return true;
  const [type, value] = filterKey.split(':');

  if (filterType === 'stock') {
    if (type === 'cat') return item.category === value;
    const totalQty = (item.locations || []).reduce((sum, l) => sum + l.quantity, 0);
    if (filterKey === 'smart:instock') return totalQty > (item.reorderLevel || 0);
    if (filterKey === 'smart:lowstock') return totalQty <= (item.reorderLevel || 0) && totalQty > 0;
    if (filterKey === 'smart:outofstock') return totalQty === 0;
    if (filterKey === 'smart:highcost') return (item.unitPrice || 0) > 100;
  }

  if (filterType === 'kits') {
    if (type === 'cat') return item.category === value;
    if (filterKey === 'smart:himargin') {
      const margin = item.totalPrice > 0 ? ((item.totalPrice - item.totalCost) / item.totalPrice * 100) : 0;
      return margin >= 30;
    }
  }

  return false;
}
