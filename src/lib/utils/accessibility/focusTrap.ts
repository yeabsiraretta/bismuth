/**
 * Focus Trap Utility
 *
 * Traps keyboard focus within a container element.
 * Used for modals, dialogs, and other overlays to prevent
 * focus from escaping to background content.
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]',
].join(', ');

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
  let previouslyFocused: HTMLElement | null = null;

  function getFocusableElements(): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      el => el.offsetParent !== null
    );
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && onEscape) {
      e.preventDefault();
      onEscape();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function activate() {
    previouslyFocused = document.activeElement as HTMLElement;
    container.addEventListener('keydown', handleKeydown);

    // Focus initial element or first focusable
    requestAnimationFrame(() => {
      if (initialFocus) {
        initialFocus.focus();
      } else {
        const focusable = getFocusableElements();
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    });
  }

  function deactivate() {
    container.removeEventListener('keydown', handleKeydown);

    if (returnFocus && previouslyFocused && previouslyFocused.focus) {
      previouslyFocused.focus();
    }
    previouslyFocused = null;
  }

  return { activate, deactivate };
}
