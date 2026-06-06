<script lang="ts">
  import ThemeToggle from '@/components/ui/ThemeToggle.svelte';
  import { theme } from '@/stores/theme/theme';

  const selectedTheme = theme.selectedTheme;

  export let accentColor: string;
  export let showStatusBar: boolean;
  export let compactMode: boolean;
</script>

<div class="settings-section">
  <h3>Appearance</h3>

  <div class="setting-group">
    <h4>Theme</h4>

    <div class="setting-item">
      <label for="theme-mode">Theme Mode</label>
      <div class="theme-toggle-wrapper">
        <ThemeToggle />
        <span class="setting-hint">Current: {$selectedTheme}</span>
      </div>
      <span class="setting-hint">Switch between light, dark, and auto (system) theme</span>
    </div>

    <div class="setting-item">
      <label for="accent-color">Accent Color</label>
      <div class="color-picker">
        <input id="accent-color" type="color" bind:value={accentColor} />
        <span class="color-value">{accentColor}</span>
      </div>
      <span class="setting-hint">Primary color for buttons and highlights (coming soon)</span>
    </div>
  </div>

  <div class="setting-group">
    <h4>Interface</h4>

    <div class="setting-item">
      <label>
        <input type="checkbox" bind:checked={showStatusBar} />
        Show status bar
      </label>
      <span class="setting-hint">Display status information at the bottom (coming soon)</span>
    </div>

    <div class="setting-item">
      <label>
        <input type="checkbox" bind:checked={compactMode} />
        Compact mode
      </label>
      <span class="setting-hint">Reduce spacing for more content on screen (coming soon)</span>
    </div>

    <div class="setting-item">
      <label>
        <input type="checkbox" value={true} disabled />
        Show sidebar icons
      </label>
      <span class="setting-hint">Display icons in sidebar navigation</span>
    </div>

    <div class="setting-item">
      <label>
        <input type="checkbox" value={false} disabled />
        Native window frame
      </label>
      <span class="setting-hint">Use system window decorations (coming soon)</span>
    </div>
  </div>

  <div class="setting-group">
    <h4>Zoom</h4>

    <div class="setting-item">
      <label for="zoom-level">Zoom Level</label>
      <input id="zoom-level" type="range" value={100} min="75" max="150" step="5" disabled />
      <span class="setting-value">100%</span>
      <span class="setting-hint">Adjust overall interface size (coming soon)</span>
    </div>
  </div>
</div>

<style>
  .theme-toggle-wrapper {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
  }

  .color-picker {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
  }

  .color-picker input[type='color'] {
    width: 60px;
    height: 40px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    cursor: pointer;
  }

  .color-value {
    font-family: var(--font-monospace);
    font-size: var(--font-ui-small);
    color: var(--text-muted);
  }
</style>
