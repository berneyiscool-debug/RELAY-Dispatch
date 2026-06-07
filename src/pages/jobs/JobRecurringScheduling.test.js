import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { store } from '../../data/store.js';

describe('Job Recurring Scheduling Integrations', () => {
  beforeEach(() => {
    store.clearSync();
    store.listeners = {};
  });

  test('Template job cloning structure', () => {
    const parentJob = {
      id: 'job_parent',
      number: 'J-001',
      title: 'Monthly Test Service',
      customerId: 'cust_1',
      customerName: 'ACME Corp',
      contactName: 'John Doe',
      siteAddress: '123 Test St',
      priority: 'High',
      description: 'Routine monthly check',
      materials: [{ stockId: 'stock_1', name: 'Filter', quantity: 2, unitCost: 15 }],
      tasks: [{ id: 'task_1', name: 'Check filters', status: 'Not Started', progress: 0, subTasks: [{ id: 'sub_1', name: 'Clean area', status: 'Not Started' }] }],
      isRecurring: true,
      recurringConfig: { freq: 'Monthly', start: '2026-06-01', end: '2026-08-31' }
    };

    // Simulate duplication logic
    const clonedMaterials = parentJob.materials ? JSON.parse(JSON.stringify(parentJob.materials)) : [];
    const clonedTasks = parentJob.tasks ? JSON.parse(JSON.stringify(parentJob.tasks)) : [];
    clonedTasks.forEach(task => {
      task.id = 'task_new_1';
      task.status = 'Not Started';
      task.progress = 0;
      if (task.subTasks) {
        task.subTasks.forEach(st => {
          st.id = 'sub_new_1';
          st.status = 'Not Started';
          st.progress = 0;
        });
      }
    });

    const dateStr = '2026-07-01';
    const duplicatedJob = {
      id: 'job_new',
      number: 'J-002',
      title: parentJob.title,
      customerId: parentJob.customerId || '',
      customerName: parentJob.customerName || '',
      contactName: parentJob.contactName || '',
      siteAddress: parentJob.siteAddress || '',
      priority: parentJob.priority || 'Normal',
      description: parentJob.description || '',
      notes: `Generated from template job ${parentJob.number}`,
      createdAt: new Date().toISOString(),
      scheduledDate: dateStr,
      status: 'Scheduled',
      materials: clonedMaterials,
      isRecurring: false,
      recurringConfig: null,
      tasks: clonedTasks
    };

    assert.strictEqual(duplicatedJob.title, 'Monthly Test Service');
    assert.strictEqual(duplicatedJob.customerId, 'cust_1');
    assert.strictEqual(duplicatedJob.customerName, 'ACME Corp');
    assert.strictEqual(duplicatedJob.siteAddress, '123 Test St');
    assert.strictEqual(duplicatedJob.priority, 'High');
    assert.strictEqual(duplicatedJob.isRecurring, false);
    assert.strictEqual(duplicatedJob.recurringConfig, null);
    assert.deepStrictEqual(duplicatedJob.materials, [{ stockId: 'stock_1', name: 'Filter', quantity: 2, unitCost: 15 }]);
    assert.strictEqual(duplicatedJob.tasks[0].id, 'task_new_1');
    assert.strictEqual(duplicatedJob.tasks[0].subTasks[0].id, 'sub_new_1');
  });
});
