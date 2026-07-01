import { writable, derived } from 'svelte/store';

export interface SharedStyle {
  id: string;
  name: string;
  type: 'fill' | 'stroke' | 'text' | 'effect';
  properties: Record<string, unknown>;
  linkedElements: string[];
  createdAt: string;
  updatedAt: string;
}

export const sharedStyles = writable<SharedStyle[]>([]);
export const selectedStyleId = writable<string | null>(null);

export const selectedStyle = derived(
  [sharedStyles, selectedStyleId],
  ([$styles, $id]) => $styles.find((s) => s.id === $id) ?? null
);

export const stylesByType = derived(sharedStyles, ($styles) => {
  const grouped: Record<string, SharedStyle[]> = { fill: [], stroke: [], text: [], effect: [] };
  for (const style of $styles) {
    grouped[style.type]?.push(style);
  }
  return grouped;
});

let propagationTimer: ReturnType<typeof setTimeout> | null = null;

/** Create a shared style from properties. */
export function createStyle(
  name: string,
  type: SharedStyle['type'],
  properties: Record<string, unknown>
): SharedStyle {
  const style: SharedStyle = {
    id: crypto.randomUUID(),
    name,
    type,
    properties,
    linkedElements: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  sharedStyles.update((list) => [...list, style]);
  return style;
}

/** Apply a shared style to an element (link it). */
export function applyStyle(elementId: string, styleId: string): void {
  sharedStyles.update((list) =>
    list.map((s) =>
      s.id === styleId
        ? { ...s, linkedElements: [...new Set([...s.linkedElements, elementId])] }
        : s
    )
  );
}

/** Update style properties and propagate to linked elements with 16ms debounce. */
export function updateStyle(styleId: string, properties: Record<string, unknown>): void {
  sharedStyles.update((list) =>
    list.map((s) =>
      s.id === styleId
        ? {
            ...s,
            properties: { ...s.properties, ...properties },
            updatedAt: new Date().toISOString(),
          }
        : s
    )
  );
  // Debounced propagation
  if (propagationTimer) clearTimeout(propagationTimer);
  propagationTimer = setTimeout(() => {
    propagateStyleUpdate(styleId);
  }, 16);
}

/** Get all elements linked to a style. */
export function getLinkedElements(styleId: string): string[] {
  let elements: string[] = [];
  sharedStyles.subscribe((list) => {
    const style = list.find((s) => s.id === styleId);
    elements = style?.linkedElements ?? [];
  })();
  return elements;
}

/** Detach an element from a style (keep current values). */
export function detachStyle(elementId: string, styleId: string): void {
  sharedStyles.update((list) =>
    list.map((s) =>
      s.id === styleId
        ? { ...s, linkedElements: s.linkedElements.filter((id) => id !== elementId) }
        : s
    )
  );
}

/** Delete a style entirely. */
export function deleteStyle(styleId: string): void {
  sharedStyles.update((list) => list.filter((s) => s.id !== styleId));
}

/** Internal: propagate style updates to linked elements via requestAnimationFrame. */
function propagateStyleUpdate(_styleId: string): void {
  requestAnimationFrame(() => {
    // Propagation happens through reactive bindings in the rendering layer
    // The store update triggers re-renders for components watching linked styles
  });
}
