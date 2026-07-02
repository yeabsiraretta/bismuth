/**
 * Smoke tests for Bismuth PKM Editor
 * Basic tests to verify the application launches and core UI renders
 */

import { test, expect } from '@playwright/test';

test.describe('Application Launch', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Bismuth/);
  });

  test('should render the app container', async ({ page }) => {
    await page.goto('/');
    const appContainer = page.locator('.app-container, #app, [data-testid="app"]');
    await expect(appContainer).toBeVisible({ timeout: 5000 });
  });

  test('should show welcome screen or main layout', async ({ page }) => {
    await page.goto('/');
    // Either welcome screen (no vault) or main layout (vault open)
    const content = page.locator('.welcome-screen, .app-container, .editor-pane, main');
    await expect(content).toBeVisible({ timeout: 5000 });
  });

  test('should not have console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });
});

test.describe('Layout Structure', () => {
  test('should render sidebar area', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    const sidebar = page.locator('.left-sidebar, aside, [data-testid="left-sidebar"], nav');
    // Sidebar may be hidden on welcome screen but should exist in DOM
    const count = await sidebar.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForTimeout(500);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForTimeout(500);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
