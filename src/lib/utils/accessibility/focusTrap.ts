/**
 * Focus Trap Utility
 *
 * Traps keyboard focus within a container element.
 * Used for modals, dialogs, and other overlays to prevent
 * focus from escaping to background content.
 *
 * Delegates to the `focus-trap` library for robust handling of
 * edge cases (iframes, shadow DOM, dynamic content mutations).
 */

import { createFocusTrap as createFocusTrapLib, type FocusTrap } from 'focus-trap';

export interface FocusTrapOptions {
  /** Element to receive initial focus (defaults to first focusable) */
  initialFocus?: HTMLElement | null;
  /** Whether to return focus to the previously focused element on deactivate */
  returnFocus?: boolean;
  /** Called when Escape is pressed */
  onEscape?: () => void;
}

export interface FocusTrapInstance {
  activate: () => void;
  deactivate: () => void;
}

/**
 * Create a focus trap for the given container.
 *
 * @example
 * const trap = createFocusTrap(modalElement, { onEscape: close, returnFocus: true });
 * trap.activate();
 * // later...
 * trap.deactivate();
 */
export function createFocusTrap(
  container: HTMLElement,
  options: FocusTrapOptions = {}
): FocusTrapInstance {
  const { initialFocus, returnFocus = true, onEscape } = options;

  let trap: FocusTrap | null = null;

  function activate() {
    trap = createFocusTrapLib(container, {
      initialFocus: initialFocus || undefined,
      returnFocusOnDeactivate: returnFocus,
      escapeDeactivates: !!onEscape,
      allowOutsideClick: true,
    });

    if (onEscape) {
      container.addEventListener('keydown', handleEscape);
    }

    trap.activate();
  }

  function handleEscape(e: KeyboardEvent) {
    if (e.key === 'Escape' && onEscape) {
      e.preventDefault();
      onEscape();
    }
  }

  function deactivate() {
    if (onEscape) {
      container.removeEventListener('keydown', handleEscape);
    }
    if (trap) {
      trap.deactivate();
      trap = null;
    }
  }

  return { activate, deactivate };
}
