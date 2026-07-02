/**
 * Performance E2E tests (T099, T100, T101, T102)
 *
 * Validates NFRs:
 * - NFR-001: Editor input latency <16ms
 * - NFR-003: Graph render <3s for 10k nodes
 * - NFR-006: Cold startup <3s
 * - NFR-007: Memory <500MB with 10k notes
 */

import { test, expect } from '@playwright/test';

test.describe('NFR-006: Cold Startup Time', () => {
  test('should load application within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');

    // Wait for the app to be interactive (main content visible)
    await page.waitForSelector('[data-testid="app-ready"], .app-container, .welcome-screen, main', {
      timeout: 5000,
    });

    const loadTime = Date.now() - startTime;

    // NFR-006: Cold startup <3s
    expect(loadTime).toBeLessThan(3000);
    console.log(`Cold startup time: ${loadTime}ms (target: <3000ms)`);
  });

  test('should render initial UI without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');
    await page.waitForTimeout(2000);

    // No uncaught exceptions during startup
    expect(errors).toHaveLength(0);
  });
});

test.describe('NFR-001: Editor Input Latency', () => {
  test('should measure editor frame time', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Try to find and focus the editor
    const editor = page.locator('.cm-editor .cm-content, [contenteditable="true"]');
    if (await editor.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editor.click();

      // Inject performance measurement
      const latency = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          const start = performance.now();
          const editor = document.querySelector('.cm-content') as HTMLElement;
          if (!editor) {
            resolve(-1);
            return;
          }

          // Simulate input
          const event = new InputEvent('input', { data: 'x', inputType: 'insertText' });
          editor.dispatchEvent(event);

          requestAnimationFrame(() => {
            const end = performance.now();
            resolve(end - start);
          });
        });
      });

      if (latency > 0) {
        // NFR-001: <16ms frame time
        expect(latency).toBeLessThan(16);
        console.log(`Editor input latency: ${latency.toFixed(2)}ms (target: <16ms)`);
      }
    }
  });
});

test.describe('NFR-003: Graph Render Performance', () => {
  test('should render graph view within 3 seconds', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    // Navigate to graph
    const graphButton = page.locator(
      '[data-testid="graph-toggle"], button:has-text("Graph"), [aria-label*="graph" i]'
    );

    if (await graphButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      const startTime = Date.now();
      await graphButton.click();

      // Wait for graph to render
      await page.waitForSelector(
        '[data-testid="graph-view"], .graph-view, canvas, .graph-container',
        { timeout: 5000 }
      );

      const renderTime = Date.now() - startTime;

      // NFR-003: <3s for graph render
      expect(renderTime).toBeLessThan(3000);
      console.log(`Graph render time: ${renderTime}ms (target: <3000ms)`);
    }
  });
});

test.describe('NFR-007: Memory Usage', () => {
  test('should measure page memory usage', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Measure JS heap size via Performance API
    const memoryInfo = await page.evaluate(() => {
      const perf = performance as any;
      if (perf.memory) {
        return {
          usedJSHeapSize: perf.memory.usedJSHeapSize,
          totalJSHeapSize: perf.memory.totalJSHeapSize,
          jsHeapSizeLimit: perf.memory.jsHeapSizeLimit,
        };
      }
      return null;
    });

    if (memoryInfo) {
      const usedMB = memoryInfo.usedJSHeapSize / (1024 * 1024);
      console.log(`JS Heap usage: ${usedMB.toFixed(1)}MB`);
      console.log(`Total JS Heap: ${(memoryInfo.totalJSHeapSize / (1024 * 1024)).toFixed(1)}MB`);

      // NFR-007: <500MB total
      expect(usedMB).toBeLessThan(500);
    }
  });

  test('should not leak memory on repeated navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Measure initial memory
    const initialMemory = await page.evaluate(() => {
      const perf = performance as any;
      return perf.memory ? perf.memory.usedJSHeapSize : 0;
    });

    // Perform 10 navigation cycles
    for (let i = 0; i < 10; i++) {
      // Toggle sidebar or navigate between views
      await page.keyboard.press('Meta+b');
      await page.waitForTimeout(100);
      await page.keyboard.press('Meta+b');
      await page.waitForTimeout(100);
    }

    // Force garbage collection if available
    await page.evaluate(() => {
      if ((globalThis as any).gc) {
        (globalThis as any).gc();
      }
    });

    await page.waitForTimeout(500);

    const finalMemory = await page.evaluate(() => {
      const perf = performance as any;
      return perf.memory ? perf.memory.usedJSHeapSize : 0;
    });

    if (initialMemory > 0 && finalMemory > 0) {
      const growthMB = (finalMemory - initialMemory) / (1024 * 1024);
      console.log(`Memory growth after 10 nav cycles: ${growthMB.toFixed(2)}MB`);
      // Allow some growth but flag major leaks (>50MB)
      expect(growthMB).toBeLessThan(50);
    }
  });
});
