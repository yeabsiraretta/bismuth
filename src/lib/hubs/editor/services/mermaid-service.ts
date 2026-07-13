// ── Mermaid rendering service ─────────────────────────────────────
// Lazy-loads mermaid library on first use. If mermaid is not installed,
// renders a styled fallback message instead of crashing.

let mermaidApi: MermaidAPI | null = null;
let loadPromise: Promise<MermaidAPI | null> | null = null;
let idCounter = 0;

interface MermaidAPI {
  initialize: (config: Record<string, unknown>) => void;
  render: (id: string, definition: string) => Promise<{ svg: string }>;
}

export function isMermaidBlock(lang: string): boolean {
  return lang.trim().toLowerCase() === 'mermaid';
}

export function nextMermaidId(): string {
  return `mermaid-${Date.now()}-${++idCounter}`;
}

async function loadMermaid(): Promise<MermaidAPI | null> {
  try {
    const mod = await import('mermaid');
    const api = (mod.default ?? mod) as unknown as MermaidAPI;
    return api;
  } catch {
    return null;
  }
}

function initMermaid(darkMode = false): Promise<MermaidAPI | null> {
  if (mermaidApi) return Promise.resolve(mermaidApi);
  if (loadPromise) return loadPromise;

  loadPromise = loadMermaid().then((api) => {
    if (api) {
      api.initialize({
        startOnLoad: false,
        theme: darkMode ? 'dark' : 'default',
        securityLevel: 'strict',
        fontFamily: 'inherit',
      });
      mermaidApi = api;
    }
    return api;
  });
  return loadPromise;
}

async function renderMermaid(code: string, id?: string): Promise<string> {
  const api = await initMermaid();
  if (!api) {
    return renderFallback(code, 'Mermaid library not available. Install with: pnpm add mermaid');
  }
  const renderId = id ?? nextMermaidId();
  try {
    const { svg } = await api.render(renderId, code);
    return svg;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown mermaid error';
    return renderFallback(code, msg);
  }
}

function renderFallback(code: string, error: string): string {
  const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<div class="mermaid-error"><div class="mermaid-error-msg">${error}</div><pre class="mermaid-error-code"><code>${escaped}</code></pre></div>`;
}

function updateMermaidTheme(darkMode: boolean): void {
  if (mermaidApi) {
    mermaidApi.initialize({
      startOnLoad: false,
      theme: darkMode ? 'dark' : 'default',
      securityLevel: 'strict',
      fontFamily: 'inherit',
    });
  }
  loadPromise = null;
  mermaidApi = null;
}

export async function postProcessMermaid(container: HTMLElement): Promise<void> {
  const placeholders = container.querySelectorAll<HTMLElement>('[data-mermaid-code]');
  if (placeholders.length === 0) return;

  for (const el of placeholders) {
    const code = el.getAttribute('data-mermaid-code');
    if (!code) continue;
    const svg = await renderMermaid(code);
    el.innerHTML = svg;
    el.classList.remove('mermaid-placeholder');
    el.classList.add('mermaid-rendered');
  }
}
