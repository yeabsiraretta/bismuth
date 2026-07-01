/**
 * Unit tests for design document schema validation.
 */

import { describe, it, expect } from 'vitest';
import {
  validateDocument,
  isValidEnvelope,
  isValidTokenPayload,
  isValidComponentPayload,
  isValidLayoutPayload,
  isValidFlowPayload,
  isValidThemePayload,
  isValidPagePayload,
} from '../validation';

const validEnvelope = {
  schema_version: '1.0.0',
  document_type: 'token',
  document_id: 'tok_001',
  name: 'Test Tokens',
  canvas_source: { document_id: 'doc_1', page_id: 'page_1', frame_ids: [] },
  created_at: '2026-01-01T00:00:00Z',
  modified_at: '2026-01-01T00:00:00Z',
  version: 1,
  payload: { collections: [] },
};

describe('isValidEnvelope', () => {
  it('returns true for a valid envelope', () => {
    expect(isValidEnvelope(validEnvelope)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidEnvelope(null)).toBe(false);
  });

  it('returns false for missing fields', () => {
    expect(isValidEnvelope({})).toBe(false);
    expect(isValidEnvelope({ schema_version: '1.0.0' })).toBe(false);
  });

  it('returns false for invalid document_type', () => {
    expect(isValidEnvelope({ ...validEnvelope, document_type: 'invalid' })).toBe(false);
  });

  it('returns false when payload is undefined', () => {
    const { payload, ...noPayload } = validEnvelope;
    expect(isValidEnvelope(noPayload)).toBe(false);
  });
});

describe('isValidTokenPayload', () => {
  it('accepts valid token payload', () => {
    const payload = {
      collections: [{ name: 'colors', tokens: [{ name: 'primary', type: 'color', values: { default: '#000' }, css_var: '--color-primary' }] }],
    };
    expect(isValidTokenPayload(payload)).toBe(true);
  });

  it('accepts empty collections array', () => {
    expect(isValidTokenPayload({ collections: [] })).toBe(true);
  });

  it('rejects missing collections', () => {
    expect(isValidTokenPayload({})).toBe(false);
  });

  it('rejects collection without name', () => {
    expect(isValidTokenPayload({ collections: [{ tokens: [] }] })).toBe(false);
  });
});

describe('isValidComponentPayload', () => {
  it('accepts valid component payload', () => {
    const payload = {
      component_name: 'Button',
      file_path: 'src/lib/components/Button.svelte',
      description: 'A button',
      props: [],
      slots: [],
      states: ['default'],
      token_bindings: {},
      variants: [],
      code_connect: { import: '', usage: '' },
    };
    expect(isValidComponentPayload(payload)).toBe(true);
  });

  it('rejects payload missing required fields', () => {
    expect(isValidComponentPayload({ component_name: 'Button' })).toBe(false);
  });
});

describe('isValidLayoutPayload', () => {
  it('accepts valid layout payload', () => {
    const payload = { layout_name: 'Main', type: 'grid', breakpoints: {}, regions: [] };
    expect(isValidLayoutPayload(payload)).toBe(true);
  });

  it('rejects invalid type', () => {
    expect(isValidLayoutPayload({ layout_name: 'Main', type: 'table', breakpoints: {}, regions: [] })).toBe(false);
  });
});

describe('isValidFlowPayload', () => {
  it('accepts valid flow payload', () => {
    const payload = { flow_name: 'Login', description: '', steps: [], error_paths: [], components_used: [] };
    expect(isValidFlowPayload(payload)).toBe(true);
  });

  it('rejects missing steps', () => {
    expect(isValidFlowPayload({ flow_name: 'Login' })).toBe(false);
  });
});

describe('isValidThemePayload', () => {
  it('accepts valid theme payload', () => {
    const payload = { theme_name: 'dark', extends: 'tokens.json', attribute: 'data-theme="dark"', overrides: {}, css_output_path: 'x.css' };
    expect(isValidThemePayload(payload)).toBe(true);
  });

  it('rejects missing overrides', () => {
    expect(isValidThemePayload({ theme_name: 'dark' })).toBe(false);
  });
});

describe('isValidPagePayload', () => {
  it('accepts valid page payload', () => {
    const payload = { page_name: 'Home', route: '/', layout: 'main', components: [], responsive_variants: {} };
    expect(isValidPagePayload(payload)).toBe(true);
  });

  it('rejects missing route', () => {
    expect(isValidPagePayload({ page_name: 'Home', layout: 'main', components: [] })).toBe(false);
  });
});

describe('validateDocument', () => {
  it('validates a complete token document', () => {
    const doc = { ...validEnvelope, payload: { collections: [{ name: 'colors', tokens: [] }] } };
    const result = validateDocument(doc);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails with invalid envelope', () => {
    const result = validateDocument({ foo: 'bar' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('envelope');
  });

  it('fails with valid envelope but invalid payload', () => {
    const doc = { ...validEnvelope, document_type: 'component', payload: {} };
    const result = validateDocument(doc);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('component payload');
  });
});
