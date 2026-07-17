interface TextPromptOptions {
  title: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

function nativePromptAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.prompt === 'function';
}

function openFallbackPrompt(options: TextPromptOptions): Promise<string | null> {
  if (typeof document === 'undefined') return Promise.resolve(null);

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55);z-index:10000;padding:16px;';

    const panel = document.createElement('div');
    panel.style.cssText =
      'width:min(420px,100%);background:#111827;color:#f9fafb;border:1px solid #374151;border-radius:10px;padding:16px;box-shadow:0 20px 40px rgba(0,0,0,.45);';

    const title = document.createElement('h2');
    title.textContent = options.title;
    title.style.cssText = 'margin:0 0 12px 0;font-size:16px;line-height:1.4;';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = options.defaultValue ?? '';
    input.placeholder = options.placeholder ?? '';
    input.style.cssText =
      'width:100%;padding:10px 12px;border-radius:8px;border:1px solid #4b5563;background:#0f172a;color:#f9fafb;outline:none;';

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;margin-top:12px;';

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = options.cancelLabel ?? 'Cancel';
    cancel.style.cssText =
      'padding:8px 12px;border:1px solid #4b5563;background:#1f2937;color:#f9fafb;border-radius:8px;cursor:pointer;';

    const submit = document.createElement('button');
    submit.type = 'button';
    submit.textContent = options.confirmLabel ?? 'OK';
    submit.style.cssText =
      'padding:8px 12px;border:1px solid #2563eb;background:#2563eb;color:#fff;border-radius:8px;cursor:pointer;';

    const cleanup = (result: string | null) => {
      overlay.remove();
      resolve(result);
    };

    cancel.addEventListener('click', () => cleanup(null));
    submit.addEventListener('click', () => cleanup(input.value));
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) cleanup(null);
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        cleanup(input.value);
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        cleanup(null);
      }
    });

    actions.append(cancel, submit);
    panel.append(title, input, actions);
    overlay.append(panel);
    document.body.append(overlay);
    input.focus();
    input.select();
  });
}

export async function requestTextPrompt(options: TextPromptOptions): Promise<string | null> {
  if (!nativePromptAvailable()) {
    return openFallbackPrompt(options);
  }

  try {
    return window.prompt(options.title, options.defaultValue ?? '');
  } catch {
    return openFallbackPrompt(options);
  }
}
