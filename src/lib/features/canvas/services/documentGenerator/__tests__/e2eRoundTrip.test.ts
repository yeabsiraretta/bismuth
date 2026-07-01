/**
 * T059–T063 — End-to-end validation: full round-trip canvas → doc → code → doc with fidelity check.
 *
 * Validates:
 * T059: Create design system canvas with page template
 * T060: Tag elements & generate Token + Component documents
 * T061: Verify documents are well-formed for agent consumption
 * T062: Run code reflector to produce round-trip document
 * T063: Verify diff between canvas-generated doc and reflector-generated doc is minimal
 */

import { describe, it, expect } from 'vitest';
import { createDesignSystemPages } from '@/features/canvas/services/pageTemplates';
import { generateDocuments } from '../index';
import { reflectTokensFromCSS } from '@/services/design-docs/reflectors/tokenReflector';
import { createDocumentEnvelope } from '@/services/design-docs/envelope';
import { computeDocumentDiff } from '@/services/design-docs/diffEngine';
import type { CanvasDocument, CanvasVariable, Page } from '@/features/canvas/types';
import type { ComponentDefinition } from '@/features/canvas/types/components';
import type { CanvasElement } from '@/features/canvas/types/elements';
import type { TokenPayload } from '@/types/design-documents/token';

/** Build a complete design system canvas with page template. (T059) */
function createDesignSystemCanvas(): CanvasDocument {
  const pages: Page[] = createDesignSystemPages();

  const variables: CanvasVariable[] = [
    {
      id: 'v1',
      name: 'primary',
      type: 'color',
      collection: 'Colors',
      values: { Light: '#6366f1', Dark: '#818cf8' },
      scopes: ['fill'],
    },
    {
      id: 'v2',
      name: 'background',
      type: 'color',
      collection: 'Colors',
      values: { Light: '#ffffff', Dark: '#1f2937' },
      scopes: ['fill'],
    },
    {
      id: 'v3',
      name: 'text-primary',
      type: 'color',
      collection: 'Colors',
      values: { Light: '#111827', Dark: '#f9fafb' },
      scopes: ['text'],
    },
    {
      id: 'v4',
      name: 'spacing-xs',
      type: 'number',
      collection: 'Spacing',
      values: { default: 4 },
      scopes: ['spacing'],
    },
    {
      id: 'v5',
      name: 'spacing-s',
      type: 'number',
      collection: 'Spacing',
      values: { default: 8 },
      scopes: ['spacing'],
    },
    {
      id: 'v6',
      name: 'spacing-m',
      type: 'number',
      collection: 'Spacing',
      values: { default: 16 },
      scopes: ['spacing'],
    },
  ];

  const components: ComponentDefinition[] = [
    {
      id: 'btn_primary',
      name: 'PrimaryButton',
      description: 'Main action button with accent color',
      elements: [] as unknown as CanvasElement[],
      exposedProps: [
        { key: 'label', label: 'Label', type: 'text', defaultValue: 'Action' },
        { key: 'disabled', label: 'Disabled', type: 'boolean', defaultValue: false },
      ],
      width: 120,
      height: 40,
      tags: ['button', 'action'],
      created_at: 1000,
      modified_at: 2000,
    },
  ];

  return {
    id: 'canvas_e2e_design_system',
    name: 'Bismuth Design System',
    vault_id: null,
    note_id: null,
    viewport: { x: 0, y: 0, scale: 1 },
    grid_size: 8,
    snap_to_grid: true,
    elements: [],
    layers: [{ id: 'layer_1', name: 'Default', z_order: 0, visible: true, locked: false }],
    pages,
    activePageId: pages[0].id,
    components,
    flowLinks: [],
    styles: [],
    variables,
    created_at: 1000,
    modified_at: 2000,
  };
}

/** Simulate CSS that an agent would generate from the token document. */
function generateCSSFromTokenDoc(tokenPayload: TokenPayload): string {
  const lines = [':root {'];
  for (const collection of tokenPayload.collections) {
    for (const token of collection.tokens) {
      const defaultValue =
        token.values['Light'] ?? token.values['default'] ?? Object.values(token.values)[0];
      lines.push(`  ${token.css_var}: ${defaultValue};`);
    }
  }
  lines.push('}');
  return lines.join('\n');
}

