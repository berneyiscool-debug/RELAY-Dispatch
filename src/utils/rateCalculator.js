// ============================================
// FIELDFORGE — DYNAMIC LABOUR RATE CALCULATOR
// ============================================

/**
 * Splits and calculates technician timesheet hours into matching labor rate profiles
 * based on day-of-week and time-of-day slot allocations.
 * 
 * @param {Array} timesheets - List of timesheet entries booked against the job
 * @param {Object} settings - Financial settings containing laborRates profiles
 * @returns {Array} List of calculated labor items with rates, hours, and totals
 */
export function calculateDynamicLabor(timesheets, settings) {
  if (!timesheets || timesheets.length === 0) return [];
  
  const laborRates = settings?.laborRates || [];
  if (laborRates.length === 0) return [];

  const defaultProfile = laborRates.find(r => r.isDefault) || laborRates[0];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Map to hold aggregated hours by technician and rate profile
  // Key: `${technicianId}::${rateProfileId}`
  const allocations = {};

  timesheets.forEach(t => {
    const start = t.startTime ? new Date(t.startTime) : null;
    const finish = t.finishTime ? new Date(t.finishTime) : null;
    const techId = t.technicianId || 'unknown';
    const techName = t.technicianName || 'Field Technician';

    // Fallback if datetimes are missing or invalid
    if (!start || !finish || isNaN(start.getTime()) || isNaN(finish.getTime()) || finish <= start) {
      const hours = parseFloat(t.hours || 0);
      if (hours > 0) {
        const key = `${techId}::${defaultProfile.id}`;
        if (!allocations[key]) {
          allocations[key] = {
            technicianId: techId,
            technicianName: techName,
            rateProfileId: defaultProfile.id,
            rateProfileName: defaultProfile.name,
            rate: defaultProfile.rate,
            hours: 0
          };
        }
        allocations[key].hours += hours;
      }
      return;
    }

    // Resolve date and day of week
    const dayName = daysOfWeek[start.getDay()]; // e.g. 'Mon', 'Tue'

    // Minutes from local midnight of the booking day
    const midnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const startMin = Math.floor((start.getTime() - midnight.getTime()) / 60000);
    const finishMin = Math.floor((finish.getTime() - midnight.getTime()) / 60000);

    // Loop through all 48 half-hour slots of the day (00:00 to 24:00)
    for (let i = 0; i < 48; i++) {
      const s_start = i * 30;
      const s_end = (i + 1) * 30;

      // Overlap inside this slot in minutes
      const overlap = Math.max(0, Math.min(finishMin, s_end) - Math.max(startMin, s_start));
      if (overlap <= 0) continue;

      const decimalHours = overlap / 60;

      // Find the applicable rate profile for this day and slot
      // 1. Must be applicable on this day of the week
      // 2. This slot index must be active in its activeHours
      let matchedProfile = laborRates.find(r => {
        const applicableDays = r.applicableDays || [];
        const activeHours = r.activeHours || [];
        return applicableDays.includes(dayName) && activeHours.includes(i);
      });

      // Fallback to default profile if no custom profile covers this slot
      if (!matchedProfile) {
        matchedProfile = defaultProfile;
      }

      const key = `${techId}::${matchedProfile.id}`;
      if (!allocations[key]) {
        allocations[key] = {
          technicianId: techId,
          technicianName: techName,
          rateProfileId: matchedProfile.id,
          rateProfileName: matchedProfile.name,
          rate: matchedProfile.rate,
          hours: 0
        };
      }
      allocations[key].hours += decimalHours;
    }
  });

  // Convert map to flat array and compute totals
  return Object.values(allocations).map(alloc => {
    // Round hours to 2 decimal places
    const hours = Math.round(alloc.hours * 100) / 100;
    const rate = alloc.rate || 0;
    const total = Math.round(hours * rate * 100) / 100;
    
    return {
      ...alloc,
      hours,
      rate,
      total
    };
  }).filter(item => item.hours > 0);
}
