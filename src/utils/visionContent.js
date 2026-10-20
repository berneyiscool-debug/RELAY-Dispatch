// ============================================
// RELAY — Vision message content
// ============================================
// brny's attachment requests go through the relay-copilot proxy, which forwards
// `messages` verbatim to Anthropic. Anthropic only takes images as base64
// `image` blocks; an OpenAI-style `image_url` block is a 400. Kept free of the
// pdf.js/canvas imports in relayAttachments.js so it can be tested in Node.
// ============================================

/** Anthropic image block from a base64 `data:` URL. */
export function imageBlock(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;,]+);base64,(.*)$/s);
  if (!match) throw new Error('Attachment is not a readable image.');
  return { type: 'image', source: { type: 'base64', media_type: match[1], data: match[2] } };
}

/** User-turn content for a vision request: the images first, then the instruction. */
export function visionUserContent(text, images) {
  return [...(images || []).map(imageBlock), { type: 'text', text: String(text ?? '') }];
}
