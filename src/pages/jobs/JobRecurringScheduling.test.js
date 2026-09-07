import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { store } from '../../data/store.js';
import { checkRecurringJobs, cleanOldJobTitles } from '../../utils/maintenanceEngine.js';

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
    assert.strictEqual(childJobs[0].title, `Weekly Recurring Service`);

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

  test('Reassigning a template Default Technician propagates to existing and new children', async () => {
    const { checkRecurringJobs: crj, propagateParentJobUpdates: ppju } = await import('../../utils/maintenanceEngine.js');

    const localDateStr = (date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    const addDays = (base, n) => { const d = new Date(base); d.setDate(d.getDate() + n); return d; };

    const today = new Date();
    const todayStr = localDateStr(today);
    const startStr = localDateStr(addDays(today, -60)); // template started 60 days ago
    const endStr = localDateStr(addDays(today, 30));    // still active
    const existingChildDate = localDateStr(addDays(today, 30));

    // Two technicians: the originally-assigned one and the new default
    const oldTech = store.create('technicians', { name: 'Old Tech' });
    const newTech = store.create('technicians', { name: 'New Tech' });

    // Recurring template whose `start` is in the past (previously no future
    // occurrences were generated) with no default tech yet.
    const template = store.create('jobs', {
      number: 'J-040',
      title: 'Recurring Service',
      customerId: 'cust_40',
      customerName: 'Apex Power',
      priority: 'Normal',
      isRecurring: true,
      recurringConfig: { freq: 'Weekly', start: startStr, end: endStr, daysOfWeek: [] }
    });

    // An existing future child already scheduled on the old tech
    const existingChild = store.create('jobs', {
      parentJobId: template.id,
      number: 'J-040.1',
      title: 'Recurring Service',
      scheduledDate: existingChildDate,
      templateDate: existingChildDate,
      status: 'Scheduled',
      technicianId: oldTech.id,
      technicianName: oldTech.name
    });
    store.create('schedule', {
      type: 'schedule',
      jobId: existingChild.id,
      jobNumber: existingChild.number,
      technicianId: oldTech.id,
      technicianName: oldTech.name,
      date: existingChildDate,
      startTime: `${existingChildDate}T08:00`,
      finishTime: `${existingChildDate}T10:00`,
      hours: 2,
      startHour: 8,
      endHour: 10,
      taskId: null,
      taskName: 'Whole Job'
    });

    // Reproduce the JobDetail Save handler for the Default Technician dropdown:
    // 1. update the template's recurringConfig.defaultTechnicianId
    const updatedJob = store.update('jobs', template.id, {
      recurringConfig: { ...template.recurringConfig, defaultTechnicianId: newTech.id }
    });
    // 2. run the recurring engine (materializes upcoming occurrences with the new tech)
    crj();
    // 3. propagate the new default tech to existing children
    ppju(updatedJob);

    // Existing future child is re-pointed to the new default tech
    const existingFresh = store.getById('jobs', existingChild.id);
    assert.strictEqual(existingFresh.technicianId, newTech.id);
    assert.strictEqual(existingFresh.technicianName, newTech.name);

    // Its whole-job dispatch entry is re-pointed too
    const wholeJob = store.getAll('schedule').find(s => s.jobId === existingChild.id && s.taskId === null);
    assert.strictEqual(wholeJob.technicianId, newTech.id);
    assert.strictEqual(wholeJob.technicianName, newTech.name);

    // A near-term occurrence was materialized with the new default tech
    const children = store.getAll('jobs').filter(j => j.parentJobId === template.id);
    const materialized = children.find(j => j.id !== existingChild.id);
    assert.ok(materialized, 'expected a new recurring child to be materialized');
    assert.strictEqual(materialized.technicianId, newTech.id);
    assert.strictEqual(materialized.technicianName, newTech.name);
  });

  test('Virtual occurrences calculation and materialization via right-click action', async () => {
    const { getVirtualRecurringOccurrences, materializeVirtualOccurrence } = await import('../../utils/maintenanceEngine.js');

    // Use dates relative to today so this test stays valid as the clock advances
    // (getRecurringDates fast-forwards to today for templates that started in the past).
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = (offset) => { const d = new Date(today); d.setDate(d.getDate() + offset); return fmt(d); };

    const parentJob = store.create('jobs', {
      number: 'J-010',
      title: 'Future Generator Service',
      customerId: 'cust_10',
      customerName: 'Future Tech Ltd',
      siteAddress: '456 Future Way',
      priority: 'High',
      estimatedHours: 3,
      isRecurring: true,
      recurringConfig: {
        freq: 'Daily',
        start: day(1),
        end: day(3)
      }
    });

    // 1. Calculate virtual occurrences for the coming 5 days
    const virtualOccs = getVirtualRecurringOccurrences(day(0), day(5));
    assert.strictEqual(virtualOccs.length, 3);
    assert.strictEqual(virtualOccs[0].scheduledDate, day(1));
    assert.strictEqual(virtualOccs[1].scheduledDate, day(2));
    assert.strictEqual(virtualOccs[2].scheduledDate, day(3));
    assert.strictEqual(virtualOccs[0].title, 'Future Generator Service');

    // Verify database does NOT contain spawned jobs yet (forecast mode)
    const initialChildren = store.getAll('jobs').filter(j => j.parentJobId === parentJob.id);
    assert.strictEqual(initialChildren.length, 0);

    // 2. Materialize the first virtual occurrence explicitly (User right-clicks -> "Create as Job")
    const materializedJob = materializeVirtualOccurrence(parentJob.id, day(1), 'tech_99', 9, 3);
    assert.ok(materializedJob);
    assert.strictEqual(materializedJob.parentJobId, parentJob.id);
    assert.strictEqual(materializedJob.number, 'J-010.1');
    assert.strictEqual(materializedJob.scheduledDate, day(1));
    assert.strictEqual(materializedJob.status, 'Scheduled');

    // 3. Re-calculate virtual occurrences: day(1) should no longer be virtual because real child exists!
    const virtualOccsAfter = getVirtualRecurringOccurrences(day(0), day(5));
    assert.strictEqual(virtualOccsAfter.length, 2);
    assert.strictEqual(virtualOccsAfter[0].scheduledDate, day(2));
  });

  test('Parent-to-child template propagation updates active child jobs', async () => {
    const { propagateParentJobUpdates } = await import('../../utils/maintenanceEngine.js');

    const parentJob = store.create('jobs', {
      number: 'J-020',
      title: 'Original Title',
      description: 'Original Description',
      customerId: 'cust_20',
      customerName: 'Apex Power',
      siteAddress: '100 Power St',
      priority: 'Normal',
      isRecurring: true,
      tasks: [
        { id: 'pt1', name: 'Inspection', status: 'Not Started', progress: 0 }
      ]
    });

    const childJob1 = store.create('jobs', {
      parentJobId: parentJob.id,
      number: 'J-020.1',
      title: 'Original Title',
      description: 'Original Description',
      scheduledDate: '2026-10-01',
      status: 'Scheduled',
      tasks: [
        { id: 'ct1', name: 'Inspection', status: 'In Progress', progress: 50 }
      ]
    });

    const childJobCompleted = store.create('jobs', {
      parentJobId: parentJob.id,
      number: 'J-020.0',
      title: 'Original Title',
      description: 'Original Description',
      scheduledDate: '2026-09-01',
      status: 'Completed',
      tasks: [
        { id: 'ct0', name: 'Inspection', status: 'Completed', progress: 100 }
      ]
    });

    // Update parent job
    const updatedParent = store.update('jobs', parentJob.id, {
      title: 'Updated Master Service',
      description: 'Updated Master Description',
      siteAddress: '999 New Power Way',
      priority: 'Urgent',
      tasks: [
        { id: 'pt1', name: 'Inspection', status: 'Not Started', progress: 0 },
        { id: 'pt2', name: 'Oil Filter Replacement', status: 'Not Started', progress: 0 }
      ]
    });

    // Propagate changes
    propagateParentJobUpdates(updatedParent);

    // Verify active child job updated with new template fields while keeping task progress
    const child1Fresh = store.getById('jobs', childJob1.id);
    assert.strictEqual(child1Fresh.description, 'Updated Master Description');
    assert.strictEqual(child1Fresh.siteAddress, '999 New Power Way');
    assert.strictEqual(child1Fresh.priority, 'Urgent');
    assert.strictEqual(child1Fresh.tasks.length, 2);
    assert.strictEqual(child1Fresh.tasks[0].name, 'Inspection');
    assert.strictEqual(child1Fresh.tasks[0].status, 'In Progress');
    assert.strictEqual(child1Fresh.tasks[0].progress, 50);

    // Verify completed child job was NOT modified
    const childCompletedFresh = store.getById('jobs', childJobCompleted.id);
    assert.strictEqual(childCompletedFresh.description, 'Original Description');
    assert.strictEqual(childCompletedFresh.status, 'Completed');
  });

  test('Default technician propagates to active child jobs and re-points their whole-job dispatch', async () => {
    const { propagateParentJobUpdates } = await import('../../utils/maintenanceEngine.js');

    const tech = store.create('technicians', { id: 'tech_alpha', name: 'Alpha Tech' });

    const parentJob = store.create('jobs', {
      number: 'J-030',
      title: 'Recurring Service',
      isRecurring: true,
      recurringConfig: { freq: 'Weekly', start: '2026-01-01', end: '2026-12-31', defaultTechnicianId: tech.id }
    });

    const childJob = store.create('jobs', {
      parentJobId: parentJob.id,
      number: 'J-030.1',
      title: 'Recurring Service',
      scheduledDate: '2026-10-01',
      status: 'Scheduled',
      technicianId: 'tech_old',
      technicianName: 'Old Tech'
    });

    const completedChild = store.create('jobs', {
      parentJobId: parentJob.id,
      number: 'J-030.2',
      title: 'Recurring Service',
      scheduledDate: '2026-09-01',
      status: 'Completed',
      technicianId: 'tech_old',
      technicianName: 'Old Tech'
    });

    store.create('schedule', {
      type: 'schedule',
      jobId: childJob.id,
      jobNumber: childJob.number,
      technicianId: 'tech_old',
      technicianName: 'Old Tech',
      date: '2026-10-01',
      startTime: '2026-10-01T08:00',
      finishTime: '2026-10-01T10:00',
      hours: 2,
      startHour: 8,
      endHour: 10,
      taskId: null,
      taskName: 'Whole Job'
    });

    // A manual task-level dispatch must NOT be re-pointed
    store.create('schedule', {
      type: 'schedule',
      jobId: childJob.id,
      jobNumber: childJob.number,
      technicianId: 'tech_old',
      technicianName: 'Old Tech',
      date: '2026-10-01',
      startTime: '2026-10-01T08:00',
      finishTime: '2026-10-01T10:00',
      hours: 2,
      startHour: 8,
      endHour: 10,
      taskId: 'task_manual',
      taskName: 'Inspection'
    });

    propagateParentJobUpdates(parentJob);

    const childFresh = store.getById('jobs', childJob.id);
    assert.strictEqual(childFresh.technicianId, tech.id);
    assert.strictEqual(childFresh.technicianName, tech.name);

    // Completed child jobs are left untouched
    const completedFresh = store.getById('jobs', completedChild.id);
    assert.strictEqual(completedFresh.technicianId, 'tech_old');
    assert.strictEqual(completedFresh.technicianName, 'Old Tech');

    const schedules = store.getAll('schedule').filter(s => s.jobId === childJob.id);
    const wholeJob = schedules.find(s => s.taskId === null);
    assert.strictEqual(wholeJob.technicianId, tech.id);
    assert.strictEqual(wholeJob.technicianName, tech.name);

    const manual = schedules.find(s => s.taskId === 'task_manual');
    assert.strictEqual(manual.technicianId, 'tech_old');
  });

  test('Engine detects collision and creates warning notification when auto-scheduling', () => {
    const localDateStr = (date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    const todayStr = localDateStr(new Date());

    const tech = store.create('technicians', {
      id: 'tech_collision_1',
      name: 'Collision Technician'
    });

    // Create an existing schedule allocation for this technician today 8:00 - 10:00 AM
    store.create('schedule', {
      jobId: 'existing_job_1',
      technicianId: tech.id,
      date: todayStr,
      startTime: `${todayStr}T08:00:00`,
      finishTime: `${todayStr}T10:00:00`,
      startHour: 8,
      endHour: 10
    });

    // Create recurring parent job targeting 8:00 AM today
    store.create('jobs', {
      number: 'J-COLLIDE-01',
      title: 'Conflicting Recurring Service',
      customerId: 'cust_collide',
      preferredTime: '08:00',
      isRecurring: true,
      recurringConfig: {
        freq: 'Daily',
        start: todayStr,
        end: todayStr,
        defaultTechnicianId: tech.id
      }
    });

    checkRecurringJobs();

    // The engine now auto-finds the next free slot instead of double-booking and
    // warning about it: the tech is busy 08:00–10:00, so the job that wanted
    // 08:00 should be placed at 10:00 rather than colliding.
    const child = store.getAll('jobs').find(j => j.number && j.number.startsWith('J-COLLIDE-01.'));
    assert.ok(child, 'child job should be spawned');
    const sched = store.getAll('schedule').find(s => s.jobId === child.id);
    assert.ok(sched, 'schedule block should be created for the spawned job');
    assert.strictEqual(sched.startHour, 10, 'should start after the existing 08:00–10:00 booking');
    assert.strictEqual(sched.startTime, `${todayStr}T10:00`);

    // ...and because it was rescheduled cleanly, no collision warning is raised.
    const notifs = store.getAll('notifications') || [];
    assert.strictEqual(notifs.filter(n => n.type === 'Recurring Job Collision').length, 0,
      'no collision warning when the engine finds a free slot');
  });

  test('Spawned schedule block survives cloud serialization round-trip (regression: job_id/technician_id nulled)', () => {
    const localDateStr = (date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    const todayStr = localDateStr(new Date());

    const tech = store.create('technicians', { name: 'Round Trip Tech' });
    const parent = store.create('jobs', {
      number: 'J-RT', title: 'Round Trip Service', customerId: 'c1', customerName: 'ACME',
      preferredTime: '14:00', estimatedHours: 3, isRecurring: true,
      recurringConfig: { freq: 'Weekly', start: todayStr, end: todayStr, defaultTechnicianId: tech.id, daysOfWeek: [] }
    });

    checkRecurringJobs();
    const child = store.getAll('jobs').find(j => j.parentJobId === parent.id);
    const sched = store.getAll('schedule').find(s => s.jobId === child.id);
    assert.ok(sched, 'schedule block should exist in cache');

    // Denormalize (what is written to Supabase) must keep the FK + position columns.
    // These were previously overwritten with null by the schedule-specific block,
    // which dropped the block on reload and mis-rendered the spawned job.
    const dbRow = store.denormalizeRecord(sched, 'schedule');
    assert.strictEqual(dbRow.job_id, child.id, 'job_id must not be nulled on write');
    assert.strictEqual(dbRow.technician_id, tech.id, 'technician_id must not be nulled on write');
    assert.strictEqual(dbRow.start_hour, 14, 'start_hour must not be nulled on write');
    assert.strictEqual(dbRow.start_time, `${todayStr}T14:00`);

    // Simulate the Supabase timestamptz column re-tagging naive times as UTC,
    // then normalize back (as a reload / realtime push would).
    const asTz = (s) => (s && !/[+Z]/.test(s.slice(11)) ? s + ':00+00:00' : s);
    const back = store.normalizeRecord(
      { ...dbRow, start_time: asTz(dbRow.start_time), finish_time: asTz(dbRow.finish_time) },
      'schedule'
    );

    assert.strictEqual(back.jobId, child.id, 'jobId must survive the full round-trip');
    assert.strictEqual(back.technicianId, tech.id, 'technicianId must survive the full round-trip');

    // Rendered vertical position must equal the forecast (preferredTime 14:00).
    const renderStartHour = back.startTime
      ? new Date(back.startTime).getHours() + new Date(back.startTime).getMinutes() / 60
      : back.startHour;
    assert.strictEqual(renderStartHour, 14, 'spawned block must render at preferredTime, matching the forecast');
  });

  test('cleanOldJobTitles renames existing jobs with legacy recurring suffixes to clean parent titles', () => {
    const parent = store.create('jobs', {
      number: 'J-MASTER',
      title: 'HVAC Quarterly Maintenance',
      isRecurring: true
    });

    const childWithSuffix = store.create('jobs', {
      number: 'J-MASTER.1',
      parentJobId: parent.id,
      title: 'HVAC Quarterly Maintenance — Recurring (15/08/2026)',
      scheduledDate: '2026-08-15'
    });

    const orphanWithSuffix = store.create('jobs', {
      number: 'J-999',
      title: 'Chiller Inspection — Recurring',
      scheduledDate: '2026-09-01'
    });

    const cleanedCount = cleanOldJobTitles();
    assert.strictEqual(cleanedCount, 2, 'should clean up 2 jobs carrying legacy titles');

    const updatedChild = store.getById('jobs', childWithSuffix.id);
    assert.strictEqual(updatedChild.title, 'HVAC Quarterly Maintenance');

    const updatedOrphan = store.getById('jobs', orphanWithSuffix.id);
    assert.strictEqual(updatedOrphan.title, 'Chiller Inspection');
  });

  test('materializeVirtualOccurrence idempotency prevents double spawning duplicate child jobs', async () => {
    const { materializeVirtualOccurrence } = await import('../../utils/maintenanceEngine.js');
    const parent = store.create('jobs', {
      number: 'J-100',
      title: 'Bi-Weekly Inspection',
      isRecurring: true,
      recurringConfig: { freq: 'Weekly', interval: 2, start: '2026-08-01' }
    });

    const firstSpawn = materializeVirtualOccurrence(parent.id, '2026-08-15');
    assert.strictEqual(firstSpawn.number, 'J-100.1');

    const secondSpawn = materializeVirtualOccurrence(parent.id, '2026-08-15');
    assert.strictEqual(secondSpawn.id, firstSpawn.id, 'Second call for same date should return existing child job without spawning a duplicate');
    assert.strictEqual(secondSpawn.number, 'J-100.1');

    const allChildren = store.getAll('jobs').filter(j => j.parentJobId === parent.id);
    assert.strictEqual(allChildren.length, 1, 'Only one child job should exist for the date occurrence');
  });

  test('repairAnomalousJobNumbers renumbers affected high-number jobs and their child recurring jobs', async () => {
    const { repairAnomalousJobNumbers } = await import('../../utils/maintenanceEngine.js');

    // Create normal jobs
    const job1 = store.create('jobs', { number: 'J-00001', title: 'Normal Job 1' });
    const job2 = store.create('jobs', { number: 'J-00002', title: 'Normal Job 2' });

    // Create anomalous job created during bug
    const anomalousParent = store.create('jobs', { 
      number: 'JOB-01001', 
      title: 'Anomalous Recurring Master',
      isRecurring: true 
    });

    const anomalousChild = store.create('jobs', {
      number: 'JOB-01001.1',
      title: 'Anomalous Recurring Child',
      parentJobId: anomalousParent.id,
      notes: 'Generated from template job JOB-01001'
    });

    // Create linked invoice and schedule block
    const invoice = store.create('invoices', { number: 'INV-00001', jobId: anomalousParent.id, jobNumber: 'JOB-01001' });
    const scheduleBlock = store.create('schedule', { id: 'sch_1', jobId: anomalousChild.id, jobNumber: 'JOB-01001.1' });

    const repairedCount = repairAnomalousJobNumbers();
    assert.ok(repairedCount >= 2, 'Should renumber both parent and child anomalous jobs');

    const updatedParent = store.getById('jobs', anomalousParent.id);
    const updatedChild = store.getById('jobs', anomalousChild.id);
    const updatedInvoice = store.getById('invoices', invoice.id);
    const updatedBlock = store.getById('schedule', scheduleBlock.id);

    assert.strictEqual(updatedParent.number, 'J-00003', 'Master job should be renumbered to next sequential number J-00003');
    assert.strictEqual(updatedChild.number, 'J-00003.1', 'Child recurring job should be renumbered to match updated parent number J-00003.1');
    assert.strictEqual(updatedInvoice.jobNumber, 'J-00003', 'Linked invoice jobNumber should be updated to J-00003');
    assert.strictEqual(updatedBlock.jobNumber, 'J-00003.1', 'Linked schedule block jobNumber should be updated to J-00003.1');
  });

  test('updating preferredTime on recurring job template preserves status and propagates to child jobs', async () => {
    const { propagateParentJobUpdates } = await import('../../utils/maintenanceEngine.js');
    
    const parent = store.create('jobs', {
      number: 'J-200',
      title: 'Weekly Maintenance Master',
      status: 'Recurring Template',
      isRecurring: true,
      preferredTime: '08:00',
      recurringConfig: { freq: 'Weekly', start: '2026-08-01', end: '2026-12-31' }
    });

    const child = store.create('jobs', {
      number: 'J-200.1',
      title: 'Weekly Maintenance Master',
      parentJobId: parent.id,
      status: 'Scheduled',
      preferredTime: '08:00'
    });

    // Update preferredTime on parent template
    const updatedParent = store.update('jobs', parent.id, {
      preferredTime: '14:00',
      status: 'Recurring Template',
      isRecurring: true
    });

    propagateParentJobUpdates(updatedParent);

    const checkParent = store.getById('jobs', parent.id);
    const checkChild = store.getById('jobs', child.id);

    assert.strictEqual(checkParent.status, 'Recurring Template', 'Parent job status must remain Recurring Template');
    assert.strictEqual(checkParent.preferredTime, '14:00', 'Parent job preferredTime must update to 14:00');
    assert.strictEqual(checkChild.preferredTime, '14:00', 'Child job preferredTime must update to match parent');
  });
});


