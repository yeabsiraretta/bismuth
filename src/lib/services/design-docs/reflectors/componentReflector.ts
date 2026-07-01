/**
 * Component Reflector — parses a Svelte component file to produce a ComponentPayload.
 * Reads `export let` for props, `<slot>` for slots, and var() references for token bindings.
 */

import type { ComponentPayload, ComponentProp, ComponentSlot } from '@/types/design-documents/component';

/** Parse a Svelte component file and extract a ComponentPayload. */
export function reflectComponentFromSvelte(
  fileContent: string,
  fileName: string
): ComponentPayload {
  const componentName = fileName.replace('.svelte', '');
  const props = extractExportedProps(fileContent);
  const slots = extractSlots(fileContent);
  const tokenBindings = extractTokenBindings(fileContent);

  return {
    component_name: componentName,
    file_path: `src/lib/components/${fileName}`,
    description: extractDescription(fileContent),
    props,
    slots,
    states: ['default', 'hover', 'active', 'focus', 'disabled'],
    token_bindings: tokenBindings,
    variants: [],
    code_connect: {
      import: `import ${componentName} from '@/components/${fileName}';`,
      usage: `<${componentName} />`,
    },
  };
}

/** Extract exported props from `export let propName` declarations. */
function extractExportedProps(content: string): ComponentProp[] {
  const props: ComponentProp[] = [];
  const propRegex = /export\s+let\s+(\w+)(?:\s*:\s*(\w+))?(?:\s*=\s*(.+?))?;/g;
  let match;

  while ((match = propRegex.exec(content)) !== null) {
    const [, name, typeHint, defaultValue] = match;
    props.push({
      name,
      type: inferType(typeHint, defaultValue),
      default: parseDefault(defaultValue),
      description: undefined,
    });
  }
  return props;
}

/** Extract slot definitions from <slot> tags. */
function extractSlots(content: string): ComponentSlot[] {
  const slots: ComponentSlot[] = [];
  const slotRegex = /<slot(?:\s+name="([^"]+)")?/g;
  let match;
  const seen = new Set<string>();

  while ((match = slotRegex.exec(content)) !== null) {
    const name = match[1] || 'default';
    if (!seen.has(name)) {
      seen.add(name);
      slots.push({ name });
    }
  }
  if (slots.length === 0) {
    slots.push({ name: 'default' });
  }
  return slots;
}

/** Extract token bindings from var(--token-name) references in CSS. */
function extractTokenBindings(content: string): Record<string, string> {
  const bindings: Record<string, string> = {};
  const varRegex = /([\w-]+)\s*:\s*var\((--[\w-]+)\)/g;
  let match;

  while ((match = varRegex.exec(content)) !== null) {
    const [, cssProperty, cssVar] = match;
    bindings[cssProperty] = `var(${cssVar})`;
  }
  return bindings;
}

/** Extract description from top-level comment. */
function extractDescription(content: string): string {
  const commentMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\n/);
  return commentMatch?.[1]?.trim() || '';
}

/** Infer prop type from type hint or default value. */
function inferType(typeHint?: string, defaultValue?: string): ComponentProp['type'] {
  if (typeHint === 'boolean' || defaultValue === 'true' || defaultValue === 'false') return 'boolean';
  if (typeHint === 'number' || (defaultValue && /^\d+$/.test(defaultValue.trim()))) return 'number';
  return 'string';
}

/** Parse a default value string to a typed value. */
function parseDefault(raw?: string): string | number | boolean | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  return trimmed.replace(/^['"]|['"]$/g, '');
}
