/**
 * Which engine answers a triaged turn.
 *
 * The ACTION intent covers writes and in-app shortcuts alike, and only the agent
 * loop can carry a write out. These tests pin both halves of that split: a write
 * phrased as an action still reaches the tools, and the canvas/navigation/memory
 * shortcuts the tool registry has no action for keep their own flow.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { shouldUseAgentLoop, needsInAppShortcut } from './brnyRouting.js';

const agent = (intent, text) => shouldUseAgentLoop({ intent, text, agentAvailable: true });

test('questions go to the agent loop', () => {
  assert.equal(agent('QUESTION', 'how many hours on J-00028?'), true);
  assert.equal(agent('QUESTION', 'who is on site today?'), true);
});

test('a write phrased as an action goes to the agent loop, not the tag flow', () => {
  // The rule-based triage labels all of these ACTION. Before the fix the label
  // alone sent them to a flow with no tools, so none of them could be carried out.
  assert.equal(agent('ACTION', 'add 2 hours to J-00028'), true);
  assert.equal(agent('ACTION', 'create a job for Newcastle Ballet Theatre'), true);
  assert.equal(agent('ACTION', 'log 2 hours on the Main Task of ZZ Agent Hours Proof'), true);
  assert.equal(agent('ACTION', 'book that job in for Tuesday'), true);
  assert.equal(agent('ACTION', 'create a job for Acme and add 2 hours to its Main Task'), true);
  assert.equal(agent('ACTION', 'mark the job complete'), true);
  assert.equal(agent('ACTION', 'send the invoice for J-00030'), true);
});

test('the canvas, navigation and memory shortcuts keep their own flow', () => {
  // No action in the registry can move a viewport, open a panel or remember a
  // fact, so these cannot be handed to the agent loop.
  assert.equal(agent('ACTION', 'fit the canvas'), false);
  assert.equal(agent('ACTION', 'lock the canvas'), false);
  assert.equal(agent('ACTION', 'add a widget to the dashboard'), false);
  assert.equal(agent('ACTION', 'jump to the schedule view'), false);
  assert.equal(agent('ACTION', 'take me to the invoices page'), false);
  assert.equal(agent('ACTION', 'open the jobs page'), false);
  assert.equal(agent('ACTION', 'remember we do not charge for travel'), false);
  assert.equal(agent('ACTION', 'resolve the double booking'), false);
  assert.equal(agent('ACTION', 'bulk update the status of these jobs'), false);
  assert.equal(agent('ACTION', 'optimise the schedule for Tuesday'), false);
  assert.equal(agent('ACTION', 'reorder the 15A RCBO'), false);
  assert.equal(agent('ACTION', 'update the fact sheet for Acme'), false);
});

test('external and urgent turns keep their specialist handlers', () => {
  // Both carry side effects of their own (drive times, the emergency scan).
  assert.equal(agent('EXTERNAL', 'what is the weather in Newcastle?'), false);
  assert.equal(agent('EXTERNAL', 'drive time to Wallsend'), false);
  assert.equal(agent('URGENT', 'urgent: no power at the Jesmond site'), false);
});

test('without a mounted thread nothing goes to the agent loop', () => {
  for (const intent of ['QUESTION', 'ACTION', 'EXTERNAL', 'URGENT']) {
    assert.equal(shouldUseAgentLoop({ intent, text: 'add 2 hours to J-00028', agentAvailable: false }), false);
    assert.equal(shouldUseAgentLoop({ intent, text: 'fit the canvas', agentAvailable: false }), false);
  }
});

test('the shortcut check is a plain text test with no hidden state', () => {
  assert.equal(needsInAppShortcut('fit the canvas'), true);
  assert.equal(needsInAppShortcut('add 2 hours to J-00028'), false);
  assert.equal(needsInAppShortcut(''), false);
  assert.equal(needsInAppShortcut(null), false);
  assert.equal(needsInAppShortcut(undefined), false);
});
