/**
 * Component Extractor — transforms tagged canvas component frames into ComponentPayload.
 */

import type { CanvasElement } from '@/features/canvas/types';
import type {
  ComponentDefinition,
  ComponentProp as CanvasComponentProp,
} from '@/features/canvas/types/components';
import type {
  ComponentPayload,
  ComponentProp,
  ComponentSlot,
  ComponentVariant,
} from '@/types/design-documents/component';
import { getDesignSourceTag } from '@/features/canvas/services/documentGenerator/tagging';

/** Map canvas component prop type to design document prop type. */
function mapPropType(canvasProp: CanvasComponentProp): ComponentProp['type'] {
  const typeMap: Record<string, ComponentProp['type']> = {
    text: 'string',
    color: 'string',
    boolean: 'boolean',
    number: 'number',
    image: 'string',
  };
  return typeMap[canvasProp.type] || 'string';
}

/** Extract props from a component definition. */
function extractProps(def: ComponentDefinition): ComponentProp[] {
  return def.exposedProps.map((p) => ({
    name: p.key,
    type: mapPropType(p),
    default: p.defaultValue as string | number | boolean | undefined,
    description: p.label,
  }));
}

/** Extract variants from component frames tagged as variant sources. */
function extractVariants(frames: CanvasElement[], componentName: string): ComponentVariant[] {
  return frames
    .filter((f) => {
      const tag = getDesignSourceTag(f);
      return tag?.type === 'variant' && tag.parent === componentName;
    })
    .map((f) => ({
      name: f.name || 'unnamed',
      frame_id: f.id,
      overrides: extractTokenOverrides(f),
    }));
}

/** Extract token overrides from element properties fill references. */
function extractTokenOverrides(el: CanvasElement): Record<string, string> {
  const overrides: Record<string, string> = {};
  const fill = el.properties.fill;
  if (fill && typeof fill === 'string' && fill.startsWith('var(')) {
    overrides['background'] = fill;
  }
  return overrides;
}

/** Extract a ComponentPayload from a component definition and its frames. */
export function extractComponent(
  def: ComponentDefinition,
  frames: CanvasElement[]
): ComponentPayload {
  const props = extractProps(def);
  const variants = extractVariants(frames, def.name);

  const slots: ComponentSlot[] = [{ name: 'default', description: 'Default slot content' }];
  const states = ['default', 'hover', 'active', 'focus', 'disabled'];

  return {
    component_name: def.name,
    file_path: `src/lib/components/${def.name}.svelte`,
    description: def.description || '',
    props,
    slots,
    states,
    token_bindings: {},
    variants,
    code_connect: {
      import: `import ${def.name} from '@/components/${def.name}.svelte';`,
      usage: `<${def.name} />`,
    },
  };
}
