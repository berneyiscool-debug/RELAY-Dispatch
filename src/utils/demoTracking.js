// ============================================
// RELAY — DEMO USAGE TRACKING
// ============================================
// Records how the no-signup demo is used and which signups it brings, through
// the relay-demo edge function (supabase/functions/relay-demo). The browser
// keeps one random demo id in localStorage, so a signup made in a later tab or
// visit is still credited to the demo. It is an anonymous marker, never an
// identity: nothing about the visitor is sent with it.
//
// Every call is fire-and-forget. Tracking must never slow down or break the
// screen that triggered it.

import { supabase } from './supabase.js';

const DEMO_ID_KEY = 'relay_demo_id';

function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // RFC 4122 v4 from Math.random, for the rare browser without randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** This browser's demo id, or null when it has never opened the demo. */
export function peekDemoId() {
  try {
    return localStorage.getItem(DEMO_ID_KEY) || null;
  } catch {
    return null;
  }
}

/** This browser's demo id, created on first use. */
export function getDemoId() {
  const existing = peekDemoId();
  if (existing) return existing;
  const id = newId();
  try { localStorage.setItem(DEMO_ID_KEY, id); } catch { /* private mode: a fresh id each time */ }
  return id;
}

/**
 * Record a demo event: 'demo_started' (with a source), 'signup_clicked' or
 * 'signup_completed'. Resolves once sent; never rejects.
 */
export async function trackDemoEvent(event, { source } = {}) {
  try {
    const body = { demoId: getDemoId(), event };
    if (source) body.source = source;
    await supabase.functions.invoke('relay-demo?action=event', { body });
  } catch (err) {
    console.warn('Demo tracking skipped:', err);
  }
}

/**
 * Credit a new company to the demo, when this browser has opened it. Called
 * once the company exists, with the new admin signed in: the server reads the
 * company from their session.
 */
export function trackDemoSignup() {
  if (!peekDemoId()) return Promise.resolve();
  return trackDemoEvent('signup_completed');
}
