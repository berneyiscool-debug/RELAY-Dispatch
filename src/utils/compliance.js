// ============================================
// FIELDFORGE — COMPLIANCE UTILITIES
// ============================================

const CRITICAL_DOCS = ['Public Liability Insurance', 'Workers Compensation'];

/**
 * Computes the status of a single compliance document.
 * @param {Object} doc - The document object.
 * @returns {Object} { status, label, colorClass }
 */
export function getDocStatus(doc) {
  if (!doc.expiryDate) {
    return {
      status: 'missing',
      label: 'Missing Date',
      colorClass: 'badge-neutral'
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(doc.expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'expired',
      label: 'Expired',
      colorClass: 'badge-danger'
    };
  } else if (diffDays <= 30) {
    return {
      status: 'expiring',
      label: `Expiring (${diffDays}d)`,
      colorClass: 'badge-warning'
    };
  } else if (!doc.verified) {
    return {
      status: 'unverified',
      label: 'Pending Verification',
      colorClass: 'badge-neutral'
    };
  }

  return {
    status: 'active',
    label: 'Active',
    colorClass: 'badge-success'
  };
}

/**
 * Computes the overall compliance status of a contractor.
 * @param {Object} contractor - The contractor object.
 * @returns {Object} { status, label, badgeClass }
 */
export function getContractorCompliance(contractor) {
  // If contractor is explicitly set to inactive, show Inactive
  if (!contractor.active) {
    return {
      status: 'inactive',
      label: 'Inactive',
      badgeClass: 'badge-neutral'
    };
  }

  const docs = contractor.complianceDocs || [];

  if (docs.length === 0) {
    return {
      status: 'non-compliant',
      label: 'Missing Docs',
      badgeClass: 'badge-danger'
    };
  }

  // Check if critical documents are missing entirely
  const docTypes = docs.map(d => d.type.toLowerCase().trim());
  const missingCritical = CRITICAL_DOCS.filter(crit => 
    !docTypes.some(type => type.includes(crit.toLowerCase()))
  );

  if (missingCritical.length > 0) {
    return {
      status: 'non-compliant',
      label: 'Missing critical docs',
      badgeClass: 'badge-danger',
      reason: `Missing: ${missingCritical.join(', ')}`
    };
  }

  // Evaluate individual document statuses
  let hasExpired = false;
  let hasExpiring = false;
  let hasUnverified = false;

  docs.forEach(d => {
    const docStat = getDocStatus(d);
    if (docStat.status === 'expired') {
      hasExpired = true;
    } else if (docStat.status === 'expiring') {
      hasExpiring = true;
    } else if (docStat.status === 'unverified') {
      hasUnverified = true;
    }
  });

  if (hasExpired) {
    return {
      status: 'non-compliant',
      label: 'Expired Credentials',
      badgeClass: 'badge-danger'
    };
  }

  if (hasExpiring) {
    return {
      status: 'warning',
      label: 'Expiring Credentials',
      badgeClass: 'badge-warning'
    };
  }

  if (hasUnverified) {
    return {
      status: 'warning',
      label: 'Pending Review',
      badgeClass: 'badge-warning'
    };
  }

  return {
    status: 'compliant',
    label: 'Compliant',
    badgeClass: 'badge-success'
  };
}
