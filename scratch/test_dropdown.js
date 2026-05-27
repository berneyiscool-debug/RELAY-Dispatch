import { JSDOM } from 'jsdom';

const dom = new JSDOM(`<!DOCTYPE html><html><body>
  <div id="container">
    <select class="form-select" id="test-select">
      <option value="">Select customer...</option>
      <option value="1">Company A</option>
      <option value="2">Company B</option>
    </select>
  </div>
</body></html>`);

global.document = dom.window.document;
global.window = dom.window;
global.Node = dom.window.Node;
global.MutationObserver = dom.window.MutationObserver;

// Import the module dynamically after JSDOM setup
const { enhanceSelect } = await import('../src/utils/searchableSelect.js');

const select = document.getElementById('test-select');
enhanceSelect(select);

const container = document.querySelector('.searchable-select-container');
const input = container.querySelector('.searchable-select-input');
const arrow = container.querySelector('.searchable-select-arrow');
const dropdown = container.querySelector('.searchable-select-dropdown');

console.log('--- Initial State ---');
console.log('Dropdown style.display:', dropdown.style.display);
console.log('Dropdown innerHTML:', dropdown.innerHTML);

console.log('\n--- Focusing Input ---');
input.dispatchEvent(new dom.window.Event('focus'));
console.log('Dropdown style.display:', dropdown.style.display);
console.log('Dropdown innerHTML:', dropdown.innerHTML);

console.log('\n--- Inputting "Comp" ---');
input.value = 'Comp';
input.dispatchEvent(new dom.window.Event('input'));
console.log('Dropdown style.display:', dropdown.style.display);
console.log('Dropdown innerHTML:', dropdown.innerHTML);
