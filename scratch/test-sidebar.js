import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Setup JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>', {
  url: 'http://localhost'
});
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

// Import the module
const { createSidebar } = await import('../src/components/Sidebar.js');
const { store } = await import('../src/data/store.js');

// Test
const sidebar = createSidebar();
console.log('Sidebar logo HTML initially:', sidebar.querySelector('#sidebar-logo').innerHTML.trim());
console.log('Logo setting:', store.getSettings().logo ? store.getSettings().logo.substring(0, 50) + '...' : 'none');
