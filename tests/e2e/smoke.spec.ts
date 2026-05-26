/**
 * Smoke tests for Bismuth PKM Editor
 * Basic tests to verify the application launches and core functionality works
 */

import { test, expect } from '@playwright/test';

test.describe('Application Launch', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page title contains "Bismuth"
    await expect(page).toHaveTitle(/Bismuth/);
  });

  test('should display main heading', async ({ page }) => {
    await page.goto('/');
    
    // Check for main heading
    const heading = page.locator('h1');
    await expect(heading).toContainText('Bismuth PKM Editor');
  });

  test('should display welcome message', async ({ page }) => {
    await page.goto('/');
    
    // Check for welcome message
    const welcome = page.locator('p');
    await expect(welcome).toContainText('Welcome to Bismuth');
  });
});

test.describe('Counter Demo', () => {
  test('should increment counter on button click', async ({ page }) => {
    await page.goto('/');
    
    // Find the counter button
    const button = page.locator('button');
    await expect(button).toContainText('count is 0');
    
    // Click the button
    await button.click();
    await expect(button).toContainText('count is 1');
    
    // Click again
    await button.click();
    await expect(button).toContainText('count is 2');
  });
});

test.describe('Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that content is visible
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Check that content is visible
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });
});
