<script lang="ts">
  import ThemeToggle from '@/components/ui/ThemeToggle.svelte';
  import ThemeBrowser from '@/components/settings/ThemeBrowser.svelte';
  import StyleSettings from '@/components/settings/style/StyleSettings.svelte';
  import { theme } from '@/stores/theme/theme';
  import { setZoom, getStoredZoom } from '@/services/app/zoom';
  import { sanitizeFontValue } from '@/utils/settings/fontSanitizer';

  const selectedTheme = theme.selectedTheme;

  export let accentColor: string;
  export let showStatusBar: boolean;
  export let compactMode: boolean;
  export let nativeFrame: boolean;
  export let fontInterface: string = 'Inter Variable';
  export let fontText: string = 'Inter Variable';
  export let fontMono: string = 'JetBrains Mono';
  export let activeThemePath: string = '';

  const INTERFACE_FONTS = ['Inter Variable', 'system-ui', 'Helvetica Neue', 'Segoe UI', 'Arial'];
  const TEXT_FONTS = [
    'Inter Variable',
    'system-ui',
    'Georgia',
    'Source Serif 4',
    "'Times New Roman'",
  ];
  const MONO_FONTS = [
    'JetBrains Mono',
    'Fira Code',
    'Cascadia Code',
    "'Courier New'",
    'Menlo',
    'Consolas',
  ];

  let uiScale = Math.round(getStoredZoom() * 100);

  async function handleScaleChange(e: Event) {
    const val = parseInt((e.target as HTMLInputElement).value);
    uiScale = val;
    await setZoom(val / 100);
  }

  function sanitizeFontBlur(field: 'fontInterface' | 'fontText' | 'fontMono') {
    if (field === 'fontInterface')
      fontInterface = sanitizeFontValue(fontInterface, 'Inter Variable');
    else if (field === 'fontText') fontText = sanitizeFontValue(fontText, 'Inter Variable');
    else fontMono = sanitizeFontValue(fontMono, 'JetBrains Mono');
  }
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
      <span class="setting-hint">Primary color for buttons and highlights</span>
    </div>
  </div>

  <div class="setting-group">
    <h4>Interface</h4>

    <div class="setting-item">
      <label>
        <input type="checkbox" bind:checked={showStatusBar} />
        Show status bar
      </label>
      <span class="setting-hint">Display status information at the bottom</span>
    </div>

    <div class="setting-item">
      <label>
        <input type="checkbox" bind:checked={compactMode} />
        Compact mode
      </label>
      <span class="setting-hint">Reduce spacing for more content on screen</span>
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
        <input type="checkbox" bind:checked={nativeFrame} />
        Native window frame
      </label>
      <span class="setting-hint">Use system window decorations (restart required)</span>
    </div>
  </div>

  <div class="setting-group">
    <h4>UI Scale</h4>

    <div class="setting-item">
      <label for="ui-scale">Scale</label>
      <input
        id="ui-scale"
        type="range"
        value={uiScale}
        min="75"
        max="150"
        step="5"
        on:input={handleScaleChange}
      />
      <span class="setting-value">{uiScale}%</span>
      <span class="setting-hint">Scale all UI components uniformly (75%–150%)</span>
    </div>
  </div>

  <div class="setting-group">
    <h4>Fonts</h4>

    <div class="setting-item">
      <label for="font-interface">Interface Font</label>
      <div class="font-row">
        <select id="font-interface" bind:value={fontInterface}>
          {#each INTERFACE_FONTS as f}<option value={f}>{f}</option>{/each}
        </select>
        <input
          type="text"
          class="font-custom"
          bind:value={fontInterface}
          on:blur={() => sanitizeFontBlur('fontInterface')}
          placeholder="Custom..."
          aria-label="Custom interface font"
        />
      </div>
      <span class="setting-hint">Font for UI elements (sidebars, panels, menus)</span>
    </div>

    <div class="setting-item">
      <label for="font-text">Text / Editor Font</label>
      <div class="font-row">
        <select id="font-text" bind:value={fontText}>
          {#each TEXT_FONTS as f}<option value={f}>{f}</option>{/each}
        </select>
        <input
          type="text"
          class="font-custom"
          bind:value={fontText}
          on:blur={() => sanitizeFontBlur('fontText')}
          placeholder="Custom..."
          aria-label="Custom text font"
        />
      </div>
      <span class="setting-hint">Font for note content and the editor</span>
    </div>

    <div class="setting-item">
      <label for="font-mono">Monospace Font</label>
      <div class="font-row">
        <select id="font-mono" bind:value={fontMono}>
          {#each MONO_FONTS as f}<option value={f}>{f}</option>{/each}
        </select>
        <input
          type="text"
          class="font-custom"
          bind:value={fontMono}
          on:blur={() => sanitizeFontBlur('fontMono')}
          placeholder="Custom..."
          aria-label="Custom monospace font"
        />
      </div>
      <span class="setting-hint">Font for code blocks and monospace content</span>
    </div>
  </div>

  <div class="setting-group">
    <h4>Theme Store</h4>
    <ThemeBrowser
      bind:activeThemePath
      onThemeChange={(path) => {
        activeThemePath = path;
      }}
    />
  </div>

  <hr class="section-divider" />

  <StyleSettings />
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

  .font-row {
    display: flex;
    gap: var(--spacing-xs);
    align-items: center;
  }

  .font-row select {
    flex: 1;
  }

  .font-custom {
    width: 160px;
    padding: 4px 8px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: var(--font-ui-small);
  }
  .section-divider {
    border: none;
    border-top: 1px solid var(--border-color);
    margin: var(--spacing-m) 0;
  }
</style>
