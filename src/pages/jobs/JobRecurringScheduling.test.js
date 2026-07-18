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

  test('Auto-scheduling of recurring child jobs with defaultTechnicianId', () => {
    const localDateStr = (date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    const todayStr = localDateStr(new Date());

    // 1. Create a technician
    const tech = store.create('technicians', {
      name: 'Bob the Builder'
    });

    // 2. Create a parent recurring job template with defaultTechnicianId
    const parentJob = store.create('jobs', {
      number: 'J-002',
      title: 'Weekly Servicing Template',
      customerId: 'cust_1',
      customerName: 'ACME Corp',
      priority: 'Normal',
      preferredTime: '14:00',
      estimatedHours: 3,
      isRecurring: true,
      recurringConfig: {
        freq: 'Weekly',
        start: todayStr,
        end: todayStr,
        defaultTechnicianId: tech.id,
        daysOfWeek: []
      }
    });

    // 3. Run recurring check
    checkRecurringJobs();

    // 4. Assert that child job was spawned as Scheduled
    const childJobs = store.getAll('jobs').filter(j => j.parentJobId === parentJob.id);
    assert.strictEqual(childJobs.length, 1);
    assert.strictEqual(childJobs[0].status, 'Scheduled');
    assert.strictEqual(childJobs[0].technicianId, tech.id);
    assert.strictEqual(childJobs[0].technicianName, 'Bob the Builder');

    // 5. Assert that a schedule record was created for the child job
    const schedules = store.getAll('schedule').filter(s => s.jobId === childJobs[0].id);
    assert.strictEqual(schedules.length, 1);
    assert.strictEqual(schedules[0].technicianId, tech.id);
    assert.strictEqual(schedules[0].technicianName, 'Bob the Builder');
    assert.strictEqual(schedules[0].date, todayStr);
    assert.strictEqual(schedules[0].startTime, `${todayStr}T14:00`);
    assert.strictEqual(schedules[0].finishTime, `${todayStr}T17:00`);
    assert.strictEqual(schedules[0].hours, 3);
  });

  test('Auto-scheduling uses parent tasklist hours for duration', () => {
    const localDateStr = (date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    const todayStr = localDateStr(new Date());

    const tech = store.create('technicians', {
      name: 'Alice Cooper'
    });

    const parentJob = store.create('jobs', {
      number: 'J-003',
      title: 'Tasklist Servicing Template',
      customerId: 'cust_1',
      customerName: 'ACME Corp',
      priority: 'Normal',
      preferredTime: '10:30',
      isRecurring: true,
      tasks: [
        { id: 't1', name: 'Task 1', estimatedHours: 0.5, subTasks: [] },
        { id: 't2', name: 'Task 2', estimatedHours: 0, subTasks: [
          { id: 'st1', name: 'Subtask 1', estimatedHours: 1.5 }
        ]}
      ],
      recurringConfig: {
        freq: 'Weekly',
        start: todayStr,
        end: todayStr,
        defaultTechnicianId: tech.id,
        daysOfWeek: []
      }
    });

    checkRecurringJobs();

    const childJobs = store.getAll('jobs').filter(j => j.parentJobId === parentJob.id);
    assert.strictEqual(childJobs.length, 1);

    const schedules = store.getAll('schedule').filter(s => s.jobId === childJobs[0].id);
    assert.strictEqual(schedules.length, 1);
    // Total tasklist hours = 0.5 + 1.5 = 2.0 hours
    assert.strictEqual(schedules[0].hours, 2.0);
    assert.strictEqual(schedules[0].startTime, `${todayStr}T10:30`);
    assert.strictEqual(schedules[0].finishTime, `${todayStr}T12:30`);
  });
});

