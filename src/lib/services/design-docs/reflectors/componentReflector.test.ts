/**
 * Unit tests for component reflector — parses Svelte files into ComponentPayload.
 */

import { describe, it, expect } from 'vitest';
import { reflectComponentFromSvelte } from './componentReflector';

const sampleSvelte = `
/**
 * A primary action button.
 */
<script lang="ts">
  export let variant: string = 'primary';
  export let size: string = 'md';
  export let disabled: boolean = false;
  export let count: number = 0;
</script>

<button class="btn" class:disabled {disabled}>
  <slot name="icon" />
  <slot />
</button>

<style>
  .btn {
    background: var(--color-primary);
    padding: var(--space-s) var(--space-m);
    border-radius: var(--radius-m);
  }
</style>
`;

describe('reflectComponentFromSvelte', () => {
  it('extracts component name from filename', () => {
    const result = reflectComponentFromSvelte(sampleSvelte, 'Button.svelte');
    expect(result.component_name).toBe('Button');
  });

  it('extracts exported props', () => {
    const result = reflectComponentFromSvelte(sampleSvelte, 'Button.svelte');
    expect(result.props).toHaveLength(4);
    expect(result.props[0].name).toBe('variant');
    expect(result.props[2].name).toBe('disabled');
    expect(result.props[2].type).toBe('boolean');
    expect(result.props[3].name).toBe('count');
    expect(result.props[3].type).toBe('number');
  });

  it('extracts slots including named slots', () => {
    const result = reflectComponentFromSvelte(sampleSvelte, 'Button.svelte');
    const slotNames = result.slots.map((s) => s.name);
    expect(slotNames).toContain('default');
    expect(slotNames).toContain('icon');
  });

  it('extracts token bindings from var() references', () => {
    const result = reflectComponentFromSvelte(sampleSvelte, 'Button.svelte');
    expect(result.token_bindings['background']).toBe('var(--color-primary)');
    expect(result.token_bindings['border-radius']).toBe('var(--radius-m)');
  });

  it('extracts description from top comment', () => {
    const result = reflectComponentFromSvelte(sampleSvelte, 'Button.svelte');
    expect(result.description).toBe('A primary action button.');
  });

  it('generates correct import statement', () => {
    const result = reflectComponentFromSvelte(sampleSvelte, 'Button.svelte');
    expect(result.code_connect.import).toContain("import Button from");
  });

  it('handles file with no props', () => {
    const minimal = '<div>Hello</div>';
    const result = reflectComponentFromSvelte(minimal, 'Empty.svelte');
    expect(result.props).toHaveLength(0);
    expect(result.component_name).toBe('Empty');
  });

  it('parses default values correctly', () => {
    const result = reflectComponentFromSvelte(sampleSvelte, 'Button.svelte');
    const variant = result.props.find((p) => p.name === 'variant');
    expect(variant?.default).toBe('primary');
    const disabled = result.props.find((p) => p.name === 'disabled');
    expect(disabled?.default).toBe(false);
  });
});
