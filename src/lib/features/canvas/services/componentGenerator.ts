/**
 * Svelte Component Generator (T131)
 *
 * Converts canvas elements into valid Svelte component markup with
 * inline styles, generating a self-contained .svelte file string.
 */

import type { CanvasElement } from '@/features/canvas/types';

interface GeneratorOptions {
  /** Component name (PascalCase). Defaults to 'GeneratedComponent'. */
  componentName?: string;
  /** Whether to include a <script> block with exported props. */
  includeScript?: boolean;
  /** Whether to use CSS classes instead of inline styles. */
  useCssClasses?: boolean;
}

/**
 * Generate a Svelte component string from canvas elements.
 *
 * @param elements - Array of canvas elements to convert to markup.
 * @param options - Generation options.
 * @returns A valid Svelte component source string.
 */
export function generateSvelteComponent(
  elements: CanvasElement[],
  options: GeneratorOptions = {}
): string {
  const {
    componentName = 'GeneratedComponent',
    includeScript = true,
    useCssClasses = false,
  } = options;

  const visibleElements = elements.filter((el) => el.visible);
  const parts: string[] = [];

  // Script block
  if (includeScript) {
    parts.push(`<script lang="ts">`);
    parts.push(`  /** Generated from Bismuth Canvas: ${componentName} */`);
    parts.push(`  export let width: number = ${calculateBoundsWidth(visibleElements)};`);
    parts.push(`  export let height: number = ${calculateBoundsHeight(visibleElements)};`);
    parts.push(`</script>`);
    parts.push('');
  }

  // Markup block
  const bounds = calculateBounds(visibleElements);
  parts.push(`<div class="canvas-component" style="position: relative; width: {width}px; height: {height}px;">`);

  for (const element of visibleElements) {
    const relX = element.x - bounds.minX;
    const relY = element.y - bounds.minY;
    parts.push(elementToSvelteMarkup(element, relX, relY, useCssClasses));
  }

  parts.push(`</div>`);
  parts.push('');

  // Style block
  if (useCssClasses) {
    parts.push(`<style>`);
    parts.push(`  .canvas-component {`);
    parts.push(`    overflow: hidden;`);
    parts.push(`  }`);
    for (const element of visibleElements) {
      parts.push(elementToCssClass(element));
    }
    parts.push(`</style>`);
  } else {
    parts.push(`<style>`);
    parts.push(`  .canvas-component {`);
    parts.push(`    overflow: hidden;`);
    parts.push(`  }`);
    parts.push(`</style>`);
  }

  return parts.join('\n');
}

function elementToSvelteMarkup(
  element: CanvasElement,
  x: number,
  y: number,
  useCssClasses: boolean
): string {
  const baseStyle = `position: absolute; left: ${x}px; top: ${y}px; width: ${element.width}px; height: ${element.height}px;`;
  const rotationStyle = element.rotation ? ` transform: rotate(${element.rotation}deg);` : '';
  const opacityStyle = (element.properties.opacity ?? 1) < 1 ? ` opacity: ${element.properties.opacity};` : '';

  switch (element.element_type) {
    case 'rectangle': {
      const fill = element.properties.fill || '#3b82f6';
      const stroke = element.properties.stroke || 'none';
      const strokeWidth = element.properties.strokeWidth || 0;
      const borderRadius = element.properties.borderRadius
        ? `border-radius: ${element.properties.borderRadius}px;`
        : '';
      const style = useCssClasses
        ? `class="el-${element.id}"`
        : `style="${baseStyle} background: ${fill}; border: ${strokeWidth}px solid ${stroke}; ${borderRadius}${rotationStyle}${opacityStyle}"`;
      return `  <div ${style}></div>`;
    }

    case 'circle': {
      const fill = element.properties.fill || '#10b981';
      const stroke = element.properties.stroke || 'none';
      const strokeWidth = element.properties.strokeWidth || 0;
      const style = useCssClasses
        ? `class="el-${element.id}"`
        : `style="${baseStyle} background: ${fill}; border: ${strokeWidth}px solid ${stroke}; border-radius: 50%;${rotationStyle}${opacityStyle}"`;
      return `  <div ${style}></div>`;
    }

    case 'text': {
      const text = element.properties.text || '';
      const fontSize = element.properties.fontSize || 16;
      const fontFamily = element.properties.fontFamily || 'Inter, sans-serif';
      const color = element.properties.fill || '#000000';
      const fontWeight = element.properties.fontWeight || 400;
      const textAlign = element.properties.textAlign || 'left';
      const style = useCssClasses
        ? `class="el-${element.id}"`
        : `style="${baseStyle} font-size: ${fontSize}px; font-family: ${fontFamily}; color: ${color}; font-weight: ${fontWeight}; text-align: ${textAlign};${rotationStyle}${opacityStyle}"`;
      return `  <p ${style}>${escapeHtml(text)}</p>`;
    }

    case 'frame': {
      const fill = element.properties.fill || 'transparent';
      const padding = element.properties.padding || 0;
      const style = useCssClasses
        ? `class="el-${element.id}"`
        : `style="${baseStyle} background: ${fill}; padding: ${padding}px; overflow: hidden;${rotationStyle}${opacityStyle}"`;
      return `  <div ${style}></div>`;
    }

    case 'image': {
      const src = element.properties.src || '';
      const style = useCssClasses
        ? `class="el-${element.id}"`
        : `style="${baseStyle} object-fit: cover;${rotationStyle}${opacityStyle}"`;
      return `  <img ${style} src="${escapeHtml(src)}" alt="" />`;
    }

    default: {
      const style = `style="${baseStyle}${rotationStyle}${opacityStyle}"`;
      return `  <div ${style} data-type="${element.element_type}"></div>`;
    }
  }
}

function elementToCssClass(element: CanvasElement): string {
  const lines: string[] = [];
  lines.push(`  .el-${element.id} {`);

  switch (element.element_type) {
    case 'rectangle':
      lines.push(`    background: ${element.properties.fill || '#3b82f6'};`);
      if (element.properties.stroke) lines.push(`    border: ${element.properties.strokeWidth || 1}px solid ${element.properties.stroke};`);
      break;
    case 'circle':
      lines.push(`    background: ${element.properties.fill || '#10b981'};`);
      lines.push(`    border-radius: 50%;`);
      break;
    case 'text':
      lines.push(`    font-size: ${element.properties.fontSize || 16}px;`);
      lines.push(`    color: ${element.properties.fill || '#000'};`);
      break;
  }

  lines.push(`  }`);
  return lines.join('\n');
}

function calculateBounds(elements: CanvasElement[]) {
  if (elements.length === 0) return { minX: 0, minY: 0, maxX: 100, maxY: 100 };

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const el of elements) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  }
  return { minX, minY, maxX, maxY };
}

function calculateBoundsWidth(elements: CanvasElement[]): number {
  const b = calculateBounds(elements);
  return b.maxX - b.minX;
}

function calculateBoundsHeight(elements: CanvasElement[]): number {
  const b = calculateBounds(elements);
  return b.maxY - b.minY;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
