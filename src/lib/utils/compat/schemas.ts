/**
 * Baseline schema registrations for all existing localStorage keys.
 *
 * Every key starts at schema version 1 (the current shape). When a future
 * release changes the shape, add a migration function and bump the version.
 *
 * Example of a v2 migration:
 *   schemaRegistry.register({
 *     id: 'bismuth-settings',
 *     currentVersion: 2,
 *     minReaderVersion: '0.3.0',   // v0.3.0 can still read v2 data
 *     migrations: [settingsV1toV2], // index 0 = v1→v2
 *     defaultValue: () => ({ ...DEFAULT }),
 *   });
 */

import { schemaRegistry } from './registry';

// ─── Core settings ────────────────────────────────────────────────────────────

schemaRegistry.register({
  id: 'bismuth-settings',
  currentVersion: 1,
  minReaderVersion: '0.3.0',
  migrations: [],
  defaultValue: () => ({}),
});

schemaRegistry.register({
  id: 'bismuth-feature-flags',
  currentVersion: 1,
  minReaderVersion: '0.3.0',
  migrations: [],
  defaultValue: () => ({}),
});

schemaRegistry.register({
  id: 'bismuth-theme',
  currentVersion: 1,
  minReaderVersion: '0.3.0',
  migrations: [],
  defaultValue: () => 'auto',
});

// ─── Layout & UI ──────────────────────────────────────────────────────────────

schemaRegistry.register({
  id: 'bismuth-layout',
  currentVersion: 1,
  minReaderVersion: '0.3.0',
  migrations: [],
  defaultValue: () => ({}),
});

schemaRegistry.register({
  id: 'bismuth-layout-presets',
  currentVersion: 1,
  minReaderVersion: '0.3.0',
  migrations: [],
  defaultValue: () => [],
});

schemaRegistry.register({
  id: 'bismuth-zoom-level',
  currentVersion: 1,
  minReaderVersion: '0.3.0',
  migrations: [],
  defaultValue: () => 1.0,
});

schemaRegistry.register({
  id: 'bismuth-css-settings',
  currentVersion: 1,
  minReaderVersion: '0.3.0',
  migrations: [],
  defaultValue: () => ({ values: {}, classToggles: {}, classSelects: {}, themedColors: {} }),
});

schemaRegistry.register({
  id: 'bismuth-style-overrides',
  currentVersion: 1,
  minReaderVersion: '0.3.0',
  migrations: [],
  defaultValue: () => ({ tokens: {} }),
});

// ─── Vault & notes ────────────────────────────────────────────────────────────

schemaRegistry.register({
  id: 'bismuth-recent-files',
  currentVersion: 1,
  minReaderVersion: '0.3.0',
  migrations: [],
  defaultValue: () => [],
});

schemaRegistry.register({
  id: 'bismuth-filetree-expanded',
  currentVersion: 1,
  minReaderVersion: '0.3.0',
  migrations: [],
  defaultValue: () => [],
});

schemaRegistry.register({
  id: 'bismuth-homepage',
  currentVersion: 1,
  minReaderVersion: '0.3.0',
  migrations: [],
  defaultValue: () => ({ option: 'last-opened' }),
});

// ─── Startup & observability ──────────────────────────────────────────────────

schemaRegistry.register({
  id: 'bismuth-startup-metrics',
  currentVersion: 1,
  minReaderVersion: '0.3.0',
  migrations: [],
  defaultValue: () => [],
});

schemaRegistry.register({
  id: 'bismuth-metrics',
  currentVersion: 1,
  minReaderVersion: '0.3.0',
  migrations: [],
  defaultValue: () => ({ counters: {}, gauges: {}, histograms: {} }),
});

// ─── OpenFeature (removed — schemas kept for backward-compat migration) ──────

// Force side-effect execution
export const _schemasRegistered = true;
