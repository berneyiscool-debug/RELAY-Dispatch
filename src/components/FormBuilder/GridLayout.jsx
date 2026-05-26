// src/components/FormBuilder/GridLayout.jsx

import React, { useState, useEffect } from 'react';
import './GridLayout.css'; // styling file (we will create a simple CSS module later)

/**
 * GridLayout – renders a section using CSS Grid.
 * Props:
 *   section: { id, title, gridTemplate, gridGap, items }
 *   onUpdate: (updatedSection) => void – called when items change (e.g., reposition).
 */
const GridLayout = ({ section, onUpdate }) => {
  const [items, setItems] = useState(section.items || []);

  // Sync local state when section prop changes
  useEffect(() => {
    setItems(section.items || []);
  }, [section]);

  const handleKeyMove = (e, itemId) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const idx = items.findIndex(i => i.id === itemId);
    if (idx === -1) return;
    const item = items[idx];
    // Simple grid movement: adjust gridArea coordinates (row/start/col/start)
    const area = item.gridArea ? item.gridArea.split(' / ').map(Number) : [1, 1, 2, 2]; // [rowStart, colStart, rowEnd, colEnd]
    let [rS, cS, rE, cE] = area;
    switch (e.key) {
      case 'ArrowUp': rS = Math.max(1, rS - 1); rE = Math.max(rS + 1, rE - 1); break;
      case 'ArrowDown': rS += 1; rE += 1; break;
      case 'ArrowLeft': cS = Math.max(1, cS - 1); cE = Math.max(cS + 1, cE - 1); break;
      case 'ArrowRight': cS += 1; cE += 1; break;
      default: break;
    }
    const newArea = `${rS} / ${cS} / ${rE} / ${cE}`;
    const updatedItem = { ...item, gridArea: newArea };
    const newItems = [...items];
    newItems[idx] = updatedItem;
    setItems(newItems);
    onUpdate && onUpdate({ ...section, items: newItems });
  };

  const renderItem = (item) => {
    const style = item.gridArea ? { gridArea: item.gridArea } : {};
    const commonProps = {
      tabIndex: 0,
      onKeyDown: (e) => handleKeyMove(e, item.id),
      className: `grid-item ${item.kind}`,
      style,
    };

    switch (item.kind) {
      case 'field':
        return (
          <div key={item.id} {...commonProps}>
            <label className="field-label">{item.label}{item.required && '*'}:</label>
            <input type={item.type} defaultValue={item.value} className="field-input" />
          </div>
        );
      case 'spacer':
        return (
          <div key={item.id} {...commonProps} className="grid-item spacer" style={{ ...style, background: 'transparent', minHeight: item.height, minWidth: item.width }}></div>
        );
      case 'information':
        return (
          <div key={item.id} {...commonProps} className="grid-item information">
            <p className="info-content" dangerouslySetInnerHTML={{ __html: item.content }} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="form-section" aria-label={section.title}>
      <h3 className="section-title">{section.title}</h3>
      <div
        className="grid-container"
        style={{
          display: 'grid',
          gridTemplateColumns: section.gridTemplate,
          gap: section.gridGap,
          background: 'rgba(255,255,255,0.05)', // glass‑morphism subtle background
          padding: '1rem',
          borderRadius: '0.75rem',
          backdropFilter: 'blur(8px)'
        }}
      >
        {items.map(renderItem)}
      </div>
    </section>
  );
};

export default GridLayout;
