<script lang="ts">
  import { PALETTE } from '@/constants/colors';
  import { discoverSnippets, mergeSnippetList } from '@/hubs/core/services/css-snippet-service';
  import { discoverThemes } from '@/hubs/core/services/custom-theme-service';
  import {
    getSelectedTheme,
    setTheme,
    type ThemeMode,
  } from '@/hubs/core/stores/theme-store.svelte';
  import type { AppearanceSettings } from '@/hubs/core/types/settings';
  import SettingRow from '@/ui/settings-controls.svelte';

  let {
    appearance = $bindable(),
  }: {
    appearance: AppearanceSettings;
  } = $props();

  let currentTheme = $derived(getSelectedTheme());

  function handleThemeChange(e: Event) {
    const value = (e.target as HTMLSelectElement).value as ThemeMode;
    setTheme(value);
  }

  const ACCENT_PRESETS = [
    { label: 'Red', color: PALETTE.red },
    { label: 'Blue', color: PALETTE.blue },
    { label: 'Green', color: PALETTE.green },
    { label: 'Amber', color: PALETTE.amber },
    { label: 'Purple', color: PALETTE.purple },
    { label: 'Teal', color: PALETTE.teal },
    { label: 'Indigo', color: PALETTE.indigo },
    { label: 'Pink', color: PALETTE.pink },
    { label: 'Sky', color: PALETTE.sky },
  ];

  const INTERFACE_FONTS = ['Inter Variable', 'system-ui', 'Helvetica Neue', 'Segoe UI', 'Arial'];
  const TEXT_FONTS = [
    'Inter Variable',
    'system-ui',
    'Georgia',
    'Source Serif 4',
    'Times New Roman',
  ];
  const MONO_FONTS = [
    'JetBrains Mono',
    'Fira Code',
    'Cascadia Code',
    'Courier New',
    'Menlo',
    'Consolas',
  ];

  let availableThemes = $state<string[]>([]);
  let themesLoading = $state(false);

  async function refreshThemes() {
    themesLoading = true;
    try {
      availableThemes = await discoverThemes();
    } finally {
      themesLoading = false;
    }
  }

  let snippetsLoading = $state(false);

  async function refreshSnippets() {
    snippetsLoading = true;
    try {
      const files = await discoverSnippets();
      appearance.cssSnippets = mergeSnippetList(appearance.cssSnippets, files);
    } finally {
      snippetsLoading = false;
    }
  }
</script>

