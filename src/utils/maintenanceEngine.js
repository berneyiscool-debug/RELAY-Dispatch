import { store } from '../data/store.js';
import { parsePreferredTime, toDateKey, todayLocalISO } from './dateUtils.js';
import { supabase } from './supabase.js';
import { checkPaymentReminders } from './paymentReminders.js';

export async function checkMaintenancePlans() {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || store.userId;
  if (!userId) return;

  const isCloud = store.companyId && !store.companyId.startsWith('acct_');

  if (isCloud) {
    // Try to acquire the engine lock for 30 seconds via Supabase
    const { data: gotLock, error: lockError } = await supabase.rpc('acquire_lock', {
      p_lock_name: 'maintenance_engine',
      p_user_id: userId,
      p_timeout_seconds: 30
    });

    if (lockError) {
      console.warn('Failed to call acquire_lock RPC:', lockError);
      return;
    }

    if (!gotLock) {
      console.log('Maintenance engine locked by another process (cloud), skipping...');
      return;
    }
    
    await runEngineCore(userId, isCloud);
  } else {
    // Local / Offline mode: Use Folder Sync lock (if enabled) + Browser Web Locks API for cross-tab coordination
    
    // 1. Cross-machine lock (via shared network drive folder)
    if (store.folderSyncEnabled) {
      const gotFolderLock = await store.acquireFolderLock('maintenance_engine', 30);
      if (!gotFolderLock) {
        console.log('Maintenance engine locked by another machine (LAN sync), skipping...');
        return;
      }
    }

    // 2. Cross-tab lock (via local browser)
    const runWithLock = async () => {
      try {
        await runEngineCore(userId, isCloud);
      } finally {
        if (store.folderSyncEnabled) {
          await store.releaseFolderLock('maintenance_engine');
        }
      }
    };

    if (navigator.locks) {
      await navigator.locks.request('maintenance_engine_local', { ifAvailable: true }, async (lock) => {
        if (!lock) {
          console.log('Maintenance engine locked by another tab (local), skipping...');
          if (store.folderSyncEnabled) await store.releaseFolderLock('maintenance_engine');
          return;
        }
        await runWithLock();
      });
    } else {
      // Fallback if no locks API
      await runWithLock();
    }
  }
}

