/**
 * T25 — Component tests for NasConfigPanel.svelte.
 *
 * Tests are written using Svelte 5 `mount`/`unmount` with jsdom.
 * The nasStore module is mocked so no IPC calls occur.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, unmount } from 'svelte';
import { writable, get as _get } from 'svelte/store';

// ---------------------------------------------------------------------------
// Mock stores — created at module scope so they are available in the factory
// ---------------------------------------------------------------------------

// Stores must be created at module top-level so they can be shared between
// the vi.mock factory and the test assertions. vi.mock is hoisted, but the
// factory captures these via closure at the point it executes (after imports).
const _nasConfigStore = writable<{
  url: string;
  username: string;
  lastSync: string | null;
  offlineModeEnabled: boolean;
} | null>(null);
void _nasConfigStore;

const _syncStatusStore = writable<string>('disabled');
void _syncStatusStore;
const _lastSyncAtStore = writable<string | null>(null);
void _lastSyncAtStore;

const _mockConnectNas = vi.fn();
void _mockConnectNas;
const _mockDisconnectNas = vi.fn();
void _mockDisconnectNas;
const _mockSyncNow = vi.fn();
void _mockSyncNow;
const _mockUpdateConfig = vi.fn();
void _mockUpdateConfig;

// vi.mock is hoisted but the factory function closes over the module-scope variables.
// This works in Vitest because the factory is a function reference, not executed
// at hoist time — it's called when the module is first imported.
vi.mock('../stores/nasStore', async () => {
  const { writable: w } = await import('svelte/store');

  // Create fresh stores inside the factory (executed once per test module)
  const _nasConfig = w<{
    url: string;
    username: string;
    lastSync: string | null;
    offlineModeEnabled: boolean;
  } | null>(null);
  const _syncStatus = w<string>('disabled');
  const _lastSyncAt = w<string | null>(null);

  // Expose the stores on the mock module object so tests can update them.
  // We mutate the outer store references to point at the same underlying stores.
  _nasConfig.subscribe(() => undefined);

  return {
    nasConfig: _nasConfig,
    syncStatus: _syncStatus,
    lastSyncAt: _lastSyncAt,
    connectNas: vi.fn(),
    disconnectNas: vi.fn(),
    syncNow: vi.fn(),
    updateConfig: vi.fn(),
  };
});

vi.mock('@/utils/logger', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import NasConfigPanel from '../components/NasConfigPanel.svelte';
import * as nasStore from '../stores/nasStore';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

type MountedComponent = ReturnType<typeof mount>;
let mounted: MountedComponent | null = null;
let container: HTMLElement;

function mountPanel(props: { vaultPath?: string; nasEnabled?: boolean } = {}): HTMLElement {
  container = document.createElement('div');
  document.body.appendChild(container);
  mounted = mount(NasConfigPanel, {
    target: container,
    props: {
      vaultPath: props.vaultPath ?? '/vault',
      nasEnabled: props.nasEnabled ?? true,
    },
  });
  return container;
}

function setNasConfig(
  value: {
    url: string;
    username: string;
    lastSync: string | null;
    offlineModeEnabled: boolean;
  } | null
): void {
  (nasStore.nasConfig as ReturnType<typeof writable>).set(value);
}

function setSyncStatus(value: string): void {
  (nasStore.syncStatus as ReturnType<typeof writable>).set(value);
}

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  if (container?.parentNode) {
    container.parentNode.removeChild(container);
  }
  setNasConfig(null);
  setSyncStatus('disabled');
  (nasStore.lastSyncAt as ReturnType<typeof writable>).set(null);
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// T25 — NasConfigPanel tests
// ---------------------------------------------------------------------------

describe('NasConfigPanel — disabled notice', () => {
  it('renders "NAS access is disabled" message when nasEnabled is false', () => {
    mountPanel({ nasEnabled: false });
    expect(container.textContent).toContain('NAS access is disabled');
  });

  it('does not render the config form when nasEnabled is false', () => {
    mountPanel({ nasEnabled: false });
    expect(container.querySelector('#nas-url')).toBeNull();
    expect(container.querySelector('#nas-password')).toBeNull();
  });

  it('renders the form when nasEnabled is true', () => {
    mountPanel({ nasEnabled: true });
    expect(container.querySelector('#nas-url')).not.toBeNull();
  });
});

describe('NasConfigPanel — connect button disabled state', () => {
  beforeEach(() => {
    setNasConfig(null);
  });

  it('Connect button is disabled when URL is empty', () => {
    mountPanel({ nasEnabled: true });
    const btn = container.querySelector<HTMLButtonElement>('button.btn--primary');
    expect(btn).not.toBeNull();
    expect(btn!.disabled).toBe(true);
  });

  it('Connect button is disabled when URL does not start with http:// or https://', async () => {
    mountPanel({ nasEnabled: true });

    const urlInput = container.querySelector<HTMLInputElement>('#nas-url');
    expect(urlInput).not.toBeNull();

    // Set an invalid URL (no scheme)
    urlInput!.value = '192.168.1.100/dav';
    urlInput!.dispatchEvent(new Event('input'));

    // Svelte needs a tick to propagate reactive state
    await Promise.resolve();

    const btn = container.querySelector<HTMLButtonElement>('button.btn--primary');
    expect(btn!.disabled).toBe(true);
  });

  it('Connect button is disabled when URL uses ftp:// scheme', async () => {
    mountPanel({ nasEnabled: true });

    const urlInput = container.querySelector<HTMLInputElement>('#nas-url');
    urlInput!.value = 'ftp://192.168.1.100/dav';
    urlInput!.dispatchEvent(new Event('input'));

    await Promise.resolve();

    const btn = container.querySelector<HTMLButtonElement>('button.btn--primary');
    expect(btn!.disabled).toBe(true);
  });

  it('Connect button is enabled when URL starts with https://', async () => {
    mountPanel({ nasEnabled: true });

    const urlInput = container.querySelector<HTMLInputElement>('#nas-url');
    urlInput!.value = 'https://192.168.1.100/dav';
    urlInput!.dispatchEvent(new Event('input'));

    await Promise.resolve();

    const btn = container.querySelector<HTMLButtonElement>('button.btn--primary');
    expect(btn!.disabled).toBe(false);
  });

  it('Connect button is enabled when URL starts with http://', async () => {
    mountPanel({ nasEnabled: true });

    const urlInput = container.querySelector<HTMLInputElement>('#nas-url');
    urlInput!.value = 'http://192.168.1.100/dav';
    urlInput!.dispatchEvent(new Event('input'));

    await Promise.resolve();

    const btn = container.querySelector<HTMLButtonElement>('button.btn--primary');
    expect(btn!.disabled).toBe(false);
  });
});

describe('NasConfigPanel — password input security', () => {
  beforeEach(() => {
    setNasConfig(null);
  });

  it('password input has type="password" attribute', () => {
    mountPanel({ nasEnabled: true });
    const pwInput = container.querySelector<HTMLInputElement>('#nas-password');
    expect(pwInput).not.toBeNull();
    expect(pwInput!.getAttribute('type')).toBe('password');
  });
});

describe('NasConfigPanel — password cleared after connectNas resolves', () => {
  beforeEach(() => {
    setNasConfig(null);
  });

  it('clears the password input after a successful connect', async () => {
    vi.mocked(nasStore.connectNas).mockResolvedValueOnce(undefined);

    mountPanel({ nasEnabled: true });

    const urlInput = container.querySelector<HTMLInputElement>('#nas-url')!;
    const pwInput = container.querySelector<HTMLInputElement>('#nas-password')!;
    const btn = container.querySelector<HTMLButtonElement>('button.btn--primary')!;

    // Fill in valid URL and password
    urlInput.value = 'https://192.168.1.100/dav';
    urlInput.dispatchEvent(new Event('input'));
    pwInput.value = 'mysecret';
    pwInput.dispatchEvent(new Event('input'));

    await Promise.resolve();

    // Click connect
    btn.click();

    // Allow async handler to complete
    await new Promise((r) => setTimeout(r, 0));

    expect(pwInput.value).toBe('');
  });

  it('clears the password input even when connectNas throws', async () => {
    vi.mocked(nasStore.connectNas).mockRejectedValueOnce(new Error('auth failed'));

    mountPanel({ nasEnabled: true });

    const urlInput = container.querySelector<HTMLInputElement>('#nas-url')!;
    const pwInput = container.querySelector<HTMLInputElement>('#nas-password')!;
    const btn = container.querySelector<HTMLButtonElement>('button.btn--primary')!;

    urlInput.value = 'https://192.168.1.100/dav';
    urlInput.dispatchEvent(new Event('input'));
    pwInput.value = 'mysecret';
    pwInput.dispatchEvent(new Event('input'));

    await Promise.resolve();

    btn.click();

    await new Promise((r) => setTimeout(r, 0));

    expect(pwInput.value).toBe('');
  });
});

describe('NasConfigPanel — disconnect flow', () => {
  it('clears displayed nasConfig fields after disconnectNas is called', async () => {
    setNasConfig({
      url: 'https://192.168.1.100/dav',
      username: 'admin',
      lastSync: null,
      offlineModeEnabled: false,
    });
    setSyncStatus('synced');

    vi.mocked(nasStore.disconnectNas).mockImplementation(async () => {
      setNasConfig(null);
      setSyncStatus('disabled');
    });

    mountPanel({ nasEnabled: true });

    // Server and user fields should be visible while config is set
    expect(container.textContent).toContain('https://192.168.1.100/dav');
    expect(container.textContent).toContain('admin');

    // Click Disconnect
    const disconnectBtn = Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.textContent?.trim() === 'Disconnect'
    );

    expect(disconnectBtn).not.toBeNull();
    disconnectBtn!.click();

    await new Promise((r) => setTimeout(r, 0));

    // After disconnect, the form (not the status view) should be rendered
    expect(container.querySelector('#nas-url')).not.toBeNull();
    // Config fields should no longer appear
    expect(container.textContent).not.toContain('https://192.168.1.100/dav');
  });
});
