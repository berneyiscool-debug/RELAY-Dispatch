// ============================================
// FIELDFORGE — TEST RATE SPLIT CALCULATOR
// ============================================

import { calculateDynamicLabor } from '../src/utils/rateCalculator.js';

console.log("=== RUNNING RATE SPLITTING BILLING ENGINE TESTS ===");

const settings = {
  laborRates: [
    { 
      id: 'rate_1', 
      name: 'Standard Rate',    
      rate: 145.00, 
      applicableDays: ['Mon','Tue','Wed','Thu','Fri'], 
      activeHours: [16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33], // 08:00 to 17:00
      isDefault: true 
    },
    { 
      id: 'rate_2', 
      name: 'After Hours Rate', 
      rate: 217.50, 
      applicableDays: ['Mon','Tue','Wed','Thu','Fri'], 
      activeHours: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,34,35,36,37,38,39,40,41,42,43,44,45,46,47], // Evenings & early mornings
      isDefault: false 
    },
    { 
      id: 'rate_3', 
      name: 'Emergency Rate',   
      rate: 290.00, 
      applicableDays: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun','PH'], 
      activeHours: Array.from({length: 48}, (_, i) => i), // 24 hours
      isDefault: false 
    }
  ]
};

// Create a local timesheet entry spanning from 15:00 to 19:00 (Wednesday)
// In local timezone to align with calculateDynamicLabor local time conversion
const baseDate = new Date(2026, 4, 27); // Wednesday May 27th, 2026
const startTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 15, 0, 0); // 3 PM
const finishTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 19, 0, 0); // 7 PM

const timesheets = [
  {
    id: 'ts_1',
    technicianId: 'tech_1',
    technicianName: 'Sandra Okafor',
    startTime: startTime.toISOString(),
    finishTime: finishTime.toISOString(),
    hours: 4.0
  }
];

console.log(`Timesheet start: ${startTime.toString()}`);
console.log(`Timesheet finish: ${finishTime.toString()}`);

const result = calculateDynamicLabor(timesheets, settings);

console.log("\nResults:");
console.log(JSON.stringify(result, null, 2));

// Verifications
const standard = result.find(r => r.rateProfileId === 'rate_1');
const afterHours = result.find(r => r.rateProfileId === 'rate_2');

if (!standard || standard.hours !== 2.0) {
  console.error("❌ Test Failed: Standard Rate should have exactly 2.0 hours");
  process.exit(1);
}
if (!afterHours || afterHours.hours !== 2.0) {
  console.error("❌ Test Failed: After Hours Rate should have exactly 2.0 hours");
  process.exit(1);
}

console.log("\n✅ ALL TESTS PASSED SUCCESSFULLY! The pricing engine splits and aggregates perfectly.");
