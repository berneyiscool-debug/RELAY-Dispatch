/**
 * Minimal JSON Schema builders for tool `input_schema`.
 *
 * The provider expects JSON Schema, so the short names here exist only to keep
 * ~30 tool definitions readable and to make `required` impossible to forget.
 */

export function objectSchema(properties, required = []) {
  return { type: 'object', properties, required, additionalProperties: false };
}

export const str = (description, extra = {}) => ({ type: 'string', description, ...extra });
export const num = (description, extra = {}) => ({ type: 'number', description, ...extra });
export const int = (description, extra = {}) => ({ type: 'integer', description, ...extra });
export const bool = (description, extra = {}) => ({ type: 'boolean', description, ...extra });

export const enumOf = (values, description) => ({ type: 'string', enum: values, description });

export const list = (items, description) => ({ type: 'array', items, description });

export const objectOf = (properties, description, required = []) => ({
  type: 'object',
  properties,
  required,
  description,
  additionalProperties: false,
});

/** A price line, shared by quote/invoice/PO item arrays. */
export const money = (description) => ({ type: 'number', description });

/** `YYYY-MM-DD`, or a natural-language relative date the resolver understands. */
export const dateish = (description) => str(description, { examples: ['2026-03-04', 'tomorrow', 'next Tuesday'] });
