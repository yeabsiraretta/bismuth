/**
 * E2E tests for Bismuth Search functionality
 * T110: Search panel, keyboard navigation, result rendering
 */

import { test, expect } from '@playwright/test';

test.describe('Search Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to initialize
    await page.waitForTimeout(500);
  });

  test('should open search panel with Cmd+P', async ({ page }) => {
    await page.keyboard.press('Meta+p');
    const searchPanel = page.locator(
      '[data-testid="search-panel"], .search-panel, .command-palette'
    );
    await expect(searchPanel).toBeVisible({ timeout: 2000 });
  });

  test('should have search input focused when opened', async ({ page }) => {
    await page.keyboard.press('Meta+p');
    await page.waitForTimeout(300);
    const input = page.locator(
      '[data-testid="search-input"], .search-panel input, .command-palette input'
    );
    await expect(input).toBeFocused({ timeout: 2000 });
  });

  test('should close search panel on Escape', async ({ page }) => {
    await page.keyboard.press('Meta+p');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    const searchPanel = page.locator(
      '[data-testid="search-panel"], .search-panel, .command-palette'
    );
    await expect(searchPanel).not.toBeVisible({ timeout: 2000 });
  });

  test('should accept text input in search field', async ({ page }) => {
    await page.keyboard.press('Meta+p');
    await page.waitForTimeout(300);
    await page.keyboard.type('test query');
    const input = page.locator(
      '[data-testid="search-input"], .search-panel input, .command-palette input'
    );
    await expect(input).toHaveValue('test query');
  });
});

test.describe('Search Results Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
  });

  test('should display results area after typing', async ({ page }) => {
    await page.keyboard.press('Meta+p');
    await page.waitForTimeout(300);
    await page.keyboard.type('note');
    await page.waitForTimeout(200);
    // Results container should exist (may be empty if no vault)
    const results = page.locator(
      '[data-testid="search-results"], .search-results, .command-results'
    );
    await expect(results).toBeVisible({ timeout: 3000 });
  });
});
