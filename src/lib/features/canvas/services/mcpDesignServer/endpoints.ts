/**
 * MCP Design Server — Extraction & Translation layers
 *
 * Layer 1: Extract canvas element tree
 * Layer 2: Generate structured design summary
 * Layer 3: Svelte component code generation
 */

import type {
  CanvasDocument,
  CanvasElement,
  ComponentDefinition,
  AutoLayout,
} from '@/features/canvas/types';

import type {
  DesignSummary,
  ComponentExport,
  ColorExport,
  SpacingExport,
  TypographyExport,
  LayoutExport,
  ElementExport,
  CodeMapping,
} from '@/features/canvas/services/mcpDesignServer';

export const BISMUTH_CODE_MAPPINGS: CodeMapping[] = [
  { match: 'builtin-button', tag: '<Button>', defaultProps: { variant: 'primary' } },
  { match: 'builtin-input', tag: '<Input>', defaultProps: { type: 'text' } },
  { match: 'builtin-card', tag: '<Card>', defaultProps: {} },
  { match: 'frame', tag: '<div>', defaultProps: { class: 'frame' } },
  { match: 'rectangle', tag: '<div>', defaultProps: {} },
  { match: 'circle', tag: '<div>', defaultProps: { class: 'rounded-full' } },
  { match: 'text', tag: '<p>', defaultProps: {} },
  { match: 'image', tag: '<img>', defaultProps: {} },
  { match: 'group', tag: '<div>', defaultProps: { class: 'group' } },
];

/**
 * Extracts the full element tree from a canvas document.
 */
export function extractCanvasTree(canvas: CanvasDocument): ElementExport[] {
  const roots = canvas.elements.filter((el) => !el.parentId);
  return roots.map((el) => elementToExport(el, canvas.elements, canvas.components));
}

function elementToExport(
  element: CanvasElement,
  allElements: CanvasElement[],
  components: ComponentDefinition[]
): ElementExport {
  const children = allElements
    .filter((e) => e.parentId === element.id)
    .sort((a, b) => a.z_index - b.z_index);

  let componentTag: string | undefined;
  if (element.element_type === 'component_instance' && element.properties.componentId) {
    const comp = components.find((c) => c.id === element.properties.componentId);
    if (comp) {
      componentTag = comp.name;
    }
  }

  return {
    id: element.id,
    name: element.name ?? element.element_type,
    type: element.element_type,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    componentTag,
    children: children.map((c) => elementToExport(c, allElements, components)),
  };
}

/**
 * Generates a structured design summary from a Bismuth canvas.
 */
export function generateDesignSummary(canvas: CanvasDocument): DesignSummary {
  const colorMap = new Map<string, number>();
  const spacingEntries: SpacingExport[] = [];
  const typographyEntries: TypographyExport[] = [];
  const componentEntries: ComponentExport[] = [];
  const layoutEntries: LayoutExport[] = [];

  for (const element of canvas.elements) {
    if (element.properties.fill) {
      colorMap.set(element.properties.fill, (colorMap.get(element.properties.fill) || 0) + 1);
    }
    if (element.properties.stroke) {
      colorMap.set(element.properties.stroke, (colorMap.get(element.properties.stroke) || 0) + 1);
    }

    if (element.element_type === 'text' && element.properties.fontSize) {
      typographyEntries.push({
        fontFamily: element.properties.fontFamily ?? 'Inter',
        fontSize: element.properties.fontSize,
        fontWeight: element.properties.fontWeight ?? 400,
        lineHeight: element.properties.lineHeight,
        token: null,
      });
    }

    if (element.properties.autoLayout) {
      const al = element.properties.autoLayout as AutoLayout;
      layoutEntries.push({
        elementId: element.id,
        elementName: element.name ?? element.element_type,
        type: 'flex',
        direction: al.direction,
        gap: al.gap,
        padding: al.padding,
        alignItems: al.alignItems,
        justifyContent: al.justifyContent,
      });

      if (al.gap > 0) {
        spacingEntries.push({ raw: al.gap, token: null, cssVar: null, context: 'gap' });
      }
      if (al.padding.top > 0) {
        spacingEntries.push({
          raw: al.padding.top,
          token: null,
          cssVar: null,
          context: 'padding-top',
        });
      }
    }

    if (element.element_type === 'component_instance' && element.properties.componentId) {
      const comp = canvas.components.find((c) => c.id === element.properties.componentId);
      if (comp) {
        componentEntries.push({
          name: comp.name,
          tag: comp.name,
          props: (element.properties.overrides as Record<string, string>) ?? {},
          tokenBindings: {},
          elementId: element.id,
        });
      }
    }
  }

  const colorEntries: ColorExport[] = Array.from(colorMap.entries()).map(([raw, count]) => ({
    raw,
    token: null,
    cssVar: null,
    count,
  }));

  return {
    canvas: {
      id: canvas.id,
      name: canvas.name,
      width: Math.max(...canvas.elements.map((e) => e.x + e.width), 0),
      height: Math.max(...canvas.elements.map((e) => e.y + e.height), 0),
    },
    components: componentEntries,
    colors: colorEntries,
    spacing: deduplicateSpacing(spacingEntries),
    typography: deduplicateTypography(typographyEntries),
    layouts: layoutEntries,
    elementTree: extractCanvasTree(canvas),
    _stats: {
      totalElements: canvas.elements.length,
      componentInstances: canvas.elements.filter((e) => e.element_type === 'component_instance')
        .length,
      frames: canvas.elements.filter((e) => e.element_type === 'frame').length,
      textNodes: canvas.elements.filter((e) => e.element_type === 'text').length,
      tokensCovered: 0,
      tokensUnresolved: 0,
    },
  };
}

function deduplicateSpacing(entries: SpacingExport[]): SpacingExport[] {
  const seen = new Set<string>();
  return entries.filter((e) => {
    const key = `${e.raw}:${e.context}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deduplicateTypography(entries: TypographyExport[]): TypographyExport[] {
  const seen = new Set<string>();
  return entries.filter((e) => {
    const key = `${e.fontSize}:${e.fontWeight}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Generates a Svelte component code skeleton from the design summary.
 */
export function generateSvelteComponent(
  summary: DesignSummary,
  componentName: string = 'GeneratedComponent'
): string {
  const imports: string[] = [];
  const templateParts: string[] = [];
  const styleParts: string[] = [];

  const uniqueComponents = new Set(summary.components.map((c) => c.tag.replace(/[<>]/g, '')));
  for (const comp of uniqueComponents) {
    if (comp !== 'div' && comp !== 'p' && comp !== 'img') {
      imports.push(`  import ${comp} from '@/components/${comp}.svelte';`);
    }
  }

  for (const color of summary.colors) {
    if (color.cssVar) {
      styleParts.push(`    /* ${color.raw} → ${color.cssVar} */`);
    }
  }

  templateParts.push(`<div class="${componentName.toLowerCase()}">`);
  for (const comp of summary.components) {
    const propsStr = Object.entries(comp.props)
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ');
    templateParts.push(`  ${comp.tag.replace('>', propsStr ? ' ' + propsStr + '>' : '>')}`);
  }
  templateParts.push('</div>');

  return [
    '<script lang="ts">',
    ...imports,
    '</script>',
    '',
    ...templateParts,
    '',
    '<style>',
    `  .${componentName.toLowerCase()} {`,
    ...styleParts,
    '  }',
    '</style>',
  ].join('\n');
}