<div class="space-y-6">
  <section>
    <h3 class="text-s font-semibold text-text mb-3">Theme</h3>

    <SettingRow
      label="Color scheme"
      hint="Light, dark, or follow system preference"
      id="theme-mode"
    >
      <select id="theme-mode" value={currentTheme} onchange={handleThemeChange}>
        <option value="light">Light</option>
        <option value="auto">Auto (System)</option>
        <option value="dark">Dark</option>
      </select>
    </SettingRow>

    <SettingRow
      label="Custom theme"
      hint="Select a .css file from .bismuth/themes/ (None to disable)"
      id="theme-path"
    >
      <div class="theme-combo">
        <select id="theme-path" bind:value={appearance.activeThemePath} style="min-width:140px">
          <option value="">None</option>
          {#each availableThemes as theme (theme)}
            <option value=".bismuth/themes/{theme}">{theme}</option>
          {/each}
          {#if appearance.activeThemePath && !availableThemes.some((t) => `.bismuth/themes/${t}` === appearance.activeThemePath)}
            <option value={appearance.activeThemePath}>{appearance.activeThemePath}</option>
          {/if}
        </select>
        <button
          class="snippet-refresh"
          onclick={refreshThemes}
          disabled={themesLoading}
          style="margin:0;padding:3px 8px;font-size:0.7rem"
        >
          {themesLoading ? '…' : 'Scan'}
        </button>
      </div>
    </SettingRow>

    <SettingRow
      label="Accent color"
      hint="Primary color for buttons and highlights"
      id="accent-color"
    >
      <div class="accent-row">
        <div class="accent-swatches">
          {#each ACCENT_PRESETS as preset (preset.color)}
            <button
              class="swatch"
              class:swatch-active={appearance.accentColor === preset.color}
              style:background={preset.color}
              title={preset.label}
              onclick={() => (appearance.accentColor = preset.color)}
            ></button>
          {/each}
        </div>
        <input id="accent-color" type="color" bind:value={appearance.accentColor} />
        <span>{appearance.accentColor}</span>
      </div>
    </SettingRow>
  </section>

  <section>
    <h3 class="text-s font-semibold text-text mb-3">Interface</h3>

    <SettingRow
      label="Show status bar"
      hint="Display status information at the bottom"
      id="status-bar"
    >
      <input id="status-bar" type="checkbox" bind:checked={appearance.showStatusBar} />
    </SettingRow>

    <SettingRow
      label="Show scrollbars"
      hint="Display scrollbars in panels and editors"
      id="scrollbars"
    >
      <input id="scrollbars" type="checkbox" bind:checked={appearance.showScrollbars} />
    </SettingRow>

    <SettingRow
      label="Compact mode"
      hint="Reduce spacing for more content on screen"
      id="compact-mode"
    >
      <input id="compact-mode" type="checkbox" bind:checked={appearance.compactMode} />
    </SettingRow>

    <SettingRow
      label="Show sidebar icons"
      hint="Display icons in sidebar navigation"
      id="sidebar-icons"
    >
      <input id="sidebar-icons" type="checkbox" bind:checked={appearance.sidebarShowIcons} />
    </SettingRow>

    <SettingRow
      label="Native window frame"
      hint="Use system window decorations (restart required)"
      id="native-frame"
    >
      <input id="native-frame" type="checkbox" bind:checked={appearance.nativeFrame} />
    </SettingRow>

    <SettingRow
      label="Translucent window"
      hint="Semi-transparent window background (macOS only)"
      id="translucency"
    >
      <input id="translucency" type="checkbox" bind:checked={appearance.translucency} />
    </SettingRow>

    <SettingRow label="UI scale" hint="Scale all UI elements proportionally" id="ui-scale">
      <div class="flex">
        <input
          id="ui-scale"
          type="range"
          bind:value={appearance.uiScale}
          min="75"
          max="150"
          step="5"
        />
        <span>{appearance.uiScale}%</span>
      </div>
    </SettingRow>

    <SettingRow
      label="Interface font size"
      hint="Base size for menus, panels, and labels"
      id="if-size"
    >
      <div class="flex">
        <input
          id="if-size"
          type="range"
          bind:value={appearance.interfaceFontSize}
          min="12"
          max="20"
          step="1"
        />
        <span>{appearance.interfaceFontSize}px</span>
      </div>
    </SettingRow>
  </section>

  <section>
    <h3 class="text-s font-semibold text-text mb-3">Fonts</h3>

    <SettingRow
      label="Interface font"
      hint="Font used for menus, buttons, and labels"
      id="font-interface"
    >
      <select id="font-interface" bind:value={appearance.fontInterface}>
        {#each INTERFACE_FONTS as font (font)}
          <option value={font}>{font}</option>
        {/each}
        {#if !INTERFACE_FONTS.includes(appearance.fontInterface)}
          <option value={appearance.fontInterface}>{appearance.fontInterface}</option>
        {/if}
      </select>
    </SettingRow>

    <SettingRow label="Text font" hint="Font used for note content" id="font-text">
      <select id="font-text" bind:value={appearance.fontText}>
        {#each TEXT_FONTS as font (font)}
          <option value={font}>{font}</option>
        {/each}
        {#if !TEXT_FONTS.includes(appearance.fontText)}
          <option value={appearance.fontText}>{appearance.fontText}</option>
        {/if}
      </select>
    </SettingRow>

    <SettingRow
      label="Monospace font"
      hint="Font used for code blocks and inline code"
      id="font-mono"
    >
      <select id="font-mono" bind:value={appearance.fontMono}>
        {#each MONO_FONTS as font (font)}
          <option value={font}>{font}</option>
        {/each}
        {#if !MONO_FONTS.includes(appearance.fontMono)}
          <option value={appearance.fontMono}>{appearance.fontMono}</option>
        {/if}
      </select>
    </SettingRow>
  </section>

  <section>
    <h3 class="text-s font-semibold text-text mb-3">CSS Snippets</h3>
    <p class="snippet-hint">
      Place <code>.css</code> files in <code>.bismuth/snippets/</code> to customize styles.
    </p>

    {#if appearance.cssSnippets.length > 0}
      <div class="snippet-list">
        {#each appearance.cssSnippets as snippet, i (snippet.name)}
          <label class="snippet-item">
            <input type="checkbox" bind:checked={appearance.cssSnippets[i].enabled} />
            <span class="snippet-name">{snippet.name}</span>
          </label>
        {/each}
      </div>
    {:else}
      <p class="snippet-empty">No snippets found.</p>
    {/if}

    <button class="snippet-refresh" onclick={refreshSnippets} disabled={snippetsLoading}>
      {snippetsLoading ? 'Scanning…' : 'Refresh snippets'}
    </button>
  </section>
</div>

<style>
  .accent-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .accent-swatches {
    display: flex;
    gap: 4px;
  }
  .swatch {
    width: 18px;
    height: 18px;
    border-radius: var(--radius-full);
    border: 2px solid transparent;
    cursor: pointer;
    padding: 0;
    transition: border-color var(--transition-fast);
  }
  .swatch:hover {
    border-color: var(--color-text-muted);
  }
  .swatch-active {
    border-color: var(--color-text);
    box-shadow: 0 0 0 1px var(--color-background);
  }

  .snippet-hint {
    font-size: 0.72rem;
    color: var(--color-text-subtle);
    margin-bottom: 8px;
  }
  .snippet-hint code {
    background: var(--color-surface);
    padding: 1px 4px;
    border-radius: var(--radius-s);
    font-size: 0.7rem;
  }
  .snippet-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
  }
  .snippet-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    font-size: 0.8rem;
    color: var(--color-text);
    cursor: pointer;
  }
  .snippet-name {
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }
  .snippet-empty {
    font-size: 0.75rem;
    color: var(--color-text-subtle);
    margin-bottom: 8px;
  }
  .theme-combo {
    display: flex;
    gap: 4px;
    align-items: center;
  }
  .snippet-refresh {
    padding: 4px 10px;
    font-size: 0.72rem;
    background: var(--color-surface);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    cursor: pointer;
    font-family: inherit;
    transition:
      border-color var(--transition-fast),
      color var(--transition-fast);
  }
  .snippet-refresh:hover {
    border-color: var(--color-accent);
    color: var(--color-text);
  }
  .snippet-refresh:disabled {
    opacity: 0.5;
    pointer-events: none;
  }
</style>
