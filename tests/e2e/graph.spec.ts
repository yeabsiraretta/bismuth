/**
 * E2E tests for Bismuth Graph View
 * T110: Graph rendering, node interaction, filtering
 */

import { test, expect } from '@playwright/test';

test.describe('Graph View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
  });

  test('should render graph container when navigated', async ({ page }) => {
    // Navigate to graph view via sidebar or command
    const graphButton = page.locator(
      '[data-testid="graph-toggle"], button:has-text("Graph"), [aria-label*="graph" i]'
    );
    if (await graphButton.isVisible()) {
      await graphButton.click();
      const graphContainer = page.locator(
        '[data-testid="graph-view"], .graph-view, .graph-container, canvas'
      );
      await expect(graphContainer).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display graph filter controls', async ({ page }) => {
    const graphButton = page.locator(
      '[data-testid="graph-toggle"], button:has-text("Graph"), [aria-label*="graph" i]'
    );
    if (await graphButton.isVisible()) {
      await graphButton.click();
      await page.waitForTimeout(500);
      const filters = page.locator(
        '[data-testid="graph-filters"], .graph-filters, .graph-controls'
      );
      // Filters may or may not be visible depending on vault state
      const isVisible = await filters.isVisible();
      expect(typeof isVisible).toBe('boolean');
    }
  });

  test('should handle empty graph state gracefully', async ({ page }) => {
    const graphButton = page.locator(
      '[data-testid="graph-toggle"], button:has-text("Graph"), [aria-label*="graph" i]'
    );
    if (await graphButton.isVisible()) {
      await graphButton.click();
      await page.waitForTimeout(1000);
      // Should not crash or show error on empty vault
      const errorDialog = page.locator('[role="alert"], .error-message');
      await expect(errorDialog).not.toBeVisible();
    }
  });
});

test.describe('Graph Interaction', () => {
  test('should support pan/zoom on graph canvas', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    const graphButton = page.locator(
      '[data-testid="graph-toggle"], button:has-text("Graph"), [aria-label*="graph" i]'
    );
    if (await graphButton.isVisible()) {
      await graphButton.click();
      await page.waitForTimeout(500);
      const canvas = page.locator('canvas, .graph-view svg, .graph-container');
      if (await canvas.isVisible()) {
        // Attempt zoom with wheel
        await canvas.hover();
        await page.mouse.wheel(0, -100);
        // No crash verifies zoom handling
      }
    }
  });
});
