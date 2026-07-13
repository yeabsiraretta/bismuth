/**
 * Editor tests: navigate to editor, verify the page loads
 * and shows the correct state (empty or with active note).
 */
import { test, expect, sel } from './fixtures';

test.describe('Editor page', () => {
  test('editor page renders without crash', async ({ appPage: page }) => {
    await page.goto('/editor');
    await expect(page.locator(sel.statusBar)).toBeVisible({ timeout: 10_000 });
    // Editor page container should exist
    await expect(page.locator('.editor-page')).toBeVisible();
  });

  test('shows empty state when no note is selected', async ({ appPage: page }) => {
    await page.goto('/editor');
    await expect(page.locator(sel.statusBar)).toBeVisible({ timeout: 10_000 });
    // Without an active tab, editor shows "No Note Selected" placeholder
    await expect(page.locator('text=No Note Selected')).toBeVisible();
  });

  test('sidebar is visible on editor page', async ({ appPage: page }) => {
    await page.goto('/editor');
    await expect(page.locator(sel.statusBar)).toBeVisible({ timeout: 10_000 });
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();
  });

  test('navigating to editor preserves status bar', async ({ appPage: page }) => {
    // Navigate home → editor → check no crash
    await page.goto('/');
    await expect(page.locator(sel.homeDash)).toBeVisible({ timeout: 10_000 });
    await page.goto('/editor');
    await expect(page.locator(sel.statusBar)).toBeVisible({ timeout: 10_000 });
  });
});
