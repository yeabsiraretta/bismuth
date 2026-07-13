export interface FocusTrapOptions {
  initialFocus?: HTMLElement | null;
  returnFocus?: boolean;
  onEscape?: () => void;
}

export interface FocusTrapInstance {
  activate: () => void;
  deactivate: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function createFocusTrap(
  container: HTMLElement,
  options: FocusTrapOptions = {}
): FocusTrapInstance {
  const { initialFocus, returnFocus = true, onEscape } = options;
  let previousFocus: Element | null = null;

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && onEscape) {
      e.preventDefault();
      onEscape();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function activate() {
    previousFocus = document.activeElement;
    container.addEventListener('keydown', handleKeydown);

    if (initialFocus) {
      initialFocus.focus();
    } else {
      const first = container.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    }
  }

  function deactivate() {
    container.removeEventListener('keydown', handleKeydown);
    if (returnFocus && previousFocus instanceof HTMLElement) {
      previousFocus.focus();
    }
  }

  return { activate, deactivate };
}
