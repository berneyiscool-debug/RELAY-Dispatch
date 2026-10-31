// ============================================
// RELAY — NOTIFICATION → JOB
// ============================================
// Turns a notification into a job: a maintenance "Recurring Job Due" with its
// parts, labour, task lists and plan link, a client request, or a follow-up on
// an existing job. Used by "Convert to Job" / "Dispatch Job" on the
// notifications page, and by the maintenance engine for plans set to raise
// their job straight away.

import { store } from '../data/store.js';
import { todayLocalISO } from './dateUtils.js';

function compileJobTasks(mainTemplateId, mergedTemplateIds = []) {
  const allTasks = [];
  const templateIds = [mainTemplateId, ...mergedTemplateIds].filter(Boolean);

  templateIds.forEach(tid => {
    const template = store.getById('taskTemplates', tid);
    if (template && template.tasks) {
      const clonedTasks = JSON.parse(JSON.stringify(template.tasks));
      clonedTasks.forEach(task => {
        task.id = store.generateId();
        task.status = 'Not Started';
        task.progress = 0;
        task.startDate = new Date().toISOString();
        task.technicians = [];
        if (task.subTasks) {
          task.subTasks.forEach(st => {
            st.id = store.generateId();
            st.status = 'Not Started';
            st.progress = 0;
            st.startDate = new Date().toISOString();
            st.technicians = [];
          });
        }
      });
      allTasks.push(...clonedTasks);
    }
  });
  return allTasks;
}

/**
 * "Maintenance Due: Van 1 - Van 1 Service Plan" → "Van 1 — Service". The
 * engine writes "<asset> - <plan>", and asset names often carry their own
 * dash ("Main switchboard — Harbour View"), so only the last " - " splits.
 */
export function cleanJobTitle(title) {
  let t = title || '';
  t = t.replace(/^(Usage\s+)?Maintenance\s+Due:\s*/i, '');

  const split = t.lastIndexOf(' - ');
  if (split > 0) {
    const assetName = t.slice(0, split).trim();
    let planName = t.slice(split + 3).trim();

    const assetWords = assetName.toLowerCase().split(/\s+/);
    const planWords = planName.split(/\s+/);
    let matchCount = 0;
    for (let i = 0; i < Math.min(assetWords.length, planWords.length); i++) {
      if (assetWords[i] === planWords[i].toLowerCase()) {
        matchCount++;
      } else {
        break;
      }
    }
    if (matchCount > 0) {
      planName = planWords.slice(matchCount).join(' ');
    }
    planName = planName.replace(/\s+(Plan|Service Plan)$/i, '');
    t = `${assetName} — ${planName}`;
  }
  return t;
}

/**
 * The job a notification becomes, not yet saved.
 * @param {object} n notification
 * @returns {object} job fields for store.create('jobs', …)
 */
