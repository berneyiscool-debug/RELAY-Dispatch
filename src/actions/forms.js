/**
 * Compliance forms — filling a job's form from a scan of the paper copy.
 *
 * A tech prints a blank form, fills it in by hand and uploads a photo or PDF of
 * it to the job. `fill_form_from_scan` reads that upload and writes what it
 * read into the job's formInstance as a draft (status `Pending`), exactly the
 * record `JobDetail.js` builds when someone attaches a form and saves a draft.
 *
 * It never completes a form: the person reviews the draft — with every field
 * brny was unsure of flagged on `formInstance.scan.flags` — and signs it off
 * in the job's Forms tab. A form that is already Completed is refused rather
 * than overwritten.
 */

import { store } from '../data/store.js';
import { completeChat } from '../utils/aiEngine.js';
import {
  IDENTIFY_TOOL, RECORD_TOOL, buildIdentifyPrompt, buildReadPrompt, detectTemplate,
  fillableFields, imageBlock, mapScanResponses, mergeResponses, parseDataUrl,
} from '../utils/formScan.js';
import { defineAction } from './registry.js';
import { resolveOne, normalizeText } from './resolve.js';
import { objectSchema, str } from './schema.js';
import { ambiguousMatch, conflict, invalidInput, notFound } from './errors.js';
import { actorStamp, logActivity } from './context.js';
import { jobLabel, resolveJob } from './jobs.js';

// A form is a page or two; anything longer is not a form scan.
const MAX_SCAN_PAGES = 4;

function isScanType(file) {
  const type = String(file.type || '').toLowerCase();
  const name = String(file.name || '').toLowerCase();
  return type.startsWith('image/') || type === 'application/pdf' || /\.(png|jpe?g|webp|gif|pdf)$/.test(name);
}

/**
 * Every photo or PDF uploaded to a job, newest first.
 *
 * Uploads live on `job.activityLog` — `combined` entries carry `files[]`, older
 * `attachment` entries a single `file` — and legacy ones on `job.attachments`.
 * The `key` (`<entryId>:<index>`) is stable, so the job page can point at one.
 */
export function jobScans(job) {
  const out = [];
  for (const entry of (job && job.activityLog) || []) {
    const files = entry.type === 'attachment' && entry.file ? [entry.file] : entry.files || [];
    files.forEach((file, index) => {
      if (file && file.data && isScanType(file)) {
        out.push({ key: `${entry.id}:${index}`, name: file.name || 'scan', type: file.type || '', data: file.data, date: entry.date || null, author: entry.author || null });
      }
    });
  }
  ((job && job.attachments) || []).forEach((file, index) => {
    const data = file && (file.data || file.url);
    if (data && String(data).startsWith('data:') && isScanType(file)) {
      out.push({ key: `att:${file.id || index}`, name: file.name || 'scan', type: file.type || '', data, date: file.uploadedAt || file.date || null, author: null });
    }
  });
  return out.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
}

function resolveScan(job, query) {
  const scans = jobScans(job);
  if (!scans.length) throw notFound('photo or PDF on this job', jobLabel(job));
  if (!query || /^(latest|last|newest|most recent)$/i.test(String(query).trim())) return scans[0];
  const byKey = scans.find((s) => s.key === query);
  if (byKey) return byKey;
  const q = normalizeText(query);
  const exact = scans.filter((s) => normalizeText(s.name) === q);
  const hits = exact.length ? exact : scans.filter((s) => normalizeText(s.name).includes(q));
  if (hits.length === 1) return hits[0];
  if (!hits.length) throw notFound('upload', query);
  throw ambiguousMatch('upload', query, hits.slice(0, 5).map((s) => ({ id: s.key, label: s.name })));
}

function resolveTemplate(query) {
  return resolveOne('formTemplates', query, { searchFields: ['name', 'id'], label: 'name', what: 'form' }).record;
}

// ── Model and image plumbing (swappable for tests) ──────────────────────────

/** Turn an upload into the page images to send: photos are downscaled, PDFs rendered. */
async function defaultScanImages(scan) {
  // Loaded on demand: pdf.js and canvas only exist in the browser.
  const { prepareAttachments } = await import('../utils/relayAttachments.js');
  // Decoded by hand: the app's CSP does not let fetch() read a data: URL.
  const { mediaType, base64 } = parseDataUrl(scan.data);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  const file = new File([bytes], scan.name, { type: scan.type || mediaType });
  const { images } = await prepareAttachments([file], { maxPages: MAX_SCAN_PAGES });
  return images;
}

/** One forced tool call against the scan; returns the tool's input. */
async function defaultReadScan({ prompt, images, tool, signal }) {
  const result = await completeChat(
    [{ role: 'user', content: [...images.map(imageBlock), { type: 'text', text: prompt }] }],
    { tools: [tool], toolChoice: { type: 'tool', name: tool.name }, maxTokens: 4096, signal }
  );
  const call = result.toolCalls.find((c) => c.name === tool.name);
  if (!call) throw new Error("brny couldn't read the scan. Try a clearer, flatter photo.");
  return call.input || {};
}

let deps = { scanImages: defaultScanImages, readScan: defaultReadScan };

/** Test hook: replace the image preparation and/or the model call. Returns a restore function. */
export function setFormScanDeps(overrides = {}) {
  const previous = deps;
  deps = { ...deps, ...overrides };
  return () => { deps = previous; };
}

// ── The draft record ─────────────────────────────────────────────────────────

