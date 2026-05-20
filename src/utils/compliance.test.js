import { test, describe } from 'node:test';
import assert from 'node:assert';
import { getDocStatus, getContractorCompliance } from './compliance.js';

describe('Compliance Utility', () => {
  describe('getDocStatus', () => {
    test('returns missing date status when expiryDate is missing', () => {
      const result = getDocStatus({ type: 'Public Liability Insurance' });
      assert.strictEqual(result.status, 'missing');
      assert.strictEqual(result.label, 'Missing Date');
      assert.strictEqual(result.colorClass, 'badge-neutral');
    });

    test('returns expired status when document date is in the past', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const result = getDocStatus({
        type: 'Public Liability Insurance',
        expiryDate: pastDate.toISOString().split('T')[0]
      });
      assert.strictEqual(result.status, 'expired');
      assert.strictEqual(result.label, 'Expired');
      assert.strictEqual(result.colorClass, 'badge-danger');
    });

    test('returns expiring soon status when document expires within 30 days', () => {
      const soonDate = new Date();
      soonDate.setDate(soonDate.getDate() + 15);
      const result = getDocStatus({
        type: 'Public Liability Insurance',
        expiryDate: soonDate.toISOString().split('T')[0]
      });
      assert.strictEqual(result.status, 'expiring');
      assert.ok(result.label.startsWith('Expiring'));
      assert.strictEqual(result.colorClass, 'badge-warning');
    });

    test('returns pending verification when document is active but not verified', () => {
      const activeDate = new Date();
      activeDate.setDate(activeDate.getDate() + 60);
      const result = getDocStatus({
        type: 'Public Liability Insurance',
        expiryDate: activeDate.toISOString().split('T')[0],
        verified: false
      });
      assert.strictEqual(result.status, 'unverified');
      assert.strictEqual(result.label, 'Pending Verification');
      assert.strictEqual(result.colorClass, 'badge-neutral');
    });

    test('returns active when document is active and verified', () => {
      const activeDate = new Date();
      activeDate.setDate(activeDate.getDate() + 60);
      const result = getDocStatus({
        type: 'Public Liability Insurance',
        expiryDate: activeDate.toISOString().split('T')[0],
        verified: true
      });
      assert.strictEqual(result.status, 'active');
      assert.strictEqual(result.label, 'Active');
      assert.strictEqual(result.colorClass, 'badge-success');
    });
  });

  describe('getContractorCompliance', () => {
    test('returns inactive when contractor active flag is false', () => {
      const result = getContractorCompliance({ active: false });
      assert.strictEqual(result.status, 'inactive');
      assert.strictEqual(result.label, 'Inactive');
      assert.strictEqual(result.badgeClass, 'badge-neutral');
    });

    test('returns missing docs when complianceDocs array is empty', () => {
      const result = getContractorCompliance({ active: true, complianceDocs: [] });
      assert.strictEqual(result.status, 'non-compliant');
      assert.strictEqual(result.label, 'Missing Docs');
      assert.strictEqual(result.badgeClass, 'badge-danger');
    });

    test('returns non-compliant when critical documents are missing', () => {
      const soonDate = new Date();
      soonDate.setDate(soonDate.getDate() + 60);
      const contractor = {
        active: true,
        complianceDocs: [
          { type: 'Public Liability Insurance', expiryDate: soonDate.toISOString().split('T')[0], verified: true }
        ]
      };
      const result = getContractorCompliance(contractor);
      assert.strictEqual(result.status, 'non-compliant');
      assert.strictEqual(result.label, 'Missing critical docs');
      assert.strictEqual(result.badgeClass, 'badge-danger');
      assert.ok(result.reason.includes('Workers Compensation'));
    });

    test('returns compliant when all critical docs are present, active and verified', () => {
      const activeDate = new Date();
      activeDate.setDate(activeDate.getDate() + 60);
      const contractor = {
        active: true,
        complianceDocs: [
          { type: 'Public Liability Insurance', expiryDate: activeDate.toISOString().split('T')[0], verified: true },
          { type: 'Workers Compensation', expiryDate: activeDate.toISOString().split('T')[0], verified: true }
        ]
      };
      const result = getContractorCompliance(contractor);
      assert.strictEqual(result.status, 'compliant');
      assert.strictEqual(result.label, 'Compliant');
      assert.strictEqual(result.badgeClass, 'badge-success');
    });
  });
});
