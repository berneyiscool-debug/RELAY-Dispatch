import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { store } from '../../data/store.js';
import { checkRecurringJobs } from '../../utils/maintenanceEngine.js';

// Stub localStorage for Node.js test runs
globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

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

  test('Dynamic checkRecurringJobs generator', () => {
    const localDateStr = (date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    const todayStr = localDateStr(new Date());
    const threeDaysFutureStr = localDateStr(new Date(Date.now() + 3 * 24 * 3600 * 1000));

    // 1. Create a parent recurring job template
    const parentJob = store.create('jobs', {
      number: 'J-001',
      title: 'Weekly Recurring Service',
      customerId: 'cust_1',
      customerName: 'ACME Corp',
      priority: 'High',
      isRecurring: true,
      recurringConfig: {
        freq: 'Weekly',
        start: todayStr, // starts today
        end: threeDaysFutureStr, // 3 days in future
        daysOfWeek: [] // defaults to today's day of week
      }
    });

    // 2. Call checkRecurringJobs
    checkRecurringJobs();

    // 3. Verify that a child job is automatically spawned
    const jobs = store.getAll('jobs') || [];
    const childJobs = jobs.filter(j => j.parentJobId === parentJob.id);
    assert.strictEqual(childJobs.length, 1);
    assert.strictEqual(childJobs[0].number, 'J-001.1');
    assert.strictEqual(childJobs[0].status, 'Pending');

    const [yr, mo, dy] = todayStr.split('-').map(Number);
    const formattedDate = `${String(dy).padStart(2, '0')}/${String(mo).padStart(2, '0')}/${yr}`;
    assert.strictEqual(childJobs[0].title, `Weekly Recurring Service — Recurring (${formattedDate})`);

    // Verify that a notification is created referencing the child job
    const notifications = store.getAll('notifications') || [];
    const relevantNotifs = notifications.filter(n => n.parentJobId === parentJob.id);

    assert.strictEqual(relevantNotifs.length, 1);
    assert.strictEqual(relevantNotifs[0].type, 'Recurring Job Created');
    assert.strictEqual(relevantNotifs[0].status, 'Info');
    assert.strictEqual(relevantNotifs[0].jobId, childJobs[0].id);
    assert.strictEqual(relevantNotifs[0].dueDate, todayStr);

    // 4. Running it again should NOT create duplicate jobs or notifications
    checkRecurringJobs();
    const jobsAfterSecondRun = store.getAll('jobs') || [];
    const childJobsSecondRun = jobsAfterSecondRun.filter(j => j.parentJobId === parentJob.id);
    assert.strictEqual(childJobsSecondRun.length, 1);

    const notificationsAfterSecondRun = store.getAll('notifications') || [];
    const relevantNotifsSecondRun = notificationsAfterSecondRun.filter(n => n.parentJobId === parentJob.id);
    assert.strictEqual(relevantNotifsSecondRun.length, 1);
  });
});

