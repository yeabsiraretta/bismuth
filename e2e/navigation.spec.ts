/**
 * Navigation tests: clicking each nav card on the home page
 * navigates to the correct route and the page renders.
 */
import { test, expect, sel } from './fixtures';

const ROUTE_CARDS: { label: string; expectedPath: string }[] = [
  { label: 'Editor', expectedPath: '/editor' },
  { label: 'Calendar', expectedPath: '/calendar' },
  { label: 'Projects', expectedPath: '/projects' },
  { label: 'Writing', expectedPath: '/writing' },
  { label: 'Flashcards', expectedPath: '/flashcards' },
  { label: 'Import', expectedPath: '/import' },
  { label: 'Creative', expectedPath: '/creative' },
  { label: 'Graph', expectedPath: '/graph' },
  { label: 'Media', expectedPath: '/media' },
  { label: 'Gamification', expectedPath: '/gamification' },
];

for (const { label, expectedPath } of ROUTE_CARDS) {
  test(`nav card "${label}" navigates to ${expectedPath}`, async ({ appPage: page }) => {
    const card = page.locator(sel.navCard(label));
    await expect(card).toBeVisible();
    await card.click();

    await page.waitForURL((url) => url.pathname === expectedPath, { timeout: 10_000 });
    expect(page.url()).toContain(expectedPath);

    // Page should render without crash (status bar still visible)
    await expect(page.locator(sel.statusBar)).toBeVisible();
  });
}

test('Pokémon nav card navigates to /pokemon', async ({ appPage: page }) => {
  const card = page.locator(sel.navCard('Pokémon'));
  await expect(card).toBeVisible();
  await card.click();

  await page.waitForURL((url) => url.pathname === '/pokemon', { timeout: 10_000 });
  await expect(page.locator(sel.statusBar)).toBeVisible();
});

test('can navigate back to home from editor', async ({ appPage: page }) => {
  // Go to editor
  await page.locator(sel.navCard('Editor')).click();
  await page.waitForURL('**/editor');
  await expect(page.locator(sel.statusBar)).toBeVisible({ timeout: 10_000 });

  // Navigate back using the home hub button in the activity bar
  const homeBtn = page.locator('.sb-hub[title="Home"]');
  if (await homeBtn.isVisible()) {
    await homeBtn.click();
    await page.waitForURL((url) => url.pathname === '/', { timeout: 10_000 });
    await expect(page.locator(sel.homeDash)).toBeVisible({ timeout: 10_000 });
  }
});

test('direct URL navigation works for all routes', async ({ appPage: page }) => {
  for (const { expectedPath } of ROUTE_CARDS) {
    await page.goto(expectedPath);
    await expect(page.locator(sel.statusBar)).toBeVisible({ timeout: 10_000 });
  }
});
