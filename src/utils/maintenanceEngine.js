import { store } from '../data/store.js';
import { parsePreferredTime } from './dateUtils.js';

export function checkMaintenancePlans() {
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
}

function getRecurringDates(config) {
  if (!config) return [];
  const freq = config.freq;
  const daysOfWeek = config.daysOfWeek || [];
  const daysOfMonth = config.daysOfMonth || [];

  if (!config.start || !config.end) return [];

  const [sYear, sMonth, sDay] = config.start.split('-').map(Number);
  let current = new Date(sYear, sMonth - 1, sDay);

  const [eYear, eMonth, eDay] = config.end.split('-').map(Number);
  const end = new Date(eYear, eMonth - 1, eDay, 23, 59, 59);

  let count = 0;
  let iterations = 0;
  const dates = [];

  let matchDaysOfWeek = [...daysOfWeek];
  let matchDaysOfMonth = [...daysOfMonth];

  if (freq === 'Weekly' && matchDaysOfWeek.length === 0) {
    matchDaysOfWeek.push(current.getDay());
  }
  if (freq === 'Monthly' && matchDaysOfMonth.length === 0) {
    matchDaysOfMonth.push(current.getDate());
  }

  while (current <= end && count < 50 && iterations < 1000) {
    iterations++;
    let isMatch = false;

    if (freq === 'Daily') {
      isMatch = true;
    } else if (freq === 'Weekly') {
      isMatch = matchDaysOfWeek.includes(current.getDay());
    } else if (freq === 'Monthly') {
      isMatch = matchDaysOfMonth.includes(current.getDate());
    }

    if (isMatch) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
      count++;
    }

    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function checkRecurringJobs() {
  const jobs = store.getAll('jobs') || [];
  const notifications = store.getAll('notifications') || [];
  
  let storeUpdated = false;
  const newNotifications = [...notifications];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const next7Days = new Date(today);
  next7Days.setDate(next7Days.getDate() + 7);
  next7Days.setHours(23, 59, 59, 999);

  // Find all active recurring jobs
  const recurringJobs = jobs.filter(j => j.isRecurring === true && j.recurringConfig);

  recurringJobs.forEach(job => {
    const occurrenceDates = getRecurringDates(job.recurringConfig);
    
    occurrenceDates.forEach(dateStr => {
      const [yr, mo, dy] = dateStr.split('-').map(Number);
      const occurrenceDate = new Date(yr, mo - 1, dy);
      
      if (occurrenceDate >= today && occurrenceDate <= next7Days) {
        // Check if there is already a spawned job for this occurrence
        const hasJob = jobs.some(j => 
          (j.parentJobId === job.id || (j.number && j.number.startsWith(job.number + '.'))) && 
          j.scheduledDate === dateStr
        );

        if (!hasJob) {
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

          // Determine next sub-number J-XXX.Y
          const latestJobs = store.getAll('jobs') || [];
          const siblingJobs = latestJobs.filter(j => j.parentJobId === job.id);
          let maxSuffix = 0;
          const prefix = `${job.number}.`;
          siblingJobs.forEach(sj => {
            if (sj.number && sj.number.startsWith(prefix)) {
              const suffixStr = sj.number.substring(prefix.length);
              const suffixNum = parseInt(suffixStr, 10);
              if (!isNaN(suffixNum) && suffixNum > maxSuffix) {
                maxSuffix = suffixNum;
              }
            }
          });
          const childNumber = `${job.number}.${maxSuffix + 1}`;

          // Format title to Australian standard date format (DD/MM/YYYY)
          const formattedDate = `${String(dy).padStart(2, '0')}/${String(mo).padStart(2, '0')}/${yr}`;
          const childTitle = `${job.title || job.number} — Recurring (${formattedDate})`;

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

          const childJob = {
            parentJobId: job.id,
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
            preferredTime: job.preferredTime || '',
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
          jobs.push(spawnedJob);

          if (defaultTechId) {
            let startHour = 8;
            let startMin = 0;
            if (job.preferredTime) {
              const parsed = parsePreferredTime(job.preferredTime);
              if (parsed) {
                startHour = parsed.hours;
                startMin = parsed.minutes;
              }
            }
            const startTimeISO = `${dateStr}T${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
            const tasklistHours = getJobTasklistHours(job.tasks || []);
            const duration = tasklistHours > 0 ? tasklistHours : (job.estimatedHours || 2);
            const endHour = startHour + duration;
            const endHourH = Math.floor(endHour);
            const endHourM = Math.round((endHour - endHourH) * 60) + startMin;
            const finalHour = endHourH + Math.floor(endHourM / 60);
            const finalMin = endHourM % 60;
            const finishTimeISO = `${dateStr}T${finalHour.toString().padStart(2, '0')}:${finalMin.toString().padStart(2, '0')}`;

            store.create('schedule', {
              jobId: spawnedJob.id,
              jobNumber: spawnedJob.number,
              technicianId: defaultTechId,
              technicianName: defaultTechName,
              date: dateStr,
              startTime: startTimeISO,
              finishTime: finishTimeISO,
              hours: duration,
              startHour: startHour + (startMin / 60),
              endHour: startHour + (startMin / 60) + duration,
              taskId: null,
              taskName: 'Whole Job'
            });

            // Check if auto-scheduled block collides with an existing allocation for this technician
            const existingSchedules = (store.getAll('schedule') || []).filter(s => s.jobId !== spawnedJob.id);
            const startHourCalc = startHour + (startMin / 60);
            const endHourCalc = startHourCalc + duration;

            const hasCollision = existingSchedules.some(s => {
              if (s.technicianId !== defaultTechId || s.date !== dateStr) return false;
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
              return Math.max(startHourCalc, sStart) < Math.min(endHourCalc, sEnd);
            });

            if (hasCollision) {
              const collisionNotifId = 'notif_collision_' + Date.now() + Math.random().toString(36).substr(2, 5);
              const collisionDesc = `WARNING: Job ${spawnedJob.number} auto-created for ${defaultTechName} on ${formattedDate} (${startHour}:00) collides with an existing schedule allocation.`;
              newNotifications.push({
                id: collisionNotifId,
                type: 'Recurring Job Collision',
                jobId: spawnedJob.id,
                parentJobId: job.id,
                title: `Schedule Collision: Job ${spawnedJob.number}`,
                description: collisionDesc,
                message: collisionDesc,
                dueDate: dateStr,
                status: 'Warning',
                priority: 'High',
                createdAt: new Date().toISOString(),
                createdBy: 'System Engine'
              });
            }
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
          
          newNotifications.push(notif);
          storeUpdated = true;
        }
      }
    });
  });

  if (storeUpdated) {
    store.save('notifications', newNotifications);
  }
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

  recurringJobs.forEach(parentJob => {
    const dates = getRecurringDates(parentJob.recurringConfig);
    dates.forEach(dateStr => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const occD = new Date(y, m - 1, d);
      if (occD >= startD && occD <= endD) {
        // Check if an actual spawned child job already exists for this date
        const hasJob = jobs.some(j =>
          (j.parentJobId === parentJob.id || (j.number && j.number.startsWith(parentJob.number + '.'))) &&
          j.scheduledDate === dateStr
        );

        const isSkipped = parentJob.recurringConfig?.skippedDates?.includes(dateStr);

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
  const childJobs = jobs.filter(j =>
    j.parentJobId === parentJob.id || (j.number && j.number.startsWith(parentJob.number + '.'))
  );

  childJobs.forEach(childJob => {
    if (childJob.status === 'Completed' || childJob.status === 'Invoiced') return;

    // Format child title
    let childTitle = childJob.title;
    if (childJob.scheduledDate) {
      const [yr, mo, dy] = childJob.scheduledDate.split('-');
      const formattedDate = `${dy}/${mo}/${yr}`;
      childTitle = `${parentJob.title || parentJob.number} — Recurring (${formattedDate})`;
    } else {
      childTitle = `${parentJob.title || parentJob.number} — Recurring`;
    }

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
      tasks: mergedTasks
    };

    store.update('jobs', childJob.id, updatedChild);
  });
}

export function materializeVirtualOccurrence(parentJobId, dateStr, customTechId = null, customStartHour = null, customHours = null) {
  const parentJob = store.getById('jobs', parentJobId);
  if (!parentJob) return null;

  const [yr, mo, dy] = dateStr.split('-').map(Number);
  const formattedDate = `${String(dy).padStart(2, '0')}/${String(mo).padStart(2, '0')}/${yr}`;
  const childTitle = `${parentJob.title || parentJob.number} — Recurring (${formattedDate})`;

  const latestJobs = store.getAll('jobs') || [];
  const siblingJobs = latestJobs.filter(j => j.parentJobId === parentJob.id);
  let maxSuffix = 0;
  const prefix = `${parentJob.number}.`;
  siblingJobs.forEach(sj => {
    if (sj.number && sj.number.startsWith(prefix)) {
      const suffixStr = sj.number.substring(prefix.length);
      const suffixNum = parseInt(suffixStr, 10);
      if (!isNaN(suffixNum) && suffixNum > maxSuffix) {
        maxSuffix = suffixNum;
      }
    }
  });
  const childNumber = `${parentJob.number}.${maxSuffix + 1}`;

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
    const duration = customHours || (tasklistHours > 0 ? tasklistHours : (parentJob.estimatedHours || 2));
    const endHour = startHour + duration;
    const endHourH = Math.floor(endHour);
    const endHourM = Math.round((endHour - endHourH) * 60) + startMin;
    const finalHour = endHourH + Math.floor(endHourM / 60);
    const finalMin = endHourM % 60;
    const finishTimeISO = `${dateStr}T${finalHour.toString().padStart(2, '0')}:${finalMin.toString().padStart(2, '0')}`;

    store.create('schedule', {
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


