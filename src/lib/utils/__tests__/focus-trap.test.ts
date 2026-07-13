import { describe, expect, it, vi } from 'vitest';

import { createFocusTrap } from '@/utils/focus-trap';

function makeContainer(...buttonLabels: string[]): HTMLDivElement {
  const div = document.createElement('div');
  for (const label of buttonLabels) {
    const btn = document.createElement('button');
    btn.textContent = label;
    div.appendChild(btn);
  }
  document.body.appendChild(div);
  return div;
}

describe('focus-trap', () => {
  it('activates and focuses first focusable element', () => {
    const container = makeContainer('A', 'B');
    const trap = createFocusTrap(container);
    trap.activate();
    expect(document.activeElement).toBe(container.querySelector('button'));
    trap.deactivate();
    container.remove();
  });

  it('uses initialFocus when provided', () => {
    const container = makeContainer('A', 'B');
    const second = container.querySelectorAll('button')[1];
    const trap = createFocusTrap(container, { initialFocus: second });
    trap.activate();
    expect(document.activeElement).toBe(second);
    trap.deactivate();
    container.remove();
  });

  it('calls onEscape when Escape is pressed', () => {
    const container = makeContainer('A');
    const onEscape = vi.fn();
    const trap = createFocusTrap(container, { onEscape });
    trap.activate();
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(onEscape).toHaveBeenCalledOnce();
    trap.deactivate();
    container.remove();
  });

  it('returns focus on deactivate when returnFocus is true', () => {
    const outer = document.createElement('button');
    outer.textContent = 'outer';
    document.body.appendChild(outer);
    outer.focus();

    const container = makeContainer('A');
    const trap = createFocusTrap(container, { returnFocus: true });
    trap.activate();
    expect(document.activeElement).not.toBe(outer);
    trap.deactivate();
    expect(document.activeElement).toBe(outer);
    container.remove();
    outer.remove();
  });

  it('is safe to deactivate without prior activate', () => {
    const container = makeContainer('A');
    const trap = createFocusTrap(container);
    expect(() => trap.deactivate()).not.toThrow();
    container.remove();
  });
});