async function runEngineCore(userId, isCloud) {

  try {
    const plans = store.getAll('maintenancePlans') || [];
    const assets = store.getAll('assets') || [];
    const quotes = store.getAll('quotes') || [];
    const notifications = store.getAll('notifications') || [];
    const stock = store.getAll('stock') || [];

    let storeUpdated = false;

  function getPriorityScore(p) {
    if (typeof p === 'number') return p;
    if (!p) return 5;
    const score = parseInt(p);
    if (!isNaN(score)) return score;
    if (p === 'Minor') return 2;
    if (p === 'Standard') return 5;
    if (p === 'Major') return 8;
    return 5;
  }

  function mapNumericToTextPriority(p) {
    const num = getPriorityScore(p);
    if (num <= 3) return 'Low';
    if (num <= 7) return 'Normal';
    if (num <= 9) return 'High';
    return 'Urgent';
  }

  // Group active plans by assetId
  const activePlansByAsset = {};
  plans.forEach(plan => {
    if (plan.status !== 'Active') return;
    if (!activePlansByAsset[plan.assetId]) {
      activePlansByAsset[plan.assetId] = [];
    }
    activePlansByAsset[plan.assetId].push(plan);
  });

  Object.entries(activePlansByAsset).forEach(([assetId, assetPlans]) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    // Check which active plans in this group are "due"
    const mergableDuePlans = [];
    const standaloneDuePlans = [];

    assetPlans.forEach(plan => {
      const quote = quotes.find(q => q.id === plan.quoteId);
      if (!quote) return;

      let isDue = false;

      if (plan.triggerType === 'Calendar') {
        if (!plan.nextServiceDate) return;
        const nextDate = new Date(plan.nextServiceDate);
        const today = new Date();
        const diffTime = nextDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 7) {
          // Double check we haven't already notified for this specific plan and target date
          const hasNotif = notifications.some(n => 
            (n.maintenancePlanId === plan.id && n.targetServiceDate === plan.nextServiceDate) ||
            (n.mergedPlanIds && n.mergedPlanIds.includes(plan.id) && n.targetServiceDate === plan.nextServiceDate)
          );
          if (!hasNotif) {
            isDue = true;
          }
        }
      } else if (plan.triggerType === 'Meter') {
        const currentMeter = parseFloat(asset.currentMeter || 0);
        const lastTriggered = parseFloat(plan.lastTriggeredMeter || 0);
        const interval = parseFloat(plan.meterInterval || 0);

        if (currentMeter >= lastTriggered + interval) {
          const hasPendingNotif = notifications.some(n => 
            (n.maintenancePlanId === plan.id && n.status === 'Pending' && n.type === 'Recurring Job Due') ||
            (n.mergedPlanIds && n.mergedPlanIds.includes(plan.id) && n.status === 'Pending' && n.type === 'Recurring Job Due')
          );
          if (!hasPendingNotif) {
            isDue = true;
          }
        }
      }

      if (isDue) {
        if (plan.collisionMerging === true) {
          mergableDuePlans.push(plan);
        } else {
          standaloneDuePlans.push(plan);
        }
      }
    });

    // Quote-based collision filtering: Plans sharing the same quoteId must not merge
    const quoteIdCounts = {};
    mergableDuePlans.forEach(p => {
      if (p.quoteId) {
        quoteIdCounts[p.quoteId] = (quoteIdCounts[p.quoteId] || 0) + 1;
      }
    });

    const finalMergableDuePlans = [];
    mergableDuePlans.forEach(p => {
      if (p.quoteId && quoteIdCounts[p.quoteId] > 1) {
        standaloneDuePlans.push(p);
      } else {
        finalMergableDuePlans.push(p);
      }
    });

    // 1. Process all Standalone Due Plans (independent notifications, independent schedule advancement)
    standaloneDuePlans.forEach(plan => {
      const quote = quotes.find(q => q.id === plan.quoteId);
      const items = [];
      if (quote.sections) {
        quote.sections.forEach(sec => {
          if (sec.lineItems) items.push(...sec.lineItems);
        });
      } else if (quote.lineItems) {
        items.push(...quote.lineItems);
      }

      const planMaterials = [];
      let laborHrs = 0;
      let laborCost = 0;
      let materialCost = 0;

      items.forEach(item => {
        if (item.type === 'material') {
          const sMatch = stock.find(s => s.name === item.description);
          planMaterials.push({
            stockId: sMatch ? sMatch.id : null,
            name: item.description,
            quantity: parseFloat(item.qty || 0),
            unitCost: sMatch ? (sMatch.costPrice || sMatch.unitPrice || 0) : parseFloat(item.rate || 0),
            fromQuote: true
          });
          materialCost += parseFloat(item.total || 0);
        } else if (item.type === 'labor') {
          laborHrs += parseFloat(item.qty || 0);
          laborCost += parseFloat(item.total || 0);
        }
      });

      const partsText = planMaterials.map(m => `${m.quantity}x ${m.name}`).join(', ') || 'No specific parts required';
      
      let standaloneDesc = '';
      if (plan.triggerType === 'Calendar') {
        standaloneDesc = `Service Plan: ${plan.name}\nAsset: ${asset.name} (${asset.type || 'Generator'}, S/N: ${asset.serial || '—'})\nLocation/Site: ${asset.site || 'Main Office'}\nDue Date: ${plan.nextServiceDate}\nRequired parts: ${partsText}\nLabor: ${laborHrs} hrs.`;
      } else {
        const currentMeter = parseFloat(asset.currentMeter || 0);
        const targetMilestone = parseFloat(plan.lastTriggeredMeter || 0) + parseFloat(plan.meterInterval || 0);
        standaloneDesc = `Service Plan: ${plan.name}\nAsset: ${asset.name} (${asset.type || 'Generator'}, S/N: ${asset.serial || '—'})\nLocation/Site: ${asset.site || 'Main Office'}\nMeter Reading: ${currentMeter} ${asset.meterUnit || 'hrs'} (Milestone: ${targetMilestone} ${asset.meterUnit || 'hrs'})\nRequired parts: ${partsText}\nLabor: ${laborHrs} hrs.`;
      }

      const notif = {
        id: 'notif_maint_' + Date.now() + Math.random().toString(36).substr(2, 5),
        title: plan.triggerType === 'Calendar' ? `Maintenance Due: ${asset.name} - ${plan.name}` : `Usage Maintenance Due: ${asset.name} - ${plan.name}`,
        description: standaloneDesc,
        message: standaloneDesc,
        status: 'Pending',
        type: 'Recurring Job Due',
        priority: mapNumericToTextPriority(plan.priority),
        createdAt: new Date().toISOString(),
        createdBy: 'System Engine',
        maintenancePlanId: plan.id,
        mergedPlanIds: [],
        taskTemplateId: plan.taskTemplateId || null,
        mergedTaskTemplateIds: [],
        quoteId: plan.quoteId,
        assetId: asset.id,
        targetServiceDate: plan.triggerType === 'Calendar' ? plan.nextServiceDate : null,
        currentMeterAtTrigger: plan.triggerType === 'Meter' ? parseFloat(asset.currentMeter || 0) : null,
        
        mergedMaterialsList: planMaterials,
        totalLaborHrs: laborHrs,
        totalLaborCost: laborCost,
        totalMaterialCost: materialCost
      };

      notifications.push(notif);
      store.save('notifications', notifications);

      // Advance schedule timer immediately for standalone plan
      if (plan.triggerType === 'Calendar') {
        const currentNext = new Date(plan.nextServiceDate);
        if (plan.frequency === 'Weekly') {
          currentNext.setDate(currentNext.getDate() + 7);
        } else if (plan.frequency === 'Monthly') {
          currentNext.setMonth(currentNext.getMonth() + 1);
        } else if (plan.frequency === 'Quarterly') {
          currentNext.setMonth(currentNext.getMonth() + 3);
        } else if (plan.frequency === 'Semi-Annually') {
          currentNext.setMonth(currentNext.getMonth() + 6);
        } else if (plan.frequency === 'Annually') {
          currentNext.setFullYear(currentNext.getFullYear() + 1);
        }
        plan.nextServiceDate = currentNext.toISOString().split('T')[0];
      } else if (plan.triggerType === 'Meter') {
        plan.lastTriggeredMeter = parseFloat(plan.lastTriggeredMeter || 0) + parseFloat(plan.meterInterval || 0);
      }
      plan.lastNotificationDate = new Date().toISOString();
      storeUpdated = true;
    });

    // 2. Process Collision Mergeable Due Plans (only merge if multiple mergables trigger, else trigger standalone)
    if (finalMergableDuePlans.length > 0) {
      if (finalMergableDuePlans.length === 1) {
        const plan = finalMergableDuePlans[0];
        const quote = quotes.find(q => q.id === plan.quoteId);
        const items = [];
        if (quote.sections) {
          quote.sections.forEach(sec => {
            if (sec.lineItems) items.push(...sec.lineItems);
          });
        } else if (quote.lineItems) {
          items.push(...quote.lineItems);
        }

        const planMaterials = [];
        let laborHrs = 0;
        let laborCost = 0;
        let materialCost = 0;

        items.forEach(item => {
          if (item.type === 'material') {
            const sMatch = stock.find(s => s.name === item.description);
            planMaterials.push({
              stockId: sMatch ? sMatch.id : null,
              name: item.description,
              quantity: parseFloat(item.qty || 0),
              unitCost: sMatch ? (sMatch.costPrice || sMatch.unitPrice || 0) : parseFloat(item.rate || 0),
              fromQuote: true
            });
            materialCost += parseFloat(item.total || 0);
          } else if (item.type === 'labor') {
            laborHrs += parseFloat(item.qty || 0);
            laborCost += parseFloat(item.total || 0);
          }
        });

        const partsText = planMaterials.map(m => `${m.quantity}x ${m.name}`).join(', ') || 'No specific parts required';
        
        let standaloneDesc = '';
        if (plan.triggerType === 'Calendar') {
          standaloneDesc = `Service Plan: ${plan.name}\nAsset: ${asset.name} (${asset.type || 'Generator'}, S/N: ${asset.serial || '—'})\nLocation/Site: ${asset.site || 'Main Office'}\nDue Date: ${plan.nextServiceDate}\nRequired parts: ${partsText}\nLabor: ${laborHrs} hrs.`;
        } else {
          const currentMeter = parseFloat(asset.currentMeter || 0);
          const targetMilestone = parseFloat(plan.lastTriggeredMeter || 0) + parseFloat(plan.meterInterval || 0);
          standaloneDesc = `Service Plan: ${plan.name}\nAsset: ${asset.name} (${asset.type || 'Generator'}, S/N: ${asset.serial || '—'})\nLocation/Site: ${asset.site || 'Main Office'}\nMeter Reading: ${currentMeter} ${asset.meterUnit || 'hrs'} (Milestone: ${targetMilestone} ${asset.meterUnit || 'hrs'})\nRequired parts: ${partsText}\nLabor: ${laborHrs} hrs.`;
        }

        const notif = {
          id: 'notif_maint_' + Date.now() + Math.random().toString(36).substr(2, 5),
          title: plan.triggerType === 'Calendar' ? `Maintenance Due: ${asset.name} - ${plan.name}` : `Usage Maintenance Due: ${asset.name} - ${plan.name}`,
          description: standaloneDesc,
          message: standaloneDesc,
          status: 'Pending',
          type: 'Recurring Job Due',
          priority: mapNumericToTextPriority(plan.priority),
          createdAt: new Date().toISOString(),
          createdBy: 'System Engine',
          maintenancePlanId: plan.id,
          mergedPlanIds: [],
          taskTemplateId: plan.taskTemplateId || null,
          mergedTaskTemplateIds: [],
          quoteId: plan.quoteId,
          assetId: asset.id,
          targetServiceDate: plan.triggerType === 'Calendar' ? plan.nextServiceDate : null,
          currentMeterAtTrigger: plan.triggerType === 'Meter' ? parseFloat(asset.currentMeter || 0) : null,
          
          mergedMaterialsList: planMaterials,
          totalLaborHrs: laborHrs,
          totalLaborCost: laborCost,
          totalMaterialCost: materialCost
        };

        notifications.push(notif);
        store.save('notifications', notifications);

        // Advance schedule timer immediately
        if (plan.triggerType === 'Calendar') {
          const currentNext = new Date(plan.nextServiceDate);
          if (plan.frequency === 'Weekly') {
            currentNext.setDate(currentNext.getDate() + 7);
          } else if (plan.frequency === 'Monthly') {
            currentNext.setMonth(currentNext.getMonth() + 1);
          } else if (plan.frequency === 'Quarterly') {
            currentNext.setMonth(currentNext.getMonth() + 3);
          } else if (plan.frequency === 'Semi-Annually') {
            currentNext.setMonth(currentNext.getMonth() + 6);
          } else if (plan.frequency === 'Annually') {
            currentNext.setFullYear(currentNext.getFullYear() + 1);
          }
          plan.nextServiceDate = currentNext.toISOString().split('T')[0];
        } else if (plan.triggerType === 'Meter') {
          plan.lastTriggeredMeter = parseFloat(plan.lastTriggeredMeter || 0) + parseFloat(plan.meterInterval || 0);
        }
        plan.lastNotificationDate = new Date().toISOString();
        storeUpdated = true;
      } else {
        // Group collision resolution for multiple mergable plans
        finalMergableDuePlans.sort((a, b) => getPriorityScore(b.priority) - getPriorityScore(a.priority));

        const triggeredPlan = finalMergableDuePlans[0];
        const suppressedPlans = finalMergableDuePlans.slice(1);

        const allMaterials = [];
        let totalLaborHrs = 0;
        let totalLaborCost = 0;
        let totalMaterialCost = 0;

        finalMergableDuePlans.forEach(plan => {
          const quote = quotes.find(q => q.id === plan.quoteId);
          if (!quote) return;
          const items = [];
          if (quote.sections) {
            quote.sections.forEach(sec => {
              if (sec.lineItems) items.push(...sec.lineItems);
            });
          } else if (quote.lineItems) {
            items.push(...quote.lineItems);
          }

          items.forEach(item => {
            if (item.type === 'material') {
              allMaterials.push({
                description: item.description,
                qty: parseFloat(item.qty || 0),
                rate: parseFloat(item.rate || 0),
                total: parseFloat(item.total || 0)
              });
              totalMaterialCost += parseFloat(item.total || 0);
            } else if (item.type === 'labor') {
              totalLaborHrs += parseFloat(item.qty || 0);
              totalLaborCost += parseFloat(item.total || 0);
            }
          });
        });

        const mergedMaterialsMap = {};
        allMaterials.forEach(m => {
          const descLower = m.description.trim().toLowerCase();
          if (mergedMaterialsMap[descLower]) {
            mergedMaterialsMap[descLower].qty += m.qty;
            mergedMaterialsMap[descLower].total += m.total;
          } else {
            mergedMaterialsMap[descLower] = { ...m };
          }
        });
        const mergedMaterialsList = Object.values(mergedMaterialsMap);

        const suppressedNames = suppressedPlans.map(p => p.name.replace(/\s+(Plan|Service Plan)$/i, '')).join(' + ');
        const mergedTitle = `${triggeredPlan.name} (includes ${suppressedNames} tasks)`;

        const partsText = mergedMaterialsList.map(m => `${m.qty}x ${m.description}`).join(', ') || 'No specific parts required';

        let mergedDescription = '';
        if (triggeredPlan.triggerType === 'Calendar') {
          mergedDescription = `Service Plan: ${mergedTitle}\nAsset: ${asset.name} (${asset.type || 'Generator'}, S/N: ${asset.serial || '—'})\nLocation/Site: ${asset.site || 'Main Office'}\nDue Date: ${triggeredPlan.nextServiceDate}\nRequired parts: ${partsText}\nLabor: ${totalLaborHrs} hrs.`;
        } else {
          const currentMeter = parseFloat(asset.currentMeter || 0);
          const targetMilestone = parseFloat(triggeredPlan.lastTriggeredMeter || 0) + parseFloat(triggeredPlan.meterInterval || 0);
          mergedDescription = `Service Plan: ${mergedTitle}\nAsset: ${asset.name} (${asset.type || 'Generator'}, S/N: ${asset.serial || '—'})\nLocation/Site: ${asset.site || 'Main Office'}\nMeter Reading: ${currentMeter} ${asset.meterUnit || 'hrs'} (Milestone: ${targetMilestone} ${asset.meterUnit || 'hrs'})\nRequired parts: ${partsText}\nLabor: ${totalLaborHrs} hrs.`;
        }

        const notif = {
          id: 'notif_maint_' + Date.now() + Math.random().toString(36).substr(2, 5),
          title: mergedTitle,
          description: mergedDescription,
          message: mergedDescription,
          status: 'Pending',
          type: 'Recurring Job Due',
          priority: mapNumericToTextPriority(triggeredPlan.priority),
          createdAt: new Date().toISOString(),
          createdBy: 'System Engine',
          maintenancePlanId: triggeredPlan.id,
          mergedPlanIds: suppressedPlans.map(p => p.id),
          taskTemplateId: triggeredPlan.taskTemplateId || null,
          mergedTaskTemplateIds: triggeredPlan.mergeTasks === true
            ? suppressedPlans.filter(p => p.mergeTasks === true).map(p => p.taskTemplateId).filter(Boolean)
            : [],
          quoteId: triggeredPlan.quoteId,
          assetId: asset.id,
          targetServiceDate: triggeredPlan.triggerType === 'Calendar' ? triggeredPlan.nextServiceDate : null,
          currentMeterAtTrigger: triggeredPlan.triggerType === 'Meter' ? parseFloat(asset.currentMeter || 0) : null,
          
          mergedMaterialsList: mergedMaterialsList.map(m => {
            const sMatch = stock.find(s => s.name === m.description);
            return {
              stockId: sMatch ? sMatch.id : null,
              name: m.description,
              quantity: m.qty,
              unitCost: sMatch ? (sMatch.costPrice || sMatch.unitPrice || 0) : m.rate,
              fromQuote: true
            };
          }),
          totalLaborHrs,
          totalLaborCost,
          totalMaterialCost
        };

        notifications.push(notif);
        store.save('notifications', notifications);

        finalMergableDuePlans.forEach(plan => {
          if (plan.triggerType === 'Calendar') {
            const currentNext = new Date(plan.nextServiceDate);
            if (plan.frequency === 'Weekly') {
              currentNext.setDate(currentNext.getDate() + 7);
            } else if (plan.frequency === 'Monthly') {
              currentNext.setMonth(currentNext.getMonth() + 1);
            } else if (plan.frequency === 'Quarterly') {
              currentNext.setMonth(currentNext.getMonth() + 3);
            } else if (plan.frequency === 'Semi-Annually') {
              currentNext.setMonth(currentNext.getMonth() + 6);
            } else if (plan.frequency === 'Annually') {
              currentNext.setFullYear(currentNext.getFullYear() + 1);
            }
            plan.nextServiceDate = currentNext.toISOString().split('T')[0];
          } else if (plan.triggerType === 'Meter') {
            plan.lastTriggeredMeter = parseFloat(plan.lastTriggeredMeter || 0) + parseFloat(plan.meterInterval || 0);
          }
          plan.lastNotificationDate = new Date().toISOString();
        });

        storeUpdated = true;
      }
    }
  });

  if (storeUpdated) {
    store.save('maintenancePlans', plans);
  }

  // Run recurring jobs check
  checkRecurringJobs();

  // v1.3 #5 — automatic payment reminders (cloud + email-configured only; no-ops otherwise)
  await checkPaymentReminders();

  } finally {
    // Release the Supabase lock if in cloud mode
    // (If local mode, Web Locks API automatically releases the lock when the async callback finishes)
    if (isCloud) {
      await supabase.rpc('release_lock', {
        p_lock_name: 'maintenance_engine',
        p_user_id: userId
      }).catch(err => console.error('Error releasing lock:', err));
    }
  }
}

