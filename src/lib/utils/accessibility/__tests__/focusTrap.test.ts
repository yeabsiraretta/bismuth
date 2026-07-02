import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFocusTrap } from '../focusTrap';

// Mock the focus-trap library so tests run without a real DOM focus engine
const mockTrapActivate = vi.fn();
const mockTrapDeactivate = vi.fn();

vi.mock('focus-trap', () => ({
  createFocusTrap: vi.fn(() => ({
    activate: mockTrapActivate,
    deactivate: mockTrapDeactivate,
  })),
}));

function makeContainer(): HTMLElement {
  const div = document.createElement('div');
  const btn = document.createElement('button');
  btn.textContent = 'Button';
  div.appendChild(btn);
  document.body.appendChild(div);
  return div;
}

beforeEach(() => {
  mockTrapActivate.mockReset();
  mockTrapDeactivate.mockReset();
  document.body.innerHTML = '';
});

describe('createFocusTrap', () => {
  it('returns an object with activate and deactivate methods', () => {
    const container = makeContainer();
    const trap = createFocusTrap(container);
    expect(typeof trap.activate).toBe('function');
    expect(typeof trap.deactivate).toBe('function');
  });

  it('activate calls the underlying focus-trap activate', () => {
    const container = makeContainer();
    const trap = createFocusTrap(container);
    trap.activate();
    expect(mockTrapActivate).toHaveBeenCalledTimes(1);
  });

  it('deactivate calls the underlying focus-trap deactivate', () => {
    const container = makeContainer();
    const trap = createFocusTrap(container);
    trap.activate();
    trap.deactivate();
    expect(mockTrapDeactivate).toHaveBeenCalledTimes(1);
  });

  it('deactivate is safe to call before activate', () => {
    const container = makeContainer();
    const trap = createFocusTrap(container);
    expect(() => trap.deactivate()).not.toThrow();
    expect(mockTrapDeactivate).not.toHaveBeenCalled();
  });

  it('passes initialFocus option when provided', async () => {
    const { createFocusTrap: libMock } = await import('focus-trap');
    vi.mocked(libMock).mockClear();
    const container = makeContainer();
    const button = container.querySelector('button') as HTMLElement;
    const trap = createFocusTrap(container, { initialFocus: button });
    trap.activate();
    expect(vi.mocked(libMock)).toHaveBeenCalledWith(
      container,
      expect.objectContaining({ initialFocus: button })
    );
  });

  it('passes returnFocusOnDeactivate: true by default', async () => {
    const { createFocusTrap: libMock } = await import('focus-trap');
    vi.mocked(libMock).mockClear();
    const container = makeContainer();
    const trap = createFocusTrap(container);
    trap.activate();
    expect(vi.mocked(libMock)).toHaveBeenCalledWith(
      container,
      expect.objectContaining({ returnFocusOnDeactivate: true })
    );
  });

  it('passes returnFocusOnDeactivate: false when returnFocus is false', async () => {
    const { createFocusTrap: libMock } = await import('focus-trap');
    vi.mocked(libMock).mockClear();
    const container = makeContainer();
    const trap = createFocusTrap(container, { returnFocus: false });
    trap.activate();
    expect(vi.mocked(libMock)).toHaveBeenCalledWith(
      container,
      expect.objectContaining({ returnFocusOnDeactivate: false })
    );
  });

  it('sets escapeDeactivates: false when no onEscape callback', async () => {
    const { createFocusTrap: libMock } = await import('focus-trap');
    vi.mocked(libMock).mockClear();
    const container = makeContainer();
    const trap = createFocusTrap(container);
    trap.activate();
    expect(vi.mocked(libMock)).toHaveBeenCalledWith(
      container,
      expect.objectContaining({ escapeDeactivates: false })
    );
  });

  it('sets escapeDeactivates: true when onEscape callback is provided', async () => {
    const { createFocusTrap: libMock } = await import('focus-trap');
    vi.mocked(libMock).mockClear();
    const container = makeContainer();
    const onEscape = vi.fn();
    const trap = createFocusTrap(container, { onEscape });
    trap.activate();
    expect(vi.mocked(libMock)).toHaveBeenCalledWith(
      container,
      expect.objectContaining({ escapeDeactivates: true })
    );
  });

  it('invokes onEscape when Escape key is pressed after activation', () => {
    const container = makeContainer();
    const onEscape = vi.fn();
    const trap = createFocusTrap(container, { onEscape });
    trap.activate();
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    container.dispatchEvent(event);
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('does not invoke onEscape for non-Escape keys', () => {
    const container = makeContainer();
    const onEscape = vi.fn();
    const trap = createFocusTrap(container, { onEscape });
    trap.activate();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    container.dispatchEvent(event);
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('removes keydown listener on deactivate so onEscape no longer fires', () => {
    const container = makeContainer();
    const onEscape = vi.fn();
    const trap = createFocusTrap(container, { onEscape });
    trap.activate();
    trap.deactivate();
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    container.dispatchEvent(event);
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('does not add keydown listener when no onEscape is provided', () => {
    const container = makeContainer();
    const spy = vi.spyOn(container, 'addEventListener');
    const trap = createFocusTrap(container);
    trap.activate();
    const keydownCalls = spy.mock.calls.filter(([event]) => event === 'keydown');
    expect(keydownCalls).toHaveLength(0);
  });

  it('calling activate twice creates a fresh trap each time', () => {
    const container = makeContainer();
    const trap = createFocusTrap(container);
    trap.activate();
    trap.deactivate();
    trap.activate();
    expect(mockTrapActivate).toHaveBeenCalledTimes(2);
  });
});
