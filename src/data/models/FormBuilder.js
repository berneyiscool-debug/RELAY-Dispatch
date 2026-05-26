// src/data/models/FormBuilder.js

/**
 * Schema definition for a Compliance Form Builder.
 *
 * A form consists of an ordered list of sections. Each section contains a grid layout
 * defined by CSS‑grid coordinates. Fields can be of various types and may include
 * special "Spacer" or "Information" blocks.
 */
export const createFormDefinition = ({
  id = null,
  name = 'New Form',
  version = 1,
  createdAt = new Date().toISOString(),
  updatedAt = new Date().toISOString(),
  sections = []
} = {}) => ({
  id: id || generateId(),
  name,
  version,
  createdAt,
  updatedAt,
  sections, // array of Section objects
});

export const createSection = ({
  id = null,
  title = 'Section',
  gridTemplate = 'auto', // CSS grid-template (e.g., "100px 1fr 100px")
  gridGap = '1rem',
  items = []
} = {}) => ({
  id: id || generateId(),
  title,
  gridTemplate,
  gridGap,
  items, // array of Field/Spacer/Information objects
});

export const createField = ({
  id = null,
  label = 'Field',
  type = 'text', // text, number, date, boolean, etc.
  required = false,
  gridArea = null, // e.g., "1 / 1 / 2 / 3"
  value = ''
} = {}) => ({
  id: id || generateId(),
  kind: 'field',
  label,
  type,
  required,
  gridArea,
  value,
});

export const createSpacer = ({
  id = null,
  width = '1fr',
  height = 'auto',
  gridArea = null
} = {}) => ({
  id: id || generateId(),
  kind: 'spacer',
  width,
  height,
  gridArea,
});

export const createInformation = ({
  id = null,
  content = '',
  gridArea = null
} = {}) => ({
  id: id || generateId(),
  kind: 'information',
  content,
  gridArea,
});

// Helper to generate a short unique id – we reuse the store's generator for consistency.
import { store } from '../store.js';
const generateId = () => store.generateId();