export function buildJobFromNotification(n) {
  const assignedTechId = n.technicianId || (n.maintenancePlanId ? store.getById('maintenancePlans', n.maintenancePlanId)?.defaultTechnicianId : null);
  const techObj = assignedTechId ? store.getById('technicians', assignedTechId) : null;

  let jobData = {
    number: store.getNextNumber('J-', 'jobs'),
    title: cleanJobTitle(n.title),
    description: n.description,
    priority: n.priority || 'Normal',
    status: assignedTechId ? 'Scheduled' : 'Pending',
    technicianId: assignedTechId || undefined,
    technicianName: techObj ? techObj.name : '',
    technicians: assignedTechId ? [{ id: assignedTechId, name: techObj ? techObj.name : '' }] : [],
    scheduledDate: n.targetServiceDate || n.dueDate || todayLocalISO(),
    notes: `Generated from Notification: ${n.title}\n\n${n.description}`,
    createdAt: new Date().toISOString()
  };

  if (n.mergedMaterialsList && n.mergedMaterialsList.length > 0) {
    const asset = n.assetId ? store.getById('assets', n.assetId) : null;
    const customer = asset ? store.getById('customers', asset.customerId) : null;

    const jobMaterials = n.mergedMaterialsList.map(item => ({
      stockId: item.stockId || null,
      name: item.name,
      quantity: item.quantity,
      unitCost: item.unitCost || 0,
      fromQuote: true
    }));

    jobData = {
      ...jobData,
      customerId: asset ? (asset.customerId || '') : '',
      customerName: customer ? customer.company : 'Internal',
      contactName: customer ? `${customer.firstName} ${customer.lastName}` : 'Unassigned',
      siteAddress: asset ? (asset.site || 'Main Office') : 'Main Office',
      assetId: asset ? asset.id : undefined,
      quoteId: n.quoteId || undefined,
      quoteNumber: n.quoteId ? (store.getById('quotes', n.quoteId)?.number || '') : '',
      materials: jobMaterials,
      laborCost: parseFloat(n.totalLaborCost || 0),
      materialCost: parseFloat(n.totalMaterialCost || 0),
      estimatedLaborCost: parseFloat(n.totalLaborCost || 0),
      estimatedMaterialCost: parseFloat(n.totalMaterialCost || 0),
      maintenancePlanId: n.maintenancePlanId || undefined,
      mergedPlanIds: n.mergedPlanIds || []
    };
  } else if (n.quoteId) {
    const asset = n.assetId ? store.getById('assets', n.assetId) : null;
    const quote = store.getById('quotes', n.quoteId);
    if (quote) {
      const customer = quote.customerId ? store.getById('customers', quote.customerId) : (asset ? store.getById('customers', asset.customerId) : null);

      let laborCost = 0;
      let materialCost = 0;
      const items = [];

      if (quote.sections) {
        quote.sections.forEach(sec => {
          if (sec.lineItems) items.push(...sec.lineItems);
        });
      } else if (quote.lineItems) {
        items.push(...quote.lineItems);
      }

      const jobMaterials = [];
      items.forEach(item => {
        if (item.type === 'material') {
          const sMatch = store.getAll('stock').find(s => s.name === item.description);
          jobMaterials.push({
            stockId: sMatch ? sMatch.id : null,
            name: item.description || 'Unknown Material',
            quantity: item.qty || 1,
            unitCost: sMatch ? (sMatch.costPrice || sMatch.unitPrice || 0) : 0,
            fromQuote: true
          });
          materialCost += item.total || 0;
        } else if (item.type === 'labor') {
          laborCost += item.total || 0;
        }
      });

      jobData = {
        ...jobData,
        customerId: quote.customerId || (asset ? asset.customerId : ''),
        customerName: customer ? customer.company : (quote.customerName || 'Internal'),
        contactName: customer ? `${customer.firstName} ${customer.lastName}` : (quote.contactName || 'Unassigned'),
        siteAddress: asset ? (asset.site || 'Main Office') : 'Main Office',
        assetId: asset ? asset.id : undefined,
        quoteId: quote.id,
        quoteNumber: quote.number,
        materials: jobMaterials,
        laborCost,
        materialCost,
        estimatedLaborCost: laborCost,
        estimatedMaterialCost: materialCost,
        maintenancePlanId: n.maintenancePlanId || undefined,
        mergedPlanIds: n.mergedPlanIds || []
      };
    }
  } else if (n.maintenancePlanId) {
    const asset = store.getById('assets', n.assetId);
    if (asset) {
      const customer = store.getById('customers', asset.customerId);
      jobData = {
        ...jobData,
        customerId: asset.customerId || '',
        customerName: customer ? customer.company : 'Internal',
        contactName: customer ? `${customer.firstName} ${customer.lastName}` : 'Unassigned',
        siteAddress: asset.site || 'Main Office',
        assetId: asset.id,
        maintenancePlanId: n.maintenancePlanId,
        mergedPlanIds: []
      };
    }
  } else if (n.jobId) {
    const parentJob = store.getById('jobs', n.jobId);
    if (parentJob) {
      const jobMaterials = parentJob.materials ? JSON.parse(JSON.stringify(parentJob.materials)) : [];
      const jobTasks = parentJob.tasks ? JSON.parse(JSON.stringify(parentJob.tasks)) : [];
      jobTasks.forEach(task => {
        task.id = store.generateId();
        task.status = 'Not Started';
        task.progress = 0;
        task.startDate = new Date().toISOString();
        task.technicians = [];
        if (task.subTasks) {
          task.subTasks.forEach(st => {
            st.id = store.generateId();
            st.status = 'Not Started';
            st.progress = 0;
            st.startDate = new Date().toISOString();
            st.technicians = [];
          });
        }
      });

      jobData = {
        ...jobData,
        title: parentJob.title || parentJob.number,
        parentJobId: parentJob.id,
        customerId: parentJob.customerId || '',
        customerName: parentJob.customerName || '',
        contactName: parentJob.contactName || '',
        siteAddress: parentJob.siteAddress || '',
        assetId: parentJob.assetId || undefined,
        priority: parentJob.priority || 'Normal',
        description: parentJob.description || '',
        materials: jobMaterials,
        laborCost: parentJob.laborCost || 0,
        materialCost: parentJob.materialCost || 0,
        estimatedLaborCost: parentJob.estimatedLaborCost || 0,
        estimatedMaterialCost: parentJob.estimatedMaterialCost || 0,
        isRecurring: false,
        recurringConfig: null,
        tasks: jobTasks,
      };
    }
  } else if (n.customerId) {
    const customer = store.getById('customers', n.customerId);
    let siteAddress = 'Main Office';
    if (n.siteName && customer && customer.sites) {
      const matchingSite = customer.sites.find(s => s.name === n.siteName);
      if (matchingSite) siteAddress = matchingSite.address || matchingSite.name;
    }
    jobData = {
      ...jobData,
      customerId: n.customerId,
      customerName: customer ? customer.company : (n.customerName || 'Internal'),
      contactName: n.contactName || (customer ? `${customer.firstName} ${customer.lastName}` : 'Unassigned'),
      siteAddress: siteAddress,
      siteName: n.siteName || '',
      assetId: n.assetId || undefined
    };
  }

  let tasks = [];
  if (n.taskTemplateId || (n.mergedTaskTemplateIds && n.mergedTaskTemplateIds.length > 0)) {
    tasks = compileJobTasks(n.taskTemplateId, n.mergedTaskTemplateIds || []);
  }
  if (tasks.length > 0) {
    jobData.tasks = tasks;
  }

  if (n.dueDate) {
    jobData.scheduledDate = n.dueDate;
  }

  return jobData;
}

/**
 * Create the job and mark the notification Converted. A notification that
 * wasn't already about a job now points at the one it became, so its details
 * offer "View Job".
 * @returns {object|null} the new job, or null when the notification is gone
 */
export function convertNotificationToJob(id) {
  const n = store.getById('notifications', id);
  if (!n) return null;
  const job = store.create('jobs', buildJobFromNotification(n));
  store.update('notifications', id, { status: 'Converted', convertedTo: `Job ${job.number}`, ...(n.jobId ? {} : { jobId: job.id }) });
  return job;
}