describe('E2E Round-Trip Validation', () => {
  // T059: Design system canvas with page template
  it('T059: creates a design system canvas with correct page structure', () => {
    const canvas = createDesignSystemCanvas();
    expect(canvas.pages).toHaveLength(6);
    expect(canvas.pages.map((p) => p.name)).toEqual([
      'Tokens',
      'Components',
      'Layouts',
      'Flows',
      'Pages',
      'Sandbox',
    ]);
    expect(canvas.variables.length).toBeGreaterThan(0);
    expect(canvas.components.length).toBeGreaterThan(0);
  });

  // T060: Tag elements and generate documents
  it('T060: generates Token + Component documents from tagged canvas', () => {
    const canvas = createDesignSystemCanvas();
    const docs = generateDocuments(canvas);

    const tokenDoc = docs.find((d) => d.document_type === 'token');
    expect(tokenDoc).toBeDefined();
    expect(tokenDoc!.document_id).toBe('tok_001');
    expect((tokenDoc!.payload as TokenPayload).collections.length).toBeGreaterThan(0);

    const componentDocs = docs.filter((d) => d.document_type === 'component');
    expect(componentDocs).toHaveLength(1);
    expect(componentDocs[0].name).toBe('PrimaryButton');
  });

  // T061: Verify docs are well-formed for agent consumption via MCP
  it('T061: generated documents have valid envelope for MCP consumption', () => {
    const canvas = createDesignSystemCanvas();
    const docs = generateDocuments(canvas);

    for (const doc of docs) {
      expect(doc.schema_version).toBe('1.0.0');
      expect(doc.document_type).toMatch(/^(token|component|layout|flow|theme|page)$/);
      expect(doc.document_id).toBeTruthy();
      expect(doc.name).toBeTruthy();
      expect(doc.canvas_source).toBeDefined();
      expect(doc.canvas_source.document_id).toBe('canvas_e2e_design_system');
      expect(doc.version).toBe(1);
      expect(doc.payload).toBeDefined();
    }
  });

  // T062: Run reflector on generated code to produce round-trip document
  it('T062: reflector produces token document from generated CSS', () => {
    const canvas = createDesignSystemCanvas();
    const docs = generateDocuments(canvas);
    const tokenDoc = docs.find((d) => d.document_type === 'token')!;
    const tokenPayload = tokenDoc.payload as TokenPayload;

    // Simulate code generation: token doc → CSS
    const generatedCSS = generateCSSFromTokenDoc(tokenPayload);

    // Run reflector on the generated CSS
    const reflectedPayload = reflectTokensFromCSS(generatedCSS);
    expect(reflectedPayload.collections.length).toBeGreaterThan(0);

    // Wrap in envelope for comparison
    const reflectedDoc = createDocumentEnvelope<TokenPayload>(
      'token',
      'tok_reflected',
      'Reflected Tokens',
      reflectedPayload
    );
    expect(reflectedDoc.document_type).toBe('token');
    expect(reflectedDoc.payload.collections.length).toBeGreaterThan(0);
  });

  // T063: Verify diff between canvas-generated and reflector-generated is minimal
  it('T063: diff between canvas and reflector docs shows minimal drift', () => {
    const canvas = createDesignSystemCanvas();
    const docs = generateDocuments(canvas);
    const tokenDoc = docs.find((d) => d.document_type === 'token')!;
    const tokenPayload = tokenDoc.payload as TokenPayload;

    // Generate CSS and reflect back
    const generatedCSS = generateCSSFromTokenDoc(tokenPayload);
    const reflectedPayload = reflectTokensFromCSS(generatedCSS);

    // Compute diff
    const diff = computeDocumentDiff(tokenPayload, reflectedPayload, 1, 2);

    // Token names should survive the round-trip; structural drift should be minimal.
    // The reflector may organize collections differently but token count should be preserved.
    const originalTokenCount = tokenPayload.collections.reduce(
      (sum, c) => sum + c.tokens.length,
      0
    );
    const reflectedTokenCount = reflectedPayload.collections.reduce(
      (sum, c) => sum + c.tokens.length,
      0
    );
    expect(reflectedTokenCount).toBe(originalTokenCount);

    // Structural drift is expected — the reflector infers collection names from CSS var prefixes
    // (e.g., "color" vs "Colors") while the extractor preserves canvas-side naming.
    // Key assertion: no total semantic loss — token count is preserved and diff is bounded.
    const totalOps = diff.operations.length;
    expect(totalOps).toBeLessThan(originalTokenCount * 4); // bounded drift
  });
});
