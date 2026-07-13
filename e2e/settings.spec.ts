/**
 * Settings modal tests: open, navigate tabs, close.
 */
import { test, expect, sel } from './fixtures';

/** Open settings via keyboard shortcut and wait for dialog. */
async function openSettingsModal(page: import('@playwright/test').Page) {
  // Use Control+, since Meta+, may be intercepted by the browser/OS
  // The app treats both metaKey and ctrlKey as "Cmd"
  await page.keyboard.press('Control+,');
  await page.waitForSelector(sel.settingsDialog, { timeout: 5_000 });
}

test.describe('Settings modal', () => {
  test('opens via keyboard shortcut', async ({ appPage: page }) => {
    await openSettingsModal(page);
    await expect(page.locator(sel.settingsDialog)).toBeVisible();
  });

  test('displays settings tabs', async ({ appPage: page }) => {
    await openSettingsModal(page);
    const tabs = page.locator(sel.settingsTab);
    expect(await tabs.count()).toBeGreaterThanOrEqual(5);

    // Check some expected tab labels
    const tabTexts = await tabs.allTextContents();
    const normalised = tabTexts.map((t) => t.trim().toLowerCase());
    expect(normalised).toContain('general');
    expect(normalised).toContain('editor');
    expect(normalised).toContain('appearance');
  });

  test('switching tabs renders content', async ({ appPage: page }) => {
    await openSettingsModal(page);

    // Click the Appearance tab
    const appearanceTab = page.locator(`${sel.settingsTab}:has-text("Appearance")`);
    await appearanceTab.click();

    // Settings content should be visible (not empty)
    const content = page.locator('.settings-content');
    await expect(content).toBeVisible();
  });

  test('close button closes settings', async ({ appPage: page }) => {
    await openSettingsModal(page);
    await expect(page.locator(sel.settingsDialog)).toBeVisible();

    await page.locator(sel.settingsClose).click();
    await expect(page.locator(sel.settingsDialog)).not.toBeVisible();
  });

  test('Escape closes settings', async ({ appPage: page }) => {
    await openSettingsModal(page);
    await expect(page.locator(sel.settingsDialog)).toBeVisible();

    // Focus the dialog so the keydown event reaches its handler
    await page.locator(sel.settingsDialog).focus();
    await page.keyboard.press('Escape');
    // history.back() is async — give it time to process
    await expect(page.locator(sel.settingsDialog)).not.toBeVisible({ timeout: 5_000 });
  });
});
