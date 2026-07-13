import { invokeCommand } from '@/ipc/invoke';
import { log } from '@/utils/log/logger';
import { isTauriAvailable } from '@/utils/platform';

const themeLog = log.child('custom-theme');
const STYLE_ID = 'bismuth-custom-theme';
const THEME_DIR = '.bismuth/themes';

export async function discoverThemes(): Promise<string[]> {
  if (!isTauriAvailable()) return [];
  try {
    const files = await invokeCommand<string[]>('list_snippet_files', { dir: THEME_DIR });
    return files.filter((f) => f.endsWith('.css')).sort();
  } catch {
    themeLog.debug('Theme discovery failed (expected if no themes dir)');
    return [];
  }
}

export async function applyCustomTheme(path: string): Promise<void> {
  if (typeof document === 'undefined') return;

  if (!path) {
    removeCustomTheme();
    return;
  }

  try {
    const css = isTauriAvailable()
      ? await invokeCommand<string>('read_snippet_file', { path })
      : '';

    if (!css) {
      themeLog.debug('No custom theme content', { path });
      removeCustomTheme();
      return;
    }

    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (el) {
      el.textContent = css;
    } else {
      el = document.createElement('style');
      el.id = STYLE_ID;
      el.setAttribute('data-custom-theme', path);
      el.textContent = css;
      document.head.appendChild(el);
    }
    themeLog.info('Applied custom theme', { path });
  } catch (e) {
    themeLog.error('Failed to load custom theme', { path, error: String(e) });
    removeCustomTheme();
  }
}

export function removeCustomTheme(): void {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(STYLE_ID);
  if (el) {
    el.remove();
    themeLog.debug('Removed custom theme');
  }
}
