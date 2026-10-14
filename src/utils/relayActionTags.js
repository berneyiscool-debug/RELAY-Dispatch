// ============================================
// RELAY — ASSISTANT ACTION TAGS
// ============================================
// Parse [ACTION: ...] tags out of a model reply WITHOUT executing them. Returns
// { actions: [{ action, param }], cleanReply }. The attachment flow uses this to
// hold extracted records for user confirmation before creating them.
// Deliberately DOM- and store-free so it can be unit tested outside a browser.
// ============================================

export function extractActions(reply) {
  // Replies are prose, but a caller that forgets to await an async path can hand
  // this a pending promise; there are no tags to pull out of one of those.
  if (typeof reply !== 'string') return { actions: [], cleanReply: '' };

  const actions = [];
  let cleanReply = reply;

  const prefix = '[ACTION:';
  let startIndex = 0;

  while ((startIndex = cleanReply.toUpperCase().indexOf(prefix, startIndex)) !== -1) {
    let bracketCount = 0;
    let endIndex = -1;

    for (let i = startIndex; i < cleanReply.length; i++) {
      if (cleanReply[i] === '[') bracketCount++;
      else if (cleanReply[i] === ']') bracketCount--;

      if (bracketCount === 0) {
        endIndex = i;
        break;
      }
    }

    if (endIndex !== -1) {
      const fullTag = cleanReply.substring(startIndex, endIndex + 1);
      const inner = fullTag.substring(prefix.length, fullTag.length - 1).trim();

      const firstComma = inner.indexOf(',');
      let actionName, paramStr;

      if (firstComma !== -1) {
        actionName = inner.substring(0, firstComma).trim().toUpperCase();
        paramStr = inner.substring(firstComma + 1).trim();
      } else {
        actionName = inner.toUpperCase();
        paramStr = null;
      }

      actions.push({ action: actionName, param: paramStr });
      cleanReply = cleanReply.substring(0, startIndex) + cleanReply.substring(endIndex + 1);
    } else {
      // Malformed tag, just skip past it
      startIndex += prefix.length;
    }
  }

  cleanReply = cleanReply.trim();
  return { actions, cleanReply };
}
