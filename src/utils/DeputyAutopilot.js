import { store } from '../data/store.js';
import { dispatchChat, getSystemContext } from '../components/RelayAssistant.js';

let autopilotTimeout = null;

// The generic polling mechanism to detect issues. We debounce it to prevent spamming.
export function triggerAutopilotEvaluation() {
  if (autopilotTimeout) clearTimeout(autopilotTimeout);
  autopilotTimeout = setTimeout(evaluateStoreState, 3000);
}

// Subscribe to relevant collections
store.on('jobs', triggerAutopilotEvaluation);
store.on('schedule', triggerAutopilotEvaluation);

async function evaluateStoreState() {
  const s = store.getSettings();
  const ai = s.ai || {};
  if (!ai.enabled) return;

  const jobs = store.getAll('jobs') || [];
  const activeJobsList = jobs.filter(j => j.status === 'Scheduled' || j.status === 'In Progress');
  const assignedActiveJobs = activeJobsList.filter(j => j.technicianName && j.technicianName !== 'Unassigned' && j.scheduledDate);
  
  const techDateMap = {};
  assignedActiveJobs.forEach(j => {
    const key = `${j.technicianName}_${j.scheduledDate}`;
    if (!techDateMap[key]) techDateMap[key] = [];
    techDateMap[key].push(j);
  });

  const conflicts = [];
  Object.values(techDateMap).forEach(group => {
    if (group.length > 1) {
      conflicts.push(group);
    }
  });

  if (conflicts.length === 0) return;

  // We have conflicts. Check if we already have an ask for this exact conflict scenario.
  const asks = store.getAll('deputyAsks') || [];
  const unresolvedAsks = asks.filter(a => a.status === 'pending');

  for (const conflictGroup of conflicts) {
    const jobIds = conflictGroup.map(j => j.id).sort().join(',');
    
    // Check if an ask already exists for these job IDs
    const alreadyAsked = unresolvedAsks.some(a => a.conflictJobIds === jobIds);
    if (alreadyAsked) continue;

    // Generate Proposal using AI
    await generateConflictProposal(conflictGroup, jobIds, ai);
  }
}

async function generateConflictProposal(conflictGroup, jobIds, ai) {
  const techName = conflictGroup[0].technicianName;
  const date = conflictGroup[0].scheduledDate;
  
  const basePrompt = ai.systemPrompt || 'You are Deputy, an intelligent CRM co-pilot assistant.';
  const systemPrompt = `${basePrompt}\n\n${getSystemContext()}`;

  const prompt = `A schedule collision has been detected for technician ${techName} on date ${date}.
They are scheduled for the following jobs at the same time:
${conflictGroup.map(j => `- Job #${j.number}: ${j.title}`).join('\n')}

Review the system context (which contains all available technicians and their workloads). 
Determine the best way to resolve this conflict (e.g. by reassigning one of the jobs to another available technician with the right skills, or changing the date).

Respond strictly with an [ACTION: RESOLVE_CONFLICT, {...}] tag containing your proposed resolution, along with a brief 1 sentence explanation of why you chose this resolution.
Example:
I propose moving Job #1002 to John Doe since he is available on this date.
[ACTION: RESOLVE_CONFLICT, {"jobId": "...", "techId": "...", "newDate": "..."}]`;

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    const reply = await dispatchChat(messages, ai, ai.model || 'deepseek-chat');

    // Extract the action
    const actionRegex = /\[ACTION:\s*([A-Z_]+)(?:,\s*(\{.*?\}|.*?))?\]/s;
    const match = reply.match(actionRegex);
    
    if (match) {
      const actionType = match[1];
      const actionPayload = match[2] || '{}';
      const actionTag = `[ACTION: ${actionType}, ${actionPayload}]`;

      // Extract reasoning by removing the action tag
      const reasoning = reply.replace(actionRegex, '').trim() || 'No reasoning provided.';

      const newAsk = {
        id: 'ask_' + Date.now() + Math.random().toString(36).substr(2, 9),
        company_id: store.companyId,
        title: `Schedule Collision for ${techName}`,
        description: reasoning,
        proposedAction: actionTag,
        status: 'pending',
        conflictJobIds: jobIds, // Tracking field to prevent duplicates
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const allAsks = store.getAll('deputyAsks') || [];
      allAsks.push(newAsk);
      store.save('deputyAsks', allAsks);
    }
  } catch (err) {
    console.error('Deputy Autopilot failed to generate proposal:', err);
  }
}
