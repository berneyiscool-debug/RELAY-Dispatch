// Replacement for inline `on*` handler attributes.
//
// A Content-Security-Policy can only allow inline event handlers by turning on
// 'unsafe-inline', which re-opens the XSS hole the rest of the policy closes. So
// markup declares the interaction with a data attribute instead and one listener
// on the document performs it. Delegation also survives the frequent innerHTML
// re-renders of the list views, where per-render wiring would be lost.

const HOOK_SELECTOR = [
  '[data-nav]',
  '[data-close-window]',
  '[data-click-el]',
  '[data-alert]',
  '[data-stop-propagation]',
].join(',');

/**
 * Runs the interaction declared by the nearest hook element, if any.
 * Returns true when the element declared something this module understands.
 */
export function performDelegatedAction(hook, event, doc = document) {
  if (!hook) return false;
  const { dataset } = hook;

  // Handled first: the nearest hook wins, so a row-level `data-nav` must not
  // also fire when the click landed on a control inside it.
  if ('stopPropagation' in dataset) {
    event.stopPropagation();
    return true;
  }

  if ('nav' in dataset) {
    doc.defaultView.location.hash = dataset.nav;
    return true;
  }

  if ('closeWindow' in dataset) {
    doc.defaultView.close();
    return true;
  }

  if (dataset.clickEl) {
    doc.getElementById(dataset.clickEl)?.click();
    return true;
  }

  if ('alert' in dataset) {
    event.preventDefault();
    doc.defaultView.alert(dataset.alert);
    return true;
  }

  return false;
}

/** Click handler for the delegated listener; exported so it can be unit tested. */
export function handleDelegatedClick(event) {
  const target = event?.target;
  if (!target || typeof target.closest !== 'function') return;
  performDelegatedAction(target.closest(HOOK_SELECTOR), event);
}

let installed = false;

/** Idempotent: the app shell and any test bootstrap can both call it safely. */
export function installDelegatedEvents(root = document) {
  if (installed) return false;
  installed = true;
  root.addEventListener('click', handleDelegatedClick);
  return true;
}
