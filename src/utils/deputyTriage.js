import { store } from '../data/store.js';
import { hasDeputyMax } from './aiTier.js';
import { dispatchChat } from './aiEngine.js';

// 2-stage triage: classify the latest Deputy Max turn (QUESTION / ACTION /
// EXTERNAL / URGENT), then route it to the appropriate handler. Gated behind
// hasDeputyMax() so base/cloud non-Max users keep the single-pass path.

export const INTENTS = ['QUESTION', 'ACTION', 'EXTERNAL', 'URGENT'];

const RULE_INTENTS = [
  { intent: 'URGENT', re: /\b(urgent|emergency|critical|asap|right now|immediately|on fire|no power|broken down|stranded|catastrophic|priority)\b/i },
  { intent: 'EXTERNAL', re: /\b(weather|forecast|rain|temperature|conditions|drive time|traffic|route|directions|travel time|distance|map|navigate)\b/i },
  { intent: 'ACTION', re: /\b(assign|schedule|reschedule|reassign|create|add|book|update|edit|change|move|mark|complete|close|cancel|generate|invoice|quote|reorder|order|purchase|remind|follow.?up|send|draft)\b/i }
];

function parseTriageJson(raw) {
  if (!raw) return null;
  const match = String(raw).match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const obj = JSON.parse(match[0]);
    if (obj && typeof obj.intent === 'string') return obj;
  } catch (e) { /* fall through to pattern extraction */ }
  const intent = String(raw).match(/"(intent|type)"\s*:\s*"([A-Z]+)"/i);
  return intent ? { intent: intent[2].toUpperCase(), needsLookup: false, needsExternal: false, entities: {} } : null;
}

function extractEntities(text) {
  const entities = {};
  const jobMatch = text.match(/\b(?:job|#)\s*#?(\d+)/i);
  if (jobMatch) entities.jobId = jobMatch[1];
  const invMatch = text.match(/\b(?:invoice)\s*#?(\d+)/i);
  if (invMatch) entities.invoiceId = invMatch[1];
  const custMatch = text.match(/\b(?:customer|client)\s+([A-Za-z][A-Za-z'\s-]{1,40})/i);
  if (custMatch) entities.customerName = custMatch[1].trim();
  const techMatch = text.match(/\b(?:technician|tech)\s+([A-Za-z][A-Za-z'\s-]{1,40})/i);
  if (techMatch) entities.technicianName = techMatch[1].trim();
  const dateMatch = text.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/);
  if (dateMatch) entities.date = dateMatch[1];
  return entities;
}

function finalizeTriage(intent, text) {
  const entities = extractEntities(text);
  return {
    intent,
    needsLookup: intent === 'QUESTION' && (entities.jobId || entities.invoiceId || entities.customerName),
    needsExternal: intent === 'EXTERNAL',
    entities
  };
}

export async function triageMessage(text, context = {}) {
  if (!hasDeputyMax()) {
    return { intent: 'QUESTION', needsLookup: false, needsExternal: false, entities: {} };
  }
  const trimmed = String(text || '').trim();
  if (!trimmed) {
    return { intent: 'QUESTION', needsLookup: false, needsExternal: false, entities: {} };
  }

  // Rule-based quick classification for obvious cases.
  for (const rule of RULE_INTENTS) {
    if (rule.re.test(trimmed)) return finalizeTriage(rule.intent, trimmed);
  }

  // Lightweight LLM classification for ambiguous turns.
  try {
    const ai = context.ai || (store.getSettings()?.ai) || {};
    const model = context.model || ai.model || 'deepseek-chat';
    const history = (context.chatHistory || []).filter(m => m && (m.role === 'user' || m.role === 'assistant' || m.role === 'system'));
    const prompt = `You are a routing classifier. Decide the single best intent for the user's latest message from the options: QUESTION, ACTION, EXTERNAL, URGENT.
- QUESTION: asking for information, metrics, explanations, or status. No changes requested.
- ACTION: wants Deputy to perform or change something in the system (assign, schedule, create, update, etc.).
- EXTERNAL: needs live external data (weather, drive time, routing, maps).
- URGENT: immediate operational emergency needing attention now.

Respond with ONLY a compact JSON object, no prose or code fences:
{"intent":"QUESTION","needsLookup":false,"needsExternal":false,"entities":{}}
"entities" (optional) may capture obvious entities such as a job id, customer name, technician, or date.`;
    const messages = [...history.slice(-6), { role: 'user', content: `${prompt}\n\nLatest message:\n"""${trimmed}"""` }];
    const raw = await dispatchChat(messages, ai, model);
    const parsed = parseTriageJson(raw);
    if (parsed && INTENTS.includes(parsed.intent)) {
      return {
        intent: parsed.intent,
        needsLookup: !!parsed.needsLookup,
        needsExternal: !!parsed.needsExternal || parsed.intent === 'EXTERNAL',
        entities: parsed.entities || extractEntities(trimmed)
      };
    }
  } catch (e) {
    console.warn('Relay triage LLM classification failed, using rule fallback:', e);
  }

  return finalizeTriage('QUESTION', trimmed);
}

// Router: dispatch a classified intent to the matching handler. The caller supplies
// the handlers so this module stays decoupled from the UI/action pieces.
export async function routeIntent(intent, ctx = {}) {
  switch (intent) {
    case 'ACTION':
      return ctx.runAction ? await ctx.runAction() : (ctx.answerQuestion ? await ctx.answerQuestion() : null);
    case 'EXTERNAL':
      return ctx.resolveExternal ? await ctx.resolveExternal() : (ctx.answerQuestion ? await ctx.answerQuestion() : null);
    case 'URGENT':
      return ctx.handleUrgent ? await ctx.handleUrgent() : (ctx.answerQuestion ? await ctx.answerQuestion() : null);
    case 'QUESTION':
    default:
      return ctx.answerQuestion ? await ctx.answerQuestion() : null;
  }
}
