/**
 * Smoke tests: verifies the app boots, the welcome flow works,
 * and the home dashboard renders with all key sections.
 */
import { test as base, expect } from '@playwright/test';

import { clearVault, seedVault, sel, waitForAppReady } from '../support/fixtures';

base.describe('Welcome → Vault creation flow', () => {
  base.beforeEach(async ({ page }) => {
    await clearVault(page);
  });

  base('shows landing page with ASCII logo', async ({ page }) => {
    await page.goto('/welcome');
    await page.waitForSelector(sel.welcomeLanding, { timeout: 10_000 });
    const logo = page.locator('.sv-ascii');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('aria-label', 'Bismuth');
  });

  base('press-any-key advances to vault setup', async ({ page }) => {
    await page.goto('/welcome');
    await page.waitForSelector(sel.welcomeLanding, { timeout: 10_000 });
    await page.keyboard.press('Space');
    await expect(page.locator(sel.welcomeHome)).toBeVisible();
  });

  base('vault name input is editable', async ({ page }) => {
    await page.goto('/welcome');
    await page.waitForSelector(sel.welcomeLanding, { timeout: 10_000 });
    await page.keyboard.press('Space');
    const input = page.locator(sel.vaultNameInput);
    await expect(input).toBeVisible();
    await input.fill('My E2E Vault');
    await expect(input).toHaveValue('My E2E Vault');
  });

  base('create blank vault button exists', async ({ page }) => {
    await page.goto('/welcome');
    await page.waitForSelector(sel.welcomeLanding, { timeout: 10_000 });
    await page.keyboard.press('Space');
    await expect(page.locator(sel.createBlankBtn)).toBeVisible();
    await expect(page.locator(sel.openExistingBtn)).toBeVisible();
  });

  base('template cards are shown', async ({ page }) => {
    await page.goto('/welcome');
    await page.waitForSelector(sel.welcomeLanding, { timeout: 10_000 });
    await page.keyboard.press('Space');
    const cards = page.locator(sel.templateCard);
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
  });

  base('creating blank vault redirects to home', async ({ page }) => {
    await page.goto('/welcome');
    await page.waitForSelector(sel.welcomeLanding, { timeout: 10_000 });
    await page.keyboard.press('Space');

    const input = page.locator(sel.vaultNameInput);
    await input.fill('Test Vault');
    await page.click(sel.createBlankBtn);

    // Should navigate away from /welcome to the app
    await page.waitForURL((url) => !url.pathname.includes('welcome'), { timeout: 10_000 });

    // Status bar should appear (app layout mounted)
    await waitForAppReady(page);
  });
});

base.describe('Home dashboard (with seeded vault)', () => {
  base.beforeEach(async ({ page }) => {
    await seedVault(page, 'e2e-vault');
    await page.goto('/');
    await waitForAppReady(page);
  });

  base('renders greeting and vault name', async ({ page }) => {
    const greeting = page.locator(sel.homeGreeting);
    await expect(greeting).toBeVisible();
    await expect(greeting).toContainText('e2e-vault');
  });

  base('shows stats bar with Notes/Folders/Words', async ({ page }) => {
    const stats = page.locator(sel.homeStats);
    await expect(stats).toBeVisible();
    const labels = page.locator('.hp-stat-label');
    const texts = await labels.allTextContents();
    expect(texts).toContain('Notes');
    expect(texts).toContain('Folders');
    expect(texts).toContain('Words');
  });

  base('shows navigation grid with all hub cards', async ({ page }) => {
    const navGrid = page.locator(sel.homeNavGrid);
    await expect(navGrid).toBeVisible();

    const expectedLabels = [
      'Editor',
      'Calendar',
      'Projects',
      'Writing',
      'Flashcards',
      'Import',
      'Creative',
      'Canvas',
      'Pokémon',
      'Graph',
      'Media',
      'Gamification',
    ];
    for (const label of expectedLabels) {
      await expect(page.locator(`.hp-nav-label:text("${label}")`)).toBeVisible();
    }
  });

  base('shows gamification badge with level and XP', async ({ page }) => {
    await expect(page.locator(sel.gamifyBadge)).toBeVisible();
    await expect(page.locator(sel.gamifyXp)).toBeVisible();
  });

  base('status bar is visible', async ({ page }) => {
    await expect(page.locator(sel.statusBar)).toBeVisible();
  });
});
