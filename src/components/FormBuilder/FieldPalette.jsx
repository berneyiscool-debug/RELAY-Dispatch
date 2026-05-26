// src/components/FormBuilder/FieldPalette.jsx

/**
 * Simple field palette for the compliance form builder.
 * Renders a list of draggable field types that the user can add to the form.
 * This implementation uses plain HTML drag‑and‑drop events and calls a
 * provided `onAddItem` callback with a newly created field/spacer/info object.
 */
export function FieldPalette({ onAddItem }) {
  const items = [
    { kind: 'field', label: 'Text Field', type: 'text', required: false },
    { kind: 'field', label: 'Number Field', type: 'number', required: false },
    { kind: 'field', label: 'Date Field', type: 'date', required: false },
    { kind: 'field', label: 'Checkbox', type: 'checkbox', required: false },
    { kind: 'spacer', width: '1fr', height: 'auto' },
    { kind: 'information', content: '<em>Information Block</em>' }
  ];

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
  };

  return `
    <div class="field-palette">
      <h4>Field Palette</h4>
      ${items.map(item => {
        const title = item.kind === 'field' ? `${item.label} (${item.type})` : item.kind.charAt(0).toUpperCase() + item.kind.slice(1);
        return `<div class="palette-item" draggable="true" ondragstart="event.dataTransfer.setData('application/json', '${JSON.stringify(item).replace(/"/g, '&quot;')}')" data-item='${JSON.stringify(item)}'>${title}</div>`;
      }).join('')}
    </div>
  `;
}