// ---------------------------------------------------------------------------
// Recurring occurrence identity
//
// A recurring template ("T-00012") owns exactly one child job per occurrence.
// Deciding whether an occurrence is already filled is the most fragile part of
// this engine: templates are T- while their children are re-prefixed to J-, the
// `parentJobId` link lives inside the serialised notes blob (so it is missing on
// rows written before it was persisted), and the occurrence date arrives as a
// date-only string, an ISO timestamp or a raw scheduledDate. These helpers
// normalise all of that so the spawn check, the forecast, materialisation and
// the repair pass all answer the question the same way.
// ---------------------------------------------------------------------------

/** Children are re-prefixed with the job prefix, so never compare prefixes. */
const TEMPLATE_NUMBER_PREFIX = /^(T-|TEMP-|TEM-)/;

/**
 * Splits a job number into numeric base + optional child suffix.
 * "T-00012" -> { base: 12, suffix: null }, "J-00012.3" -> { base: 12, suffix: 3 }
 * @param {string} number
 * @returns {{base: number, suffix: number|null}|null}
 */
export function parseJobNumber(number) {
  const match = String(number ?? '').trim().match(/^[A-Za-z]*-?(\d+)(?:\.(\d+))?$/);
  if (!match) return null;
  return {
    base: parseInt(match[1], 10),
    suffix: match[2] === undefined ? null : parseInt(match[2], 10)
  };
}

/**
 * True when `childNumber` is a spawned child ("<base>.<n>") of `templateNumber`.
 * Prefix-insensitive on purpose — a T- template's children are J- numbers, so a
 * naive `startsWith` check never matches.
 */
export function isChildNumberOfTemplate(childNumber, templateNumber) {
  const child = parseJobNumber(childNumber);
  const template = parseJobNumber(templateNumber);
  if (!child || !template) return false;
  return child.suffix !== null && child.base === template.base;
}

/** The number a template's children should carry: "T-00012" -> "J-00012". */
export function childNumberBaseFor(templateNumber, prefix = 'J-') {
  return String(templateNumber || '').replace(TEMPLATE_NUMBER_PREFIX, prefix);
}

/**
 * The children that belong to a template.
 * The explicit `parentJobId` link always wins; the number form is only trusted
 * when that link is absent or dangling (i.e. points at a job that no longer
 * exists), so a child can never be counted twice or stolen by another template.
 * This is what makes legacy/orphaned children visible to dedup again.
 * @param {object} template
 * @param {object[]} jobs
 * @param {Set<string>} [jobIds] ids present in `jobs`, for dangling-link checks
 * @returns {object[]}
 */
export function collectTemplateChildren(template, jobs, jobIds = null) {
  if (!template || !Array.isArray(jobs)) return [];
  const ids = jobIds || new Set(jobs.map(j => j && j.id));
  return jobs.filter(j => {
    if (!j || j.id === template.id) return false;
    if (j.parentJobId === template.id) return true;
    if (j.parentJobId && ids.has(j.parentJobId)) return false;
    return isChildNumberOfTemplate(j.number, template.number);
  });
}

/** The occurrence date a child fulfils: its anchor, else its scheduled date. */
export function occurrenceDateKey(child) {
  if (!child) return null;
  return toDateKey(child.templateDate) || toDateKey(child.scheduledDate);
}

