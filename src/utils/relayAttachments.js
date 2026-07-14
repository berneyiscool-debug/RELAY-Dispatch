// ============================================
// RELAY — ASSISTANT ATTACHMENT PROCESSING
// ============================================
// Turns user-attached images and PDFs into an array of base64 image data URLs
// that a vision model (DeepSeek V4) can read. Images are downscaled to keep the
// payload/token count sane; PDFs are rendered page-by-page via pdf.js.
//
// Supplier catalogues can be large, so we cap the page count and let the caller
// send the resulting images in batches (see MAX_PDF_PAGES / VISION_BATCH_SIZE).
// ============================================
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Research-backed defaults: real supplier/wholesale catalogues run 32 → a few
// hundred pages. 150 covers the large majority without trying to process the
// 5,000-page outliers in a browser. Pages are sent to the model in batches so a
// single request never carries the whole catalogue.
export const MAX_PDF_PAGES = 150;
export const VISION_BATCH_SIZE = 15;

// Longest edge (px) we downscale attachment images to before sending.
const MAX_IMAGE_DIM = 1500;
// pdf.js render scale is derived per page; this caps it so a huge page doesn't
// produce an enormous canvas.
const MAX_PDF_SCALE = 2.0;
const JPEG_QUALITY = 0.85;

export function fileKind(file) {
  const mime = file.type || '';
  const name = (file.name || '').toLowerCase();
  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)$/.test(name)) return 'image';
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  return 'other';
}

export function isSupportedAttachment(file) {
  return fileKind(file) !== 'other';
}

/** Split an array into fixed-size chunks (used to batch page-images per request). */
export function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(fr.error || new Error('Failed to read file'));
    fr.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode image'));
    img.src = src;
  });
}

/** Read an image file and downscale it so its longest edge is <= MAX_IMAGE_DIM. */
async function imageToDataUrl(file) {
  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);
  const longest = Math.max(img.width, img.height);
  if (longest <= MAX_IMAGE_DIM) return dataUrl;

  const scale = MAX_IMAGE_DIM / longest;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

/** Render up to `maxPages` PDF pages to JPEG data URLs. Returns { images, totalPages }. */
async function pdfToDataUrls(file, { maxPages, onProgress }) {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const totalPages = pdf.numPages;
  const pageCount = Math.min(totalPages, maxPages);
  const images = [];

  for (let p = 1; p <= pageCount; p++) {
    const page = await pdf.getPage(p);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(MAX_PDF_SCALE, MAX_IMAGE_DIM / base.width);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    images.push(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    page.cleanup();

    if (onProgress) onProgress({ file: file.name, page: p, pageCount, totalPages });
  }

  await pdf.destroy();
  return { images, totalPages, pageCount };
}

/**
 * Prepare a list of attachment Files for a vision request.
 * Returns:
 *   images     — flat array of base64 image data URLs (page images + photos)
 *   parts      — per-file summary: { name, kind, pages }
 *   truncated  — true if any PDF exceeded MAX_PDF_PAGES and was cut
 */
export async function prepareAttachments(files, { maxPages = MAX_PDF_PAGES, onProgress } = {}) {
  const images = [];
  const parts = [];
  let truncated = false;
  // Shared page budget across all attachments so several PDFs can't blow past the cap.
  let remaining = maxPages;

  for (const file of files) {
    const kind = fileKind(file);
    if (kind === 'image') {
      images.push(await imageToDataUrl(file));
      parts.push({ name: file.name, kind: 'image', pages: 1 });
    } else if (kind === 'pdf') {
      const budget = Math.max(0, remaining);
      const { images: pageImages, totalPages, pageCount } =
        await pdfToDataUrls(file, { maxPages: budget, onProgress });
      images.push(...pageImages);
      remaining -= pageCount;
      if (totalPages > pageCount) truncated = true;
      parts.push({ name: file.name, kind: 'pdf', pages: pageCount, totalPages });
    }
  }

  return { images, parts, truncated };
}
