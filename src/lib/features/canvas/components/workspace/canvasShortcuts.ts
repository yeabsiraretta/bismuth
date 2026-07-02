interface CanvasShortcutHandlers {
  undo: () => void;
  redo: () => void;
  copy: () => void;
  paste: () => void;
  duplicate: () => void;
  group: () => void;
  ungroup: () => void;
  save: () => void;
  createComponent: () => void;
  togglePreview: () => void;
  toggleOverview: () => void;
}

export function handleCanvasShortcut(e: KeyboardEvent, handlers: CanvasShortcutHandlers) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

  if (!cmdOrCtrl) return;

  const shortcutActions: Record<string, () => void> = {
    c: handlers.copy,
    v: handlers.paste,
    d: handlers.duplicate,
    s: handlers.save,
  };

  const key = e.key.toLowerCase();

  if (key === 'z') {
    e.preventDefault();
    if (e.shiftKey) {
      handlers.redo();
    } else {
      handlers.undo();
    }
    return;
  }

  if (key === 'g') {
    e.preventDefault();
    if (e.shiftKey) {
      handlers.ungroup();
    } else {
      handlers.group();
    }
    return;
  }

  if (key === 'k' && e.shiftKey) {
    e.preventDefault();
    handlers.createComponent();
    return;
  }

  if (key === 'enter') {
    e.preventDefault();
    handlers.togglePreview();
    return;
  }

  if (key === '0') {
    e.preventDefault();
    handlers.toggleOverview();
    return;
  }

  const action = shortcutActions[key];
  if (!action) return;

  e.preventDefault();
  action();
}
