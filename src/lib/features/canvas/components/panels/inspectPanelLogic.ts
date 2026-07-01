/**
 * InspectPanel logic — CSS property generation from canvas elements.
 * Extracted from InspectPanel.svelte for 300-line compliance.
 */

import type { CanvasElement } from '@/features/canvas/types';

export interface CSSProperty {
  property: string;
  value: string;
}

/** Generates a list of CSS properties from a canvas element's visual state. */
export function generateCSS(el: CanvasElement): CSSProperty[] {
  const props: CSSProperty[] = [];

  // Position & Size
  props.push({ property: 'width', value: `${Math.round(el.width)}px` });
  props.push({ property: 'height', value: `${Math.round(el.height)}px` });

  if (el.rotation !== 0) {
    props.push({ property: 'transform', value: `rotate(${el.rotation}deg)` });
  }

  // Auto layout (flex)
  if (el.properties.autoLayout) {
    const al = el.properties.autoLayout;
    props.push({ property: 'display', value: 'flex' });
    props.push({
      property: 'flex-direction',
      value: al.direction === 'horizontal' ? 'row' : 'column',
    });
    props.push({ property: 'gap', value: `${al.gap}px` });
    props.push({
      property: 'padding',
      value: `${al.padding.top}px ${al.padding.right}px ${al.padding.bottom}px ${al.padding.left}px`,
    });
    props.push({
      property: 'align-items',
      value: al.alignItems === 'start' ? 'flex-start' : al.alignItems === 'end' ? 'flex-end' : al.alignItems,
    });
    props.push({
      property: 'justify-content',
      value: al.justifyContent === 'start' ? 'flex-start' : al.justifyContent === 'end' ? 'flex-end' : al.justifyContent,
    });
  }

  // Background
  if (el.properties.fill) {
    props.push({ property: 'background', value: el.properties.fill });
  }

  // Border
  if (el.properties.stroke && el.properties.strokeWidth) {
    props.push({
      property: 'border',
      value: `${el.properties.strokeWidth}px solid ${el.properties.stroke}`,
    });
  }

  // Border radius
  if (el.properties.borderRadius) {
    const br = el.properties.borderRadius;
    if (br.topLeft === br.topRight && br.topRight === br.bottomRight && br.bottomRight === br.bottomLeft) {
      props.push({ property: 'border-radius', value: `${br.topLeft}px` });
    } else {
      props.push({
        property: 'border-radius',
        value: `${br.topLeft}px ${br.topRight}px ${br.bottomRight}px ${br.bottomLeft}px`,
      });
    }
  } else if (el.properties.radius) {
    props.push({ property: 'border-radius', value: `${el.properties.radius}px` });
  }

  // Opacity
  if (el.properties.opacity !== undefined && el.properties.opacity < 1) {
    props.push({ property: 'opacity', value: `${el.properties.opacity}` });
  }

  // Shadow
  if (el.properties.shadow) {
    const s = el.properties.shadow;
    props.push({
      property: 'box-shadow',
      value: `${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`,
    });
  }

  // Blur
  if (el.properties.blur) {
    props.push({ property: 'filter', value: `blur(${el.properties.blur}px)` });
  }

  // Typography (text elements)
  if (el.element_type === 'text') {
    if (el.properties.fontFamily) {
      props.push({ property: 'font-family', value: el.properties.fontFamily });
    }
    if (el.properties.fontSize) {
      props.push({ property: 'font-size', value: `${el.properties.fontSize}px` });
    }
    if (el.properties.fontWeight) {
      props.push({ property: 'font-weight', value: `${el.properties.fontWeight}` });
    }
    if (el.properties.lineHeight) {
      props.push({ property: 'line-height', value: `${el.properties.lineHeight}` });
    }
    if (el.properties.textAlign) {
      props.push({ property: 'text-align', value: el.properties.textAlign });
    }
    if (el.properties.fill) {
      props.push({ property: 'color', value: el.properties.fill });
    }
  }

  return props;
}

/** Generates a CSS code block string from a canvas element. */
export function generateCSSCode(el: CanvasElement): string {
  const props = generateCSS(el);
  const lines = props.map((p) => `  ${p.property}: ${p.value};`);
  const selector = el.name
    ? `.${el.name.replace(/\s+/g, '-').toLowerCase()}`
    : `.${el.element_type}`;
  return `${selector} {\n${lines.join('\n')}\n}`;
}

/** Resolves the single selected element from selection state. */
export function getSelectedElement(
  ids: string[],
  elements: CanvasElement[]
): CanvasElement | null {
  if (ids.length !== 1) return null;
  return elements.find((el) => el.id === ids[0]) ?? null;
}
