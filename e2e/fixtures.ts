/**
 * Shared Playwright fixtures and helpers for Bismuth E2E tests.
 *
 * The app runs as a SPA with browser fallbacks when Tauri is absent.
 * Without Tauri, vault operations use localStorage + mock paths,
 * so we can test the full UI without the Rust backend.
 */
import { test as base, expect, type Page } from '@playwright/test';

// ── Selectors ───────────────────────────────────────────────────────────────

export const sel = {
  // Welcome / onboarding
  welcomeLanding: '.sv-landing',
  welcomeHome: '.sv-setup',
  vaultNameInput: '.sv-input',
  createBlankBtn: 'button[aria-label="Create blank vault"]',
  openExistingBtn: 'button[aria-label="Open existing vault folder"]',
  templateCard: '.sv-card',

  // Home page
  homeDash: '.hp-dash',
  homeGreeting: '.hp-hello',
  homeStats: '.hp-stats',
  homeStatValue: '.hp-stat-value',
  homeNavGrid: '.hp-nav-grid',
  homeNavCard: '.hp-nav-card',
  homeRecentGrid: '.hp-recent-grid',

  // Nav items
  navCard: (label: string) => `.hp-nav-card:has(.hp-nav-label:text("${label}"))`,

  // Sidebar
  sidebar: 'aside',
  sidebarHub: '.sb-hub',
  sidebarPanel: '.sb-panel',

  // Command palette
  paletteDialog: '[aria-label="Command palette"]',
  paletteInput: '[aria-label="Command palette search"]',
  paletteItem: '.palette-item',

  // Settings
  settingsDialog: 'div[role="dialog"][aria-label="Settings"]',
  settingsTab: '.settings-tab',
  settingsClose: '[aria-label="Close settings"]',
  settingsSave: '.settings-btn-primary',

  // Editor
  editorPage: '.editor-page',
  cmEditor: '.cm-editor',
  cmContent: '.cm-content',

  // Status bar
  statusBar: '[data-status-bar]',

  // Gamification
  gamifyBadge: '.hp-gamify-badge',
  gamifyXp: '.hp-gamify-xp',
} as const;

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Seed a vault in localStorage so the app boots to the home page. */
export async function seedVault(page: Page, name = 'test-vault') {
  await page.addInitScript((vaultName) => {
    localStorage.setItem(
      'bismuth-vault-info',
      JSON.stringify({ name: vaultName, rootPath: `/demo/${vaultName}` })
    );
    // Ensure homepage is 'dashboard' so the app stays on '/' and doesn't redirect
    localStorage.setItem(
      'bismuth-settings',
      JSON.stringify({ general: { homepage: { option: 'homepage' } } })
    );
  }, name);
}

/** Clear all localStorage so the app boots to /welcome. */
export async function clearVault(page: Page) {
  await page.addInitScript(() => {
    localStorage.clear();
  });
}

/** Wait for the SPA to finish mounting (detects when the layout has rendered). */
export async function waitForAppReady(page: Page) {
  // Wait for the splash screen to disappear (3s fallback + 0.5s fade)
  await page.waitForFunction(() => !document.getElementById('splash'), { timeout: 10_000 });
  // The app layout always renders a status bar when the vault is open
  await page.waitForSelector(sel.statusBar, { timeout: 15_000 });
}

/** Open the command palette via keyboard shortcut. */
export async function openCommandPalette(page: Page) {
  // Use Control+p since Meta+p triggers Chrome's print dialog in headless
  // The app treats both metaKey and ctrlKey as "Cmd"
  await page.keyboard.press('Control+p');
  await page.waitForSelector(sel.paletteDialog, { timeout: 5_000 });
}

/** Run a named command from the palette. */
export async function runCommand(page: Page, commandName: string) {
  await openCommandPalette(page);
  await page.fill(sel.paletteInput, commandName);
  // Wait for the filtered result to appear
  await page.waitForSelector(`${sel.paletteItem}:has-text("${commandName}")`, { timeout: 3_000 });
  await page.click(`${sel.paletteItem}:has-text("${commandName}")`);
}

// ── Extended test fixture ───────────────────────────────────────────────────

type BismuthFixtures = {
  /** A page with a seeded vault (boots to home page). */
  appPage: Page;
};

export const test = base.extend<BismuthFixtures>({
  appPage: async ({ page }, use) => {
    await seedVault(page, 'e2e-vault');
    await page.goto('/');
    await waitForAppReady(page);
    await use(page);
  },
});

export { expect };
