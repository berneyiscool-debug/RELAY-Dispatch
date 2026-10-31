// ============================================
// RELAY — ASSET HIERARCHY
// ============================================
// An asset can sit inside another — breakers in a switchboard, a switchboard
// on a site plant room, a pump in a fire system — through asset.parentAssetId.
// Every walk here guards against cycles, so a bad record can't hang the page.

/** Direct components of an asset, by name. */
export function childrenOf(assets, assetId) {
  if (!assetId) return [];
  return (assets || [])
    .filter(a => a.parentAssetId === assetId && a.id !== assetId)
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
}

/** The chain of parents above an asset, outermost first. */
export function ancestorsOf(assets, asset) {
  const byId = new Map((assets || []).map(a => [a.id, a]));
  const chain = [];
  const seen = new Set([asset?.id]);
  let parent = asset?.parentAssetId ? byId.get(asset.parentAssetId) : null;
  while (parent && !seen.has(parent.id)) {
    chain.unshift(parent);
    seen.add(parent.id);
    parent = parent.parentAssetId ? byId.get(parent.parentAssetId) : null;
  }
  return chain;
}

/** Every asset below this one, at any depth. */
export function descendantIds(assets, assetId) {
  const found = new Set();
  const stack = [assetId];
  while (stack.length) {
    const id = stack.pop();
    (assets || []).forEach(a => {
      if (a.parentAssetId === id && !found.has(a.id) && a.id !== assetId) {
        found.add(a.id);
        stack.push(a.id);
      }
    });
  }
  return found;
}

/**
 * Assets this one may be placed inside: the same owner (the same customer,
 * or both the business's own), and never itself or one of its own
 * components, which would make a loop.
 *
 * @param {object[]} assets
 * @param {{id?: string, ownerType?: string, customerId?: string|null}} asset the asset being placed (no id yet when new)
 */
export function parentOptions(assets, asset) {
  const blocked = asset?.id ? descendantIds(assets, asset.id) : new Set();
  const isCustomer = asset?.ownerType === 'Customer';
  return (assets || [])
    .filter(a => a.id !== asset?.id && !blocked.has(a.id))
    .filter(a => (isCustomer
      ? a.ownerType === 'Customer' && a.customerId && a.customerId === asset.customerId
      : a.ownerType !== 'Customer'))
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
}

/** True when `parentId` is an allowed parent for the asset. */
export function isValidParent(assets, asset, parentId) {
  if (!parentId) return true;
  return parentOptions(assets, asset).some(a => a.id === parentId);
}
