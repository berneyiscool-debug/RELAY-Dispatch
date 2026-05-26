import { store } from '../data/store.js';

export function checkMaintenancePlans() {
  const plans = store.getAll('maintenancePlans') || [];
  const assets = store.getAll('assets') || [];
  const quotes = store.getAll('quotes') || [];
  const notifications = store.getAll('notifications') || [];

  let storeUpdated = false;

  plans.forEach(plan => {
    if (plan.status !== 'Active') return;

    const asset = assets.find(a => a.id === plan.assetId);
    if (!asset) return;

    const quote = quotes.find(q => q.id === plan.quoteId);
    if (!quote) return;

    if (plan.triggerType === 'Calendar') {
      const nextDate = new Date(plan.nextServiceDate);
      const today = new Date();
      
      // Calculate diff in days
      const diffTime = nextDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Trigger if next service date is within 7 days and has not been notified for this date already
      if (diffDays <= 7) {
        // Double check we haven't already generated a notification for this specific target date
        const hasNotif = notifications.some(n => n.maintenancePlanId === plan.id && n.targetServiceDate === plan.nextServiceDate);
        if (!hasNotif) {
          // Generate notification
          const partsList = (quote.sections || quote.lineItems || [])
            .flatMap(s => s.lineItems || [s])
            .filter(li => li.type === 'material')
            .map(li => `${li.qty}x ${li.description}`)
            .join(', ') || 'No specific parts required';

          const laborHrs = (quote.sections || quote.lineItems || [])
            .flatMap(s => s.lineItems || [s])
            .filter(li => li.type === 'labor')
            .reduce((sum, li) => sum + parseFloat(li.qty || 0), 0) || 0;

          const notif = {
            id: 'notif_maint_' + Date.now() + Math.random().toString(36).substr(2, 5),
            title: `Maintenance Due: ${asset.name} - ${plan.name}`,
            description: `Scheduled maintenance is due on ${plan.nextServiceDate} at ${asset.site || 'Main Office'}. Required parts: ${partsList}. Labor Profile: ${laborHrs} hrs.`,
            status: 'Pending',
            type: 'Recurring Job Due',
            priority: 'Normal',
            createdAt: new Date().toISOString(),
            createdBy: 'System Engine',
            maintenancePlanId: plan.id,
            quoteId: plan.quoteId,
            assetId: plan.assetId,
            targetServiceDate: plan.nextServiceDate
          };

          notifications.push(notif);
          store.save('notifications', notifications);

          // Advance nextServiceDate based on frequency
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
          plan.lastNotificationDate = new Date().toISOString();
          storeUpdated = true;
        }
      }
    } else if (plan.triggerType === 'Meter') {
      const currentMeter = parseFloat(asset.currentMeter || 0);
      const lastTriggered = parseFloat(plan.lastTriggeredMeter || 0);
      const interval = parseFloat(plan.meterInterval || 0);

      // Trigger if current meter exceeds target
      if (currentMeter >= lastTriggered + interval) {
        // Double check we haven't already generated an active (Pending) notification for this meter trigger
        const hasPendingNotif = notifications.some(n => n.maintenancePlanId === plan.id && n.status === 'Pending' && n.type === 'Recurring Job Due');
        if (!hasPendingNotif) {
          const partsList = (quote.sections || quote.lineItems || [])
            .flatMap(s => s.lineItems || [s])
            .filter(li => li.type === 'material')
            .map(li => `${li.qty}x ${li.description}`)
            .join(', ') || 'No specific parts required';

          const laborHrs = (quote.sections || quote.lineItems || [])
            .flatMap(s => s.lineItems || [s])
            .filter(li => li.type === 'labor')
            .reduce((sum, li) => sum + parseFloat(li.qty || 0), 0) || 0;

          const notif = {
            id: 'notif_maint_' + Date.now() + Math.random().toString(36).substr(2, 5),
            title: `Usage Maintenance Due: ${asset.name} - ${plan.name}`,
            description: `Asset meter reading is at ${currentMeter} ${asset.meterUnit || 'hrs'} (Target milestone: ${lastTriggered + interval} ${asset.meterUnit || 'hrs'}). Required parts: ${partsList}. Labor: ${laborHrs} hrs.`,
            status: 'Pending',
            type: 'Recurring Job Due',
            priority: 'Normal',
            createdAt: new Date().toISOString(),
            createdBy: 'System Engine',
            maintenancePlanId: plan.id,
            quoteId: plan.quoteId,
            assetId: plan.assetId,
            currentMeterAtTrigger: currentMeter
          };

          notifications.push(notif);
          store.save('notifications', notifications);

          // Update lastTriggeredMeter to the current milestone increment
          plan.lastTriggeredMeter = lastTriggered + interval;
          plan.lastNotificationDate = new Date().toISOString();
          storeUpdated = true;
        }
      }
    }
  });

  if (storeUpdated) {
    store.save('maintenancePlans', plans);
  }
}