function daysBetweenKeys(fromKey, toKey) {
  const [fy, fm, fd] = String(fromKey).split('-').map(Number);
  const [ty, tm, td] = String(toKey).split('-').map(Number);
  return (new Date(ty, tm - 1, td) - new Date(fy, fm - 1, fd)) / 86400000;
}

/** Half the gap between occurrences — how far a child may have moved and still fill its slot. */
function occurrenceToleranceDays(template) {
  const freq = template?.recurringConfig?.freq;
  if (freq === 'Weekly') return 3.5;
  if (freq === 'Monthly') return 15;
  return 0.5;
}

/**
 * Does `child` fill the occurrence on `dateStr`?
 * Anchored children must match exactly. A child with no anchor is matched to the
 * nearest occurrence using the series spacing, so a child the user dragged to
 * another day still claims its slot instead of leaving it looking empty and
 * triggering a duplicate spawn.
 */
export function childFillsOccurrence(child, dateStr, template) {
  const key = toDateKey(dateStr);
  if (!key || !child) return false;
  const anchor = toDateKey(child.templateDate);
  if (anchor) return anchor === key;
  const scheduled = toDateKey(child.scheduledDate);
  if (!scheduled) return false;
  if (scheduled === key) return true;
  return Math.abs(daysBetweenKeys(scheduled, key)) < occurrenceToleranceDays(template);
}

/** Has this template already got a child for this occurrence? */
export function hasOccurrenceForDate(template, dateStr, jobs, jobIds = null) {
  if (!template) return false;
  return collectTemplateChildren(template, jobs, jobIds)
    .some(child => childFillsOccurrence(child, dateStr, template));
}

/** Skips may be stored in any date format; compare them as canonical date keys. */
export function isOccurrenceSkipped(config, dateStr) {
  const key = toDateKey(dateStr);
  if (!key || !config) return false;
  const skipped = Array.isArray(config.skippedDates) ? config.skippedDates : [];
  return skipped.some(s => toDateKey(s) === key);
}

/** Canonical, de-duplicated skip list, safe to persist. */
export function canonicalSkippedDates(config) {
  const skipped = Array.isArray(config?.skippedDates) ? config.skippedDates : [];
  return [...new Set(skipped.map(toDateKey).filter(Boolean))];
}

