/**
 * Input validation for tool calls.
 *
 * The model produces JSON that is *usually* right. Validating up front means a
 * bad call returns a precise `invalid_input` the model can correct on the next
 * step, instead of a downstream crash or, worse, a silently wrong write.
 */

import { invalidInput } from './errors.js';

function describeType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function coerce(value, schema) {
  // Models frequently emit "3" for a number or "true" for a boolean.
  if (schema.type === 'number' || schema.type === 'integer') {
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
      return schema.type === 'integer' ? Math.trunc(Number(value)) : Number(value);
    }
  }
  if (schema.type === 'boolean' && typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return value;
}

function checkValue(value, schema, path) {
  switch (schema.type) {
    case 'string':
      if (typeof value !== 'string') throw invalidInput(`${path} must be a string.`, { path });
      if (schema.enum && !schema.enum.includes(value)) {
        throw invalidInput(`${path} must be one of: ${schema.enum.join(', ')}. Got "${value}".`, {
          path,
          allowed: schema.enum,
        });
      }
      return value;
    case 'number':
    case 'integer': {
      const coerced = coerce(value, schema);
      if (typeof coerced !== 'number' || !Number.isFinite(coerced)) {
        throw invalidInput(`${path} must be a number.`, { path });
      }
      return coerced;
    }
    case 'boolean': {
      const coerced = coerce(value, schema);
      if (typeof coerced !== 'boolean') throw invalidInput(`${path} must be true or false.`, { path });
      return coerced;
    }
    case 'array': {
      if (!Array.isArray(value)) throw invalidInput(`${path} must be an array.`, { path });
      return value.map((entry, i) => (schema.items ? checkValue(entry, schema.items, `${path}[${i}]`) : entry));
    }
    case 'object': {
      if (describeType(value) !== 'object') throw invalidInput(`${path} must be an object.`, { path });
      return validateInput(schema, value, path);
    }
    default:
      return value;
  }
}

/**
 * Validate `input` against a JSON Schema object and return a cleaned copy.
 * Unknown properties are rejected so a typo like `customerID` cannot pass
 * through as a silent no-op write.
 */
export function validateInput(schema, input, path = 'input') {
  if (!schema || schema.type !== 'object') return input;

  // A free-form object (no declared properties): pass it through untouched rather
  // than validating it away to `{}`.
  if (!schema.properties && schema.additionalProperties !== false) return input;

  const raw = input && typeof input === 'object' && !Array.isArray(input) ? input : {};

  const unknown = Object.keys(raw).filter((key) => !(schema.properties || {})[key]);
  if (unknown.length && schema.additionalProperties === false) {
    throw invalidInput(
      `Unrecognised ${path} field${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}.`,
      { path, unknown, allowed: Object.keys(schema.properties || {}) }
    );
  }

  const cleaned = {};
  for (const [key, propSchema] of Object.entries(schema.properties || {})) {
    const value = raw[key];
    if (value === undefined || value === null || value === '') {
      if ((schema.required || []).includes(key)) {
        throw invalidInput(`${path}.${key} is required.`, { path: `${path}.${key}` });
      }
      continue;
    }
    cleaned[key] = checkValue(value, propSchema, `${path}.${key}`);
  }

  for (const key of schema.required || []) {
    if (cleaned[key] === undefined) throw invalidInput(`${path}.${key} is required.`, { path: `${path}.${key}` });
  }

  return cleaned;
}