function saveDraft({ job, template, mapped, scan, reading, detectedBy, ctx }) {
  const all = store.getAll('formInstances') || [];
  const index = all.findIndex((fi) => fi.jobId === job.id && fi.templateId === template.id);
  const existing = index >= 0 ? all[index] : null;
  if (existing && existing.status === 'Completed') {
    throw conflict(`"${template.name}" on ${jobLabel(job)} is already completed. Open it from the Forms tab to change it.`, { formInstanceId: existing.id });
  }

  const now = new Date().toISOString();
  const record = {
    ...(existing || {
      id: 'fi_' + Math.random().toString(36).substr(2, 9),
      jobId: job.id,
      templateId: template.id,
      createdAt: now,
    }),
    responses: mergeResponses(existing && existing.responses, mapped.responses),
    status: 'Pending',
    scan: {
      fileName: scan.name,
      attachmentKey: scan.key,
      scannedAt: now,
      scannedBy: actorStamp(ctx).createdBy,
      detectedBy: detectedBy || 'chosen',
      sheetCode: reading.code || '',
      flags: mapped.flags,
      reviewedAt: null,
    },
  };

  if (index >= 0) all[index] = record; else all.push(record);
  store.save('formInstances', all);
  return { formInstance: record, created: !existing };
}

function flaggedList(template, flags) {
  const labels = new Map(fillableFields(template).map((f) => [f.id, f.label]));
  return Object.entries(flags).map(([fieldId, f]) => ({ fieldId, label: labels.get(fieldId) || fieldId, level: f.level, message: f.message, suggestion: f.suggestion }));
}

defineAction({
  name: 'fill_form_from_scan',
  title: 'Fill form from scan',
  description:
    "Read a photo or PDF scan of a hand-filled paper compliance form (JSA, SWMS, site report…) that was uploaded to a job, and fill that job's digital form with what is written on it. Saves a draft only — the form is never marked Completed; the user reviews the flagged fields and signs it off in the job's Forms tab. Leave `form` out to detect it from the code or title printed on the sheet. Leave `attachment` out to use the job's most recent upload. After it runs, tell the user how many fields were filled, list the flagged ones so they know what to check, and link the draft as a markdown link to `#<reviewPath>` (e.g. [Review the JSA](#/jobs/…)). Never say the form is complete.",
  permission: { module: 'Jobs', key: 'edit' },
  inputSchema: objectSchema(
    {
      job: str('Job number, title, customer or id.'),
      attachment: str('File name of the uploaded photo/PDF on the job, or its key. Omit for the most recent upload.'),
      form: str('Form template name or id. Omit to detect it from the sheet.'),
    },
    ['job']
  ),
  summarize: (input, result) => result
    ? `${result.template.name} on job ${result.job.number}: ${result.filledCount} field${result.filledCount === 1 ? '' : 's'} filled from ${result.scan.name}${result.flagged.length ? `, ${result.flagged.length} to check` : ''}. Saved as a draft for review.`
    : `Fill a form on ${input.job} from a scan.`,
  artifacts: (result) => [{ label: `Review ${result.template.name}`, path: `/jobs/${result.job.id}?tab=forms&form=${result.formInstance.id}` }],
  async run(input, ctx = {}) {
    const job = resolveJob(input.job);
    const scan = resolveScan(job, input.attachment);
    const templates = store.getAll('formTemplates') || [];
    if (!templates.length) throw notFound('form template', input.form || 'any');

    const images = await deps.scanImages(scan);
    if (!images || !images.length) throw invalidInput(`Couldn't get a readable page out of ${scan.name}.`);

    let template = input.form ? resolveTemplate(input.form) : null;
    let detectedBy = template ? 'chosen' : null;
    if (!template) {
      const id = await deps.readScan({ prompt: buildIdentifyPrompt(templates), images, tool: IDENTIFY_TOOL, signal: ctx.signal });
      if (id.isForm === false) throw invalidInput(`${scan.name} doesn't look like a filled-in form.`);
      const hit = detectTemplate(templates, { code: id.code, title: id.title });
      if (!hit.template) {
        const pool = hit.candidates.length ? hit.candidates : templates;
        throw ambiguousMatch('form', id.title || scan.name, pool.slice(0, 6).map((t) => ({ id: t.id, label: t.name })));
      }
      template = hit.template;
      detectedBy = hit.by;
    }

    const reading = await deps.readScan({ prompt: buildReadPrompt(template), images, tool: RECORD_TOOL, signal: ctx.signal });
    const mapped = mapScanResponses(template, reading);
    const { formInstance, created } = saveDraft({ job, template, mapped, scan, reading, detectedBy, ctx });
    const flagged = flaggedList(template, mapped.flags);

    await logActivity({
      type: 'form_draft_saved',
      text: `Form "${template.name}" draft filled from scan ${scan.name} (${mapped.filled.length} fields, ${flagged.length} to check).`,
      recordType: 'job',
      recordId: job.id,
    });

    return {
      job: { id: job.id, number: job.number, title: job.title },
      template: { id: template.id, name: template.name },
      formInstance: { id: formInstance.id, status: formInstance.status },
      scan: { key: scan.key, name: scan.name },
      created,
      detectedBy,
      filledCount: mapped.filled.length,
      filled: mapped.filled,
      flagged,
      reviewPath: `/jobs/${job.id}?tab=forms&form=${formInstance.id}`,
    };
  },
});