/** Start of a date key as a local Date, or null when unparseable. */
function startOfDayKey(value) {
  const key = toDateKey(value);
  if (!key) return null;
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * The Weekly/Monthly match days a config resolves to. Defaults are taken from
 * the series start date so an empty daysOfWeek/daysOfMonth still recurs.
 */
function recurrenceMatchDays(config) {
  const matchDaysOfWeek = [...(config.daysOfWeek || [])];
  const matchDaysOfMonth = [...(config.daysOfMonth || [])];
  const startDate = startOfDayKey(config.start) || new Date();
  if (config.freq === 'Weekly' && matchDaysOfWeek.length === 0) {
    matchDaysOfWeek.push(startDate.getDay());
  }
  if (config.freq === 'Monthly' && matchDaysOfMonth.length === 0) {
    matchDaysOfMonth.push(startDate.getDate());
  }
  return { matchDaysOfWeek, matchDaysOfMonth };
}

function matchesRecurrence(candidate, config, matchDaysOfWeek, matchDaysOfMonth) {
  if (config.freq === 'Daily') return true;
  if (config.freq === 'Weekly') return matchDaysOfWeek.includes(candidate.getDay());
  if (config.freq === 'Monthly') return matchDaysOfMonth.includes(candidate.getDate());
  return false;
}

/**
 * Occurrence dates inside [fromKey, toKey], clamped to the series bounds and
 * deliberately *not* clamped to today: working out which occurrence a legacy
 * child belongs to usually needs dates in the past.
 */
export function getOccurrenceDatesBetween(config, fromKey, toKey) {
  if (!config || !config.start || !config.end) return [];
  const from = startOfDayKey(fromKey);
  const to = startOfDayKey(toKey);
  const seriesStart = startOfDayKey(config.start);
  const seriesEnd = startOfDayKey(config.end);
  if (!from || !to || !seriesStart || !seriesEnd) return [];

  const { matchDaysOfWeek, matchDaysOfMonth } = recurrenceMatchDays(config);
  let current = from > seriesStart ? from : seriesStart;
  const limit = to < seriesEnd ? to : seriesEnd;
  const dates = [];
  let iterations = 0;
  while (current <= limit && dates.length < 400 && iterations < 1200) {
    iterations++;
    if (matchesRecurrence(current, config, matchDaysOfWeek, matchDaysOfMonth)) {
      dates.push(toDateKey(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * The occurrence date a child scheduled on `dateKey` most likely fulfils: the
 * nearest occurrence, ties resolved to the earlier date.
 */
export function nearestOccurrenceDate(config, dateKey) {
  const target = startOfDayKey(dateKey);
  if (!target) return null;
  const windowStart = toDateKey(new Date(target.getFullYear(), target.getMonth(), target.getDate() - 40));
  const windowEnd = toDateKey(new Date(target.getFullYear(), target.getMonth(), target.getDate() + 40));
  const dates = getOccurrenceDatesBetween(config, windowStart, windowEnd);

  let best = null;
  let bestDiff = Infinity;
  dates.forEach(date => {
    const diff = Math.abs(daysBetweenKeys(date, dateKey));
    if (diff < bestDiff) {
      bestDiff = diff;
      best = date;
    }
  });
  return best;
}

function getRecurringDates(config) {
  if (!config) return [];
  if (!config.start || !config.end) return [];

  const freq = config.freq;
  const startDate = startOfDayKey(config.start);
  const endDate = startOfDayKey(config.end);
  if (!startDate || !endDate) return [];

  let current = new Date(startDate);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);

  let count = 0;
  let iterations = 0;
  const dates = [];

  const { matchDaysOfWeek, matchDaysOfMonth } = recurrenceMatchDays(config);

  // If the template started in the past, fast-forward to today so future
  // occurrences are always produced regardless of how old `start` is. The
  // Weekly/Monthly match-day defaults above were taken from the original
  // start date, so the recurrence pattern is preserved.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (current < today) {
    current = new Date(today);
  }

  while (current <= end && count < 50 && iterations < 1000) {
    iterations++;
    if (matchesRecurrence(current, config, matchDaysOfWeek, matchDaysOfMonth)) {
      dates.push(toDateKey(current));
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function cleanOldJobTitles() {
  const jobs = store.getAll('jobs') || [];
  let updatedCount = 0;
  jobs.forEach(job => {
    let newTitle = job.title;
    if (job.parentJobId) {
      const parentJob = store.getById('jobs', job.parentJobId);
      if (parentJob && parentJob.title) {
        newTitle = parentJob.title;
      } else if (newTitle) {
        newTitle = newTitle.replace(/\s*—\s*Recurring.*$/i, '').trim();
      }
    } else if (newTitle && /\s*—\s*Recurring/i.test(newTitle)) {
      newTitle = newTitle.replace(/\s*—\s*Recurring.*$/i, '').trim();
    }

    if (newTitle && newTitle !== job.title) {
      store.update('jobs', job.id, { title: newTitle });
      updatedCount++;
    }
  });
  return updatedCount;
}

export function repairAnomalousJobNumbers() {
  const jobs = store.getAll('jobs') || [];
  if (!jobs.length) return 0;

  const settings = store.getSettings() || {};
  const dt = settings.documentTheme || {};
  const prefix = dt.jobPrefix !== undefined ? dt.jobPrefix : 'J-';
  const startingNum = dt.jobStartingNumber !== undefined ? parseInt(dt.jobStartingNumber, 10) : 1;

  const masterJobs = [];
  const childJobs = [];

  jobs.forEach(j => {
    if (j.parentJobId || (j.number && typeof j.number === 'string' && j.number.includes('.'))) {
      childJobs.push(j);
    } else {
      masterJobs.push(j);
    }
  });

  const normalMasterJobs = [];
  const anomalousMasterJobs = [];

  masterJobs.forEach(j => {
    let numStr = null;
    let hasWrongPrefix = false;
    if (j.number && typeof j.number === 'string') {
      if (j.number.startsWith(prefix)) {
        numStr = j.number.slice(prefix.length);
      } else if (j.number.startsWith('JOB-') || j.number.startsWith('J-')) {
        hasWrongPrefix = !j.number.startsWith(prefix);
        numStr = j.number.replace(/^(JOB-|J-)/, '');
      } else if (/^\d+$/.test(j.number)) {
        hasWrongPrefix = true;
        numStr = j.number;
      }
    }

    const num = (numStr && /^\d+$/.test(numStr)) ? parseInt(numStr, 10) : NaN;
    if (!isNaN(num) && num >= 1000 && startingNum < 500) {
      anomalousMasterJobs.push({ job: j, num, createdAt: j.createdAt || '' });
    } else if (!isNaN(num) && num < 50000) {
      if (hasWrongPrefix) {
        anomalousMasterJobs.push({ job: j, num, createdAt: j.createdAt || '' });
      } else {
        normalMasterJobs.push({ job: j, num });
      }
    }
  });

  if (anomalousMasterJobs.length === 0 && childJobs.every(c => {
    if (!c.number) return true;
    const parentJob = c.parentJobId ? store.getById('jobs', c.parentJobId) : null;
    if (!parentJob) return true;
    // Healthy children are "<childBase>.<n>" where childBase is the parent's
    // number under the job prefix (T-00012 -> J-00012). The old
    // startsWith(parentJob.number) test could never match a T- template against
    // its J- children, so this short circuit never fired and every engine run
    // renumbered the entire child set.
    return isChildNumberOfTemplate(c.number, parentJob.number) && !c.number.startsWith('JOB-');
  })) {
    return 0;
  }

  let maxSeq = startingNum - 1;
  normalMasterJobs.forEach(item => {
    if (item.num > maxSeq) maxSeq = item.num;
  });

  anomalousMasterJobs.sort((a, b) => {
    if (a.num < 1000 && b.num < 1000) return a.num - b.num;
    if (a.createdAt && b.createdAt) return a.createdAt.localeCompare(b.createdAt);
    return a.job.id.localeCompare(b.job.id);
  });

  const numberMap = new Map();
  let renumberedCount = 0;

  anomalousMasterJobs.forEach(item => {
    let targetNum;
    if (item.num < 1000) {
      targetNum = item.num;
      if (targetNum > maxSeq) maxSeq = targetNum;
    } else {
      maxSeq++;
      targetNum = maxSeq;
    }
    const newNumber = prefix + targetNum.toString().padStart(5, '0');
    if (item.job.number !== newNumber) {
      numberMap.set(item.job.number, newNumber);
      store.update('jobs', item.job.id, { number: newNumber });
      item.job.number = newNumber;
      renumberedCount++;
    }
  });

  const childMapByParent = new Map();
  childJobs.forEach(child => {
    const parentId = child.parentJobId;
    const parentJob = parentId ? store.getById('jobs', parentId) : null;
    const parentNumber = parentJob ? parentJob.number : (child.number ? child.number.split('.')[0] : null);
    // Children carry the job prefix, not the template's T- prefix. Writing the
    // parent number verbatim produced "T-00012.1", which hydration rewrites back
    // to "J-00012.1" — an endless renumber/rewrite loop across every run.
    const childBase = parentNumber ? childNumberBaseFor(parentNumber, prefix) : null;

    if (childBase) {
      const existingCount = (childMapByParent.get(childBase) || 0) + 1;
      childMapByParent.set(childBase, existingCount);

      let suffixIndex = existingCount;
      if (child.number && child.number.includes('.')) {
        const parsedSuffix = parseInt(child.number.split('.')[1], 10);
        if (!isNaN(parsedSuffix)) suffixIndex = parsedSuffix;
      }

      const newChildNumber = `${childBase}.${suffixIndex}`;
      if (child.number !== newChildNumber) {
        numberMap.set(child.number, newChildNumber);
        store.update('jobs', child.id, { 
          number: newChildNumber,
          notes: child.notes ? child.notes.replace(/Generated from template job \S+/, `Generated from template job ${parentNumber}`) : `Generated from template job ${parentNumber}`
        });
        child.number = newChildNumber;
        renumberedCount++;
      }
    }
  });

  if (numberMap.size > 0) {
    const invoices = store.getAll('invoices') || [];
    invoices.forEach(inv => {
      if (inv.jobId) {
        const job = store.getById('jobs', inv.jobId);
        if (job && inv.jobNumber !== job.number) {
          store.update('invoices', inv.id, { jobNumber: job.number });
        }
      } else if (inv.jobNumber && numberMap.has(inv.jobNumber)) {
        store.update('invoices', inv.id, { jobNumber: numberMap.get(inv.jobNumber) });
      }
    });

    const pos = store.getAll('purchaseOrders') || [];
    pos.forEach(po => {
      if (po.jobId) {
        const job = store.getById('jobs', po.jobId);
        if (job && po.jobNumber !== job.number) {
          store.update('purchaseOrders', po.id, { jobNumber: job.number });
        }
      } else if (po.jobNumber && numberMap.has(po.jobNumber)) {
        store.update('purchaseOrders', po.id, { jobNumber: numberMap.get(po.jobNumber) });
      }
    });

    const schedule = store.getAll('schedule') || [];
    schedule.forEach(b => {
      if (b.jobId) {
        const job = store.getById('jobs', b.jobId);
        if (job && b.jobNumber !== job.number) {
          store.update('schedule', b.id, { jobNumber: job.number });
        }
      } else if (b.jobNumber && numberMap.has(b.jobNumber)) {
        store.update('schedule', b.id, { jobNumber: numberMap.get(b.jobNumber) });
      }
    });

    const notifications = store.getAll('notifications') || [];
    notifications.forEach(n => {
      if (n.jobId) {
        const job = store.getById('jobs', n.jobId);
        if (job && n.jobNumber !== job.number) {
          store.update('notifications', n.id, { jobNumber: job.number });
        }
      } else if (n.jobNumber && numberMap.has(n.jobNumber)) {
        store.update('notifications', n.id, { jobNumber: numberMap.get(n.jobNumber) });
      }
    });

    const timesheets = store.getAll('timesheets') || [];
    timesheets.forEach(t => {
      if (t.jobId) {
        const job = store.getById('jobs', t.jobId);
        if (job && t.jobNumber !== job.number) {
          store.update('timesheets', t.id, { jobNumber: job.number });
        }
      } else if (t.jobNumber && numberMap.has(t.jobNumber)) {
        store.update('timesheets', t.id, { jobNumber: numberMap.get(t.jobNumber) });
      }
    });
  }

  return renumberedCount;
}

/**
 * Heals recurring occurrence history. Idempotent, so it is safe to run on every
 * engine pass and every template save:
 *
 *  1. Re-links children whose `parentJobId` was lost — the link only survives
 *     inside the serialised notes blob, so rows written before it was persisted
 *     (or by a device that dropped it) look like orphans. Dedup could not see
 *     them at all, so their occurrence was re-spawned on every single run.
 *  2. Anchors un-anchored children to the occurrence they actually fulfil. The
 *     previous backfill used the child's *current* scheduledDate, so a child the
 *     user had already dragged to another day anchored to the wrong date and
 *     freed its real slot for a duplicate.
 *  3. Deletes duplicate children sharing an occurrence, keeping the best copy
 *     (completed > started > oldest) and only ever removing untouched ones.
 *     Finished or already-started work is left for the user to resolve.
 *  4. Normalises the template's skip list so skips written by older builds (raw
 *     scheduledDate, day-first strings) keep suppressing their occurrence.
 *
 * @returns {{relinked:number, anchored:number, duplicatesRemoved:number, skipsNormalised:number}}
 */
export function repairRecurringOccurrences() {
  const summary = { relinked: 0, anchored: 0, duplicatesRemoved: 0, skipsNormalised: 0 };
  const jobs = store.getAll('jobs') || [];
  const templates = jobs.filter(j => j && j.isRecurring === true && j.recurringConfig);
  if (!templates.length) return summary;

  const jobIds = new Set(jobs.map(j => j.id));

  templates.forEach(template => {
    const storedSkips = Array.isArray(template.recurringConfig.skippedDates) ? template.recurringConfig.skippedDates : [];
    const canonicalSkips = canonicalSkippedDates(template.recurringConfig);
    if (canonicalSkips.length !== storedSkips.length || canonicalSkips.some((d, i) => d !== storedSkips[i])) {
      const recurringConfig = { ...template.recurringConfig, skippedDates: canonicalSkips };
      store.update('jobs', template.id, { recurringConfig });
      template.recurringConfig = recurringConfig;
      summary.skipsNormalised++;
    }

    const children = collectTemplateChildren(template, jobs, jobIds);
    if (!children.length) return;

    children.forEach(child => {
      if (child.parentJobId === template.id) return;
      store.update('jobs', child.id, { parentJobId: template.id });
      child.parentJobId = template.id;
      summary.relinked++;
    });

    // Oldest first, so when two un-anchored children are equidistant from an
    // occurrence the older row wins the slot deterministically.
    [...children]
      .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')) || String(a.id).localeCompare(String(b.id)))
      .forEach(child => {
        if (toDateKey(child.templateDate)) return;
        const scheduled = toDateKey(child.scheduledDate);
        if (!scheduled) return;
        const anchor = nearestOccurrenceDate(template.recurringConfig, scheduled);
        if (!anchor) return;
        store.update('jobs', child.id, { templateDate: anchor });
        child.templateDate = anchor;
        summary.anchored++;
      });

    const byOccurrence = new Map();
    children.forEach(child => {
      const key = occurrenceDateKey(child);
      if (!key) return;
      if (!byOccurrence.has(key)) byOccurrence.set(key, []);
      byOccurrence.get(key).push(child);
    });

    byOccurrence.forEach(group => {
      if (group.length < 2) return;
      const ranked = [...group].sort(compareOccurrenceCopies);
      ranked.slice(1).forEach(duplicate => {
        // Only ever remove untouched copies — the extra rows the spawner minted.
        // Finished or already-started work is the user's to resolve, not the
        // engine's to delete.
        if (duplicate.status === 'Completed' || duplicate.status === 'Invoiced' || hasStartedWork(duplicate)) return;
        store.delete('jobs', duplicate.id);
        summary.duplicatesRemoved++;
      });
    });
  });

  if (summary.relinked || summary.anchored || summary.duplicatesRemoved) {
    console.log('Recurring occurrence repair:', summary);
  }
  if (summary.duplicatesRemoved > 0) {
    notifyRecurringRepair(summary.duplicatesRemoved);
  }
  return summary;
}

/** Keeps the copy with real work on it: completed first, then started, then oldest. */
function compareOccurrenceCopies(a, b) {
  const rank = job => {
    if (job.status === 'Completed' || job.status === 'Invoiced') return 0;
    if (hasStartedWork(job)) return 1;
    return 2;
  };
  const diff = rank(a) - rank(b);
  if (diff !== 0) return diff;
  return String(a.createdAt || '').localeCompare(String(b.createdAt || ''))
    || String(a.id || '').localeCompare(String(b.id || ''));
}

function hasStartedWork(job) {
  const tasks = Array.isArray(job?.tasks) ? job.tasks : [];
  return tasks.some(t => (typeof t.progress === 'number' && t.progress > 0) || (t.status && t.status !== 'Not Started'));
}

function notifyRecurringRepair(count) {
  // Stable per-day id so a second device (or a second pass) does not stack
  // duplicate notifications for the same cleanup.
  const id = `notif_recurring_repair_${todayLocalISO()}`;
  if (store.getById('notifications', id)) return;

  const message = `${count} duplicate recurring occurrence${count === 1 ? '' : 's'} removed. Each recurring template now has one job per occurrence date.`;
  store.create('notifications', {
    id,
    type: 'Recurring Job Cleanup',
    title: 'Duplicate recurring occurrences removed',
    description: message,
    message,
    status: 'Info',
    createdAt: new Date().toISOString(),
    createdBy: 'System Engine'
  });
}

export function checkRecurringJobs() {
  cleanOldJobTitles();
  repairAnomalousJobNumbers();
  repairRecurringOccurrences();
  const jobs = store.getAll('jobs') || [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const next7Days = new Date(today);
  next7Days.setDate(next7Days.getDate() + 7);
  next7Days.setHours(23, 59, 59, 999);

  // Find all active recurring jobs
  const recurringJobs = jobs.filter(j => j.isRecurring === true && j.recurringConfig);

  recurringJobs.forEach(job => {
    const occurrenceDates = getRecurringDates(job.recurringConfig);

    let currentJobs = store.getAll('jobs') || [];
    let currentJobIds = new Set(currentJobs.map(j => j.id));
    occurrenceDates.forEach(dateStr => {
      const [yr, mo, dy] = dateStr.split('-').map(Number);
      const occurrenceDate = new Date(yr, mo - 1, dy);
      
      if (occurrenceDate >= today && occurrenceDate <= next7Days) {
        // Single read of jobs per template; refreshed after spawning a child so
        // newly created siblings are detected by the rest of this loop.
        const hasJob = hasOccurrenceForDate(job, dateStr, currentJobs, currentJobIds);

        const isSkipped = isOccurrenceSkipped(job.recurringConfig, dateStr);

        if (!hasJob && !isSkipped) {
          // 1. Auto-spawn the child job
          const jobMaterials = job.materials ? JSON.parse(JSON.stringify(job.materials)) : [];
          const jobTasks = job.tasks ? JSON.parse(JSON.stringify(job.tasks)) : [];
          
          jobTasks.forEach(task => {
            task.id = store.generateId ? store.generateId() : 'task_' + Math.random().toString(36).substr(2, 9);
            task.status = 'Not Started';
            task.progress = 0;
            task.startDate = new Date().toISOString();
            task.technicians = [];
            if (task.subTasks) {
              task.subTasks.forEach(st => {
                st.id = store.generateId ? store.generateId() : 'sub_' + Math.random().toString(36).substr(2, 9);
                st.status = 'Not Started';
                st.progress = 0;
                st.startDate = new Date().toISOString();
                st.technicians = [];
              });
            }
          });

          // Determine next sub-number J-XXX.Y (using job prefix e.g. J- instead of T-)
          const settings = store.getSettings();
          const jobPrefix = (settings.documentTheme && settings.documentTheme.jobPrefix !== undefined) ? settings.documentTheme.jobPrefix : 'J-';
          const baseNumber = job.number ? childNumberBaseFor(job.number, jobPrefix) : 'J-00001';

          // All children, not just the ones with an intact parentJobId: an
          // orphan is still using its number, and reusing it would mint two
          // indistinguishable jobs in the same occurrence.
          const siblingJobs = collectTemplateChildren(job, currentJobs, currentJobIds);
          let maxSuffix = 0;
          siblingJobs.forEach(sj => {
            if (sj.number) {
              const match = sj.number.match(/\.(\d+)$/);
              if (match) {
                const suffixNum = parseInt(match[1], 10);
                if (!isNaN(suffixNum) && suffixNum > maxSuffix) {
                  maxSuffix = suffixNum;
                }
              }
            }
          });
          const childNumber = `${baseNumber}.${maxSuffix + 1}`;

          // Child jobs keep the parent's plain title (no date suffix). The
          // Australian-format date is still used in the notification text below.
          const formattedDate = `${String(dy).padStart(2, '0')}/${String(mo).padStart(2, '0')}/${yr}`;
          const childTitle = `${job.title || job.number}`;

          let defaultTechName = '';
          let defaultTechId = '';
          let childStatus = 'Pending';
          if (job.recurringConfig && job.recurringConfig.defaultTechnicianId) {
            const tech = store.getAll('technicians').find(t => t.id === job.recurringConfig.defaultTechnicianId);
            if (tech) {
              defaultTechId = tech.id;
              defaultTechName = tech.name;
              childStatus = 'Scheduled';
            }
          }

          let parentPrefTime = job.preferredTime;
          if (!parentPrefTime && job.notes && job.notes.startsWith('__meta__:')) {
            try {
              const meta = JSON.parse(job.notes.slice(9));
              parentPrefTime = meta.preferredTime || null;
            } catch(e){}
          }

          const tasklistHours = getJobTasklistHours(jobTasks);
          const duration = tasklistHours > 0 ? tasklistHours : (parseFloat(job.estimatedHours) || 1);

          const childJob = {
            parentJobId: job.id,
            templateDate: dateStr,
            scheduledDate: dateStr,
            status: childStatus,
            technicianId: defaultTechId || undefined,
            technicianName: defaultTechName || '',
            number: childNumber,
            title: childTitle,
            description: job.description || '',
            priority: job.priority || 'Normal',
            notes: `Generated from template job ${job.number}`,
            createdAt: new Date().toISOString(),
            customerId: job.customerId || '',
            customerName: job.customerName || '',
            contactName: job.contactName || '',
            siteAddress: job.siteAddress || '',
            siteName: job.siteName || '',
            assetId: job.assetId || undefined,
            preferredTime: parentPrefTime || '',
            estimatedHours: duration,
            materials: jobMaterials,
            laborCost: job.laborCost || 0,
            materialCost: job.materialCost || 0,
            estimatedLaborCost: job.estimatedLaborCost || 0,
            estimatedMaterialCost: job.estimatedMaterialCost || 0,
            isRecurring: false,
            recurringConfig: null,
            tasks: jobTasks
          };

          const spawnedJob = store.create('jobs', childJob);

          // Refresh the job snapshot so subsequent occurrence dates in this loop
          // detect the newly spawned sibling.
          currentJobs = store.getAll('jobs') || [];
          currentJobIds = new Set(currentJobs.map(j => j.id));

          if (defaultTechId) {
            let desiredStart = 8;
            if (parentPrefTime) {
              const parsed = parsePreferredTime(parentPrefTime);
              if (parsed) {
                desiredStart = parsed.hours + (parsed.minutes / 60);
              }
            }

            // Gather all existing allocations for this technician on dateStr
            const existingSchedules = (store.getAll('schedule') || []).filter(s =>
              s.technicianId === defaultTechId &&
              (s.date === dateStr || (s.startTime && s.startTime.startsWith(dateStr)))
            );

            const intervals = existingSchedules.map(s => {
              let sStart = 8;
              let sEnd = 10;
              if (s.startTime && s.finishTime) {
                const sD = new Date(s.startTime);
                const fD = new Date(s.finishTime);
                sStart = sD.getHours() + (sD.getMinutes() / 60);
                sEnd = fD.getHours() + (fD.getMinutes() / 60);
              } else if (s.startHour !== undefined && s.endHour !== undefined) {
                sStart = s.startHour;
                sEnd = s.endHour;
              }
              return { sStart, sEnd };
            }).sort((a, b) => a.sStart - b.sStart);

            // Find first available slot starting at or after desiredStart
            let candidateStart = desiredStart;
            let foundSlot = false;
            while (!foundSlot && candidateStart + duration <= 20) {
              const collision = intervals.find(inv =>
                Math.max(candidateStart, inv.sStart) < Math.min(candidateStart + duration, inv.sEnd)
              );
              if (collision) {
                candidateStart = collision.sEnd;
              } else {
                foundSlot = true;
              }
            }

            const startHour = Math.floor(candidateStart);
            const startMin = Math.round((candidateStart - startHour) * 60);
            const startTimeISO = `${dateStr}T${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;

            const endHour = candidateStart + duration;
            const endHourH = Math.floor(endHour);
            const endHourM = Math.round((endHour - endHourH) * 60);
            const finishTimeISO = `${dateStr}T${endHourH.toString().padStart(2, '0')}:${endHourM.toString().padStart(2, '0')}`;

            store.create('schedule', {
              type: 'schedule',
              jobId: spawnedJob.id,
              jobNumber: spawnedJob.number,
              technicianId: defaultTechId,
              technicianName: defaultTechName,
              date: dateStr,
              startTime: startTimeISO,
              finishTime: finishTimeISO,
              hours: duration,
              startHour: candidateStart,
              endHour: candidateStart + duration,
              taskId: null,
              taskName: 'Whole Job'
            });
          }

          // 2. Create read-only "Recurring Job Created" notification
          const notifId = 'notif_recurring_' + Date.now() + Math.random().toString(36).substr(2, 5);
          const description = `Job ${spawnedJob.number} has been created and is ready to be scheduled for customer ${job.customerName || 'Internal'} due on ${formattedDate}`;
          
          const notif = {
            id: notifId,
            type: 'Recurring Job Created',
            jobId: spawnedJob.id,
            parentJobId: job.id,
            title: `Recurring Job Created`,
            description: description,
            message: description,
            dueDate: dateStr,
            status: 'Info',
            priority: job.priority || 'Normal',
            createdAt: new Date().toISOString(),
            createdBy: 'System Engine'
          };
          
          // Create individually so we don't re-send the entire notifications
          // collection on every recurring engine run (avoids the write storm).
          store.create('notifications', notif);
        }
      }
    });
  });
}

export function scheduleEngineChecks() {
  function getMsUntilNextTarget() {
    const now = new Date();
    const targets = [];
    
    // Today 12pm
    const today12PM = new Date(now);
    today12PM.setHours(12, 0, 0, 0);
    if (today12PM > now) targets.push(today12PM);
    
    // Tomorrow 12pm
    const tomorrow12PM = new Date(now);
    tomorrow12PM.setDate(tomorrow12PM.getDate() + 1);
    tomorrow12PM.setHours(12, 0, 0, 0);
    targets.push(tomorrow12PM);
    
    // Tomorrow 12am (Midnight tonight)
    const tomorrow12AM = new Date(now);
    tomorrow12AM.setDate(tomorrow12AM.getDate() + 1);
    tomorrow12AM.setHours(0, 0, 0, 0);
    targets.push(tomorrow12AM);
    
    targets.sort((a, b) => a - b);
    const nextTarget = targets[0];
    
    return nextTarget.getTime() - now.getTime();
  }

  function runCheckAndReschedule() {
    try {
      checkMaintenancePlans();
    } catch (err) {
      console.error('[Maintenance Engine] Scheduled check failed:', err);
    }
    const ms = getMsUntilNextTarget();
    setTimeout(runCheckAndReschedule, ms);
  }

  const ms = getMsUntilNextTarget();
  setTimeout(runCheckAndReschedule, ms);
}

export function getVirtualRecurringOccurrences(startDateStr, endDateStr) {
  const jobs = store.getAll('jobs') || [];
  const recurringJobs = jobs.filter(j => j.isRecurring === true && j.recurringConfig);
  const virtualOccurrences = [];

  const startD = new Date(startDateStr + 'T00:00:00');
  const endD = new Date(endDateStr + 'T23:59:59');

  const jobIds = new Set(jobs.map(j => j.id));

  recurringJobs.forEach(parentJob => {
    const dates = getRecurringDates(parentJob.recurringConfig);
    dates.forEach(dateStr => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const occD = new Date(y, m - 1, d);
      if (occD >= startD && occD <= endD) {
        // Check if an actual spawned child job already exists for this date
        const hasJob = hasOccurrenceForDate(parentJob, dateStr, jobs, jobIds);

        const isSkipped = isOccurrenceSkipped(parentJob.recurringConfig, dateStr);

        if (!hasJob && !isSkipped) {
          const tasklistHrs = getJobTasklistHours(parentJob.tasks || []);
          const calculatedHours = tasklistHrs > 0 ? tasklistHrs : (parseFloat(parentJob.estimatedHours) || 2);

          virtualOccurrences.push({
            isVirtual: true,
            id: `virtual_${parentJob.id}_${dateStr}`,
            parentJobId: parentJob.id,
            parentJobNumber: parentJob.number,
            title: parentJob.title || parentJob.number,
            customerName: parentJob.customerName || '',
            siteAddress: parentJob.siteAddress || '',
            scheduledDate: dateStr,
            technicianId: parentJob.recurringConfig?.defaultTechnicianId || null,
            preferredTime: parentJob.preferredTime || '',
            tasks: parentJob.tasks || [],
            estimatedHours: calculatedHours,
            priority: parentJob.priority || 'Normal',
            parentJob: parentJob
          });
        }
      }
    });
  });

  return virtualOccurrences;
}

export function propagateParentJobUpdates(parentJob) {
  if (!parentJob || !parentJob.isRecurring) return;
  const jobs = store.getAll('jobs') || [];
  const childJobs = collectTemplateChildren(parentJob, jobs, new Set(jobs.map(j => j.id)));

  // Resolve the template's default technician so it can be propagated to
  // existing child jobs when the user reassigns it on the template.
  const defaultTechId = parentJob.recurringConfig?.defaultTechnicianId || null;
  let defaultTechName = '';
  if (defaultTechId) {
    const tech = store.getAll('technicians').find(t => t.id === defaultTechId);
    if (tech) defaultTechName = tech.name;
  }

  const schedules = store.getAll('schedule') || [];

  childJobs.forEach(childJob => {
    if (childJob.status === 'Completed' || childJob.status === 'Invoiced') return;

    // Format child title
    const childTitle = `${parentJob.title || parentJob.number}`;

    // Merge tasks while preserving completed progress on child tasks/subtasks
    const parentTasks = parentJob.tasks ? JSON.parse(JSON.stringify(parentJob.tasks)) : [];
    const childExistingTasks = childJob.tasks || [];

    const mergedTasks = parentTasks.map(pTask => {
      const existingTask = childExistingTasks.find(c => c.name === pTask.name || c.id === pTask.id);
      const newTask = {
        ...pTask,
        id: existingTask ? existingTask.id : (store.generateId ? store.generateId() : 'task_' + Math.random().toString(36).substr(2, 9)),
        status: existingTask ? existingTask.status : 'Not Started',
        progress: existingTask ? (existingTask.progress || 0) : 0,
        technicians: existingTask ? (existingTask.technicians || []) : []
      };

      if (pTask.subTasks) {
        const existingSubtasks = existingTask ? (existingTask.subTasks || []) : [];
        newTask.subTasks = pTask.subTasks.map(pSub => {
          const existingSub = existingSubtasks.find(cSub => cSub.name === pSub.name || cSub.id === pSub.id);
          return {
            ...pSub,
            id: existingSub ? existingSub.id : (store.generateId ? store.generateId() : 'sub_' + Math.random().toString(36).substr(2, 9)),
            status: existingSub ? existingSub.status : 'Not Started',
            progress: existingSub ? (existingSub.progress || 0) : 0,
            technicians: existingSub ? (existingSub.technicians || []) : []
          };
        });
      }
      return newTask;
    });

    const updatedChild = {
      title: childTitle,
      description: parentJob.description || '',
      customerId: parentJob.customerId || '',
      customerName: parentJob.customerName || '',
      contactName: parentJob.contactName || '',
      siteAddress: parentJob.siteAddress || '',
      siteName: parentJob.siteName || '',
      priority: parentJob.priority || 'Normal',
      materials: parentJob.materials ? JSON.parse(JSON.stringify(parentJob.materials)) : [],
      laborCost: parentJob.laborCost || 0,
      materialCost: parentJob.materialCost || 0,
      estimatedLaborCost: parentJob.estimatedLaborCost || 0,
      estimatedMaterialCost: parentJob.estimatedMaterialCost || 0,
      preferredTime: parentJob.preferredTime || childJob.preferredTime || '',
      tasks: mergedTasks,
      ...(defaultTechId ? { technicianId: defaultTechId, technicianName: defaultTechName } : {})
    };

    if (defaultTechId && (childJob.technicianId !== defaultTechId || childJob.technicianName !== defaultTechName)) {
      // Re-point the child's whole-job dispatch entry to the new default tech
      schedules.forEach(s => {
        if (s.jobId === childJob.id && s.taskId === null && s.technicianId && s.technicianId !== defaultTechId) {
          store.update('schedule', s.id, { technicianId: defaultTechId, technicianName: defaultTechName });
        }
      });
    }

    store.update('jobs', childJob.id, updatedChild);
  });
}

export function materializeVirtualOccurrence(parentJobId, dateStr, customTechId = null, customStartHour = null, customHours = null) {
  const parentJob = store.getById('jobs', parentJobId);
  if (!parentJob) return null;

  // Idempotency: an occurrence that is already filled must never be created
  // twice, even when the existing child was moved or lost its parent link.
  const latestJobs = store.getAll('jobs') || [];
  const latestJobIds = new Set(latestJobs.map(j => j.id));
  const existingChild = collectTemplateChildren(parentJob, latestJobs, latestJobIds)
    .find(j => childFillsOccurrence(j, dateStr, parentJob));
  if (existingChild) {
    return existingChild;
  }

  const [yr, mo, dy] = dateStr.split('-').map(Number);
  const formattedDate = `${String(dy).padStart(2, '0')}/${String(mo).padStart(2, '0')}/${yr}`;
  const childTitle = `${parentJob.title || parentJob.number}`;

  const settings = store.getSettings();
  const jobPrefix = (settings.documentTheme && settings.documentTheme.jobPrefix !== undefined) ? settings.documentTheme.jobPrefix : 'J-';
  const baseNumber = parentJob.number ? childNumberBaseFor(parentJob.number, jobPrefix) : 'J-00001';

  // Include orphaned children so a respawn cannot mint a number that is already in use.
  const siblingJobs = collectTemplateChildren(parentJob, latestJobs, latestJobIds);
  let maxSuffix = 0;
  siblingJobs.forEach(sj => {
    if (sj.number) {
      const match = sj.number.match(/\.(\d+)$/);
      if (match) {
        const suffixNum = parseInt(match[1], 10);
        if (!isNaN(suffixNum) && suffixNum > maxSuffix) {
          maxSuffix = suffixNum;
        }
      }
    }
  });
  const childNumber = `${baseNumber}.${maxSuffix + 1}`;

  const jobMaterials = parentJob.materials ? JSON.parse(JSON.stringify(parentJob.materials)) : [];
  const jobTasks = parentJob.tasks ? JSON.parse(JSON.stringify(parentJob.tasks)) : [];
  jobTasks.forEach(task => {
    task.id = store.generateId ? store.generateId() : 'task_' + Math.random().toString(36).substr(2, 9);
    task.status = 'Not Started';
    task.progress = 0;
    task.startDate = new Date().toISOString();
    task.technicians = [];
    if (task.subTasks) {
      task.subTasks.forEach(st => {
        st.id = store.generateId ? store.generateId() : 'sub_' + Math.random().toString(36).substr(2, 9);
        st.status = 'Not Started';
        st.progress = 0;
        st.startDate = new Date().toISOString();
        st.technicians = [];
      });
    }
  });

  const techIdToUse = customTechId || parentJob.recurringConfig?.defaultTechnicianId || '';
  let techName = '';
  let childStatus = 'Pending';
  if (techIdToUse) {
    const tech = (store.getAll('technicians') || []).find(t => t.id === techIdToUse);
    if (tech) {
      techName = tech.name;
    }
    childStatus = 'Scheduled';
  }

  const childJobData = {
    parentJobId: parentJob.id,
    // Stable anchor to the occurrence date. Without this, the idempotency
    // dedup falls back to scheduledDate — so once this job is rescheduled to a
    // different day, the engine sees the original occurrence as unfilled and
    // re-spawns a duplicate on every boot. Mirrors the engine spawn path.
    templateDate: dateStr,
    scheduledDate: dateStr,
    status: childStatus,
    technicianId: techIdToUse || undefined,
    technicianName: techName,
    number: childNumber,
    title: childTitle,
    description: parentJob.description || '',
    priority: parentJob.priority || 'Normal',
    notes: `Materialized from recurring template ${parentJob.number}`,
    createdAt: new Date().toISOString(),
    customerId: parentJob.customerId || '',
    customerName: parentJob.customerName || '',
    contactName: parentJob.contactName || '',
    siteAddress: parentJob.siteAddress || '',
    siteName: parentJob.siteName || '',
    assetId: parentJob.assetId || undefined,
    preferredTime: parentJob.preferredTime || '',
    materials: jobMaterials,
    laborCost: parentJob.laborCost || 0,
    materialCost: parentJob.materialCost || 0,
    estimatedLaborCost: parentJob.estimatedLaborCost || 0,
    estimatedMaterialCost: parentJob.estimatedMaterialCost || 0,
    isRecurring: false,
    recurringConfig: null,
    tasks: jobTasks
  };

  const spawnedJob = store.create('jobs', childJobData);

  if (techIdToUse) {
    let startHour = customStartHour !== null ? customStartHour : 8;
    let startMin = 0;
    if (customStartHour === null && parentJob.preferredTime) {
      const parsed = parsePreferredTime(parentJob.preferredTime);
      if (parsed) {
        startHour = parsed.hours;
        startMin = parsed.minutes;
      }
    }
    const startTimeISO = `${dateStr}T${Math.floor(startHour).toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
    const tasklistHours = getJobTasklistHours(parentJob.tasks || []);
    const duration = customHours || (tasklistHours > 0 ? tasklistHours : (parseFloat(parentJob.estimatedHours) || 2));
    const endHour = startHour + duration;
    const endHourH = Math.floor(endHour);
    const endHourM = Math.round((endHour - endHourH) * 60) + startMin;
    const finalHour = endHourH + Math.floor(endHourM / 60);
    const finalMin = endHourM % 60;
    const finishTimeISO = `${dateStr}T${finalHour.toString().padStart(2, '0')}:${finalMin.toString().padStart(2, '0')}`;

    store.create('schedule', {
      type: 'schedule',
      jobId: spawnedJob.id,
      jobNumber: spawnedJob.number,
      technicianId: techIdToUse,
      technicianName: techName,
      date: dateStr,
      startTime: startTimeISO,
      finishTime: finishTimeISO,
      hours: duration,
      startHour: startHour,
      endHour: startHour + duration,
      taskId: null,
      taskName: 'Whole Job'
    });
  }

  return spawnedJob;
}

function getJobTasklistHours(tasks) {
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) return 0;
  
  function calculateNodeHours(node) {
    if (!node.subTasks || node.subTasks.length === 0) {
      return parseFloat(node.estimatedHours || 0);
    }
    return node.subTasks.reduce((sum, t) => sum + calculateNodeHours(t), 0);
  }
  
  return tasks.reduce((sum, t) => sum + calculateNodeHours(t), 0);
}


