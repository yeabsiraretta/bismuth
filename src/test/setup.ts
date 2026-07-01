/**
 * Vitest global setup — provides browser API stubs missing from jsdom.
 *
 * Any mock needed by 3+ test files belongs here.
 * Test-specific mocks stay in their own files.
 */
import { vi } from 'vitest';

// ── window.matchMedia ──────────────────────────────────────────────────────
// jsdom does not implement matchMedia; stub it so theme, responsive, and
// media-query tests don't crash.
if (typeof globalThis.matchMedia === 'undefined') {
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// ── crypto.randomUUID ──────────────────────────────────────────────────────
// jsdom exposes crypto but not randomUUID in all versions.
if (typeof globalThis.crypto?.randomUUID !== 'function') {
  let counter = 0;
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    writable: true,
    value: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`,
  });
}

// ── IntersectionObserver ───────────────────────────────────────────────────
// Many Svelte components use IntersectionObserver for lazy loading.
if (typeof globalThis.IntersectionObserver === 'undefined') {
  class MockIntersectionObserver {
    readonly root = null;
    readonly rootMargin = '0px';
    readonly thresholds = [0];
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn().mockReturnValue([]);
  }
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    value: MockIntersectionObserver,
  });
}

// ── ResizeObserver ─────────────────────────────────────────────────────────
if (typeof globalThis.ResizeObserver === 'undefined') {
  class MockResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  Object.defineProperty(globalThis, 'ResizeObserver', {
    writable: true,
    value: MockResizeObserver,
  });
}

// ── HTMLElement.scrollIntoView ──────────────────────────────────────────────
// jsdom stubs this as undefined; many component tests call it.
if (typeof HTMLElement.prototype.scrollIntoView !== 'function') {
  HTMLElement.prototype.scrollIntoView = vi.fn();
}

// ── URL.createObjectURL / revokeObjectURL ──────────────────────────────────
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = vi.fn(() => 'blob:mock');
  URL.revokeObjectURL = vi.fn();
}
