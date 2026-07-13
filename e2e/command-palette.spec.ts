/**
 * Command palette tests: open, search, execute commands.
 */
import { test, expect, sel, openCommandPalette } from './fixtures';

test.describe('Command palette', () => {
  test('opens with Cmd+P', async ({ appPage: page }) => {
    await openCommandPalette(page);
    await expect(page.locator(sel.paletteDialog)).toBeVisible();
    await expect(page.locator(sel.paletteInput)).toBeFocused();
  });

  test('closes with Escape', async ({ appPage: page }) => {
    await openCommandPalette(page);
    await expect(page.locator(sel.paletteDialog)).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator(sel.paletteDialog)).not.toBeVisible();
  });

  test('shows commands list', async ({ appPage: page }) => {
    await openCommandPalette(page);
    const items = page.locator(sel.paletteItem);
    expect(await items.count()).toBeGreaterThanOrEqual(1);
  });

  test('search filters commands', async ({ appPage: page }) => {
    await openCommandPalette(page);
    const allCount = await page.locator(sel.paletteItem).count();

    await page.fill(sel.paletteInput, 'editor');
    await page.waitForTimeout(200);
    const filteredCount = await page.locator(sel.paletteItem).count();

    // Filtered should be fewer (or equal if all match, but likely fewer)
    expect(filteredCount).toBeLessThanOrEqual(allCount);
    expect(filteredCount).toBeGreaterThanOrEqual(1);
  });

  test('command items show categories and shortcuts', async ({ appPage: page }) => {
    await openCommandPalette(page);

    // Commands should display category and optional shortcut
    const firstItem = page.locator(sel.paletteItem).first();
    await expect(firstItem).toBeVisible();

    const category = firstItem.locator('.palette-item-cat');
    await expect(category).toBeVisible();
    const catText = await category.textContent();
    expect(catText?.trim().length).toBeGreaterThan(0);
  });

  test('clicking overlay closes palette', async ({ appPage: page }) => {
    await openCommandPalette(page);
    await expect(page.locator(sel.paletteDialog)).toBeVisible();

    // Click the overlay (outside the dialog)
    await page.locator('.palette-overlay').click({ position: { x: 5, y: 5 } });
    await expect(page.locator(sel.paletteDialog)).not.toBeVisible();
  });
});
