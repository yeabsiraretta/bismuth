<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import {
    settingsBlocks,
    cssSettingsLoading,
    scanStyleSettings,
    getSettingValue,
    setSettingValue,
    getThemedColorValue,
    setThemedColorValue,
    resetSetting,
    resetAllCSSSettings,
  } from '@/stores/style/cssSettings';
  import type { StyleSetting, SettingsBlock } from '@/types/style-settings';
  import { openConfirm } from '@/stores/confirm';

  let collapsedSections: Record<string, boolean> = {};

  onMount(() => {
    scanStyleSettings();
  });

  function toggleSection(id: string) {
    collapsedSections[id] = !collapsedSections[id];
    collapsedSections = collapsedSections;
  }

  function handleResetAll() {
    openConfirm({
      title: 'Reset CSS Settings',
      message: 'Reset all CSS style settings to defaults?',
      confirmLabel: 'Reset',
      variant: 'danger',
      onConfirm: () => {
        resetAllCSSSettings();
      },
    });
  }

  function getCurrentValue(block: SettingsBlock, setting: StyleSetting): string | number | boolean {
    return getSettingValue(block.id, setting);
  }
</script>

<div class="css-settings-panel">
  <div class="settings-header">
    <h3>CSS Style Settings</h3>
    <div class="header-actions">
      <button class="action-btn" on:click={() => scanStyleSettings()} title="Rescan CSS files">
        <Icon name="refresh-cw" size={14} />
      </button>
      <button class="action-btn danger" on:click={handleResetAll} title="Reset all">
        <Icon name="x" size={14} />
      </button>
    </div>
  </div>

  {#if $cssSettingsLoading}
    <p class="loading-msg">Scanning CSS files...</p>
  {:else if $settingsBlocks.length === 0}
    <div class="empty-state">
      <p>No <code>@settings</code> blocks found.</p>
      <p class="hint">
        Add CSS files with <code>/* @settings ... */</code> blocks to your vault's
        <code>.bismuth/snippets/</code>
        or <code>.bismuth/themes/</code> directory.
      </p>
    </div>
  {:else}
    {#each $settingsBlocks as block (block.id)}
      <div class="settings-block">
        <button class="block-header" on:click={() => toggleSection(block.id)}>
          <Icon name={collapsedSections[block.id] ? 'chevron-right' : 'chevron-down'} size={14} />
          <span class="block-name">{block.name}</span>
          <span class="block-source">{block.source}</span>
        </button>

        {#if !collapsedSections[block.id]}
          <div class="block-settings">
            {#each block.settings as setting (setting.id)}
              {#if setting.type === 'heading'}
                <div class="setting-heading" style="padding-left: {(setting.level - 1) * 12}px">
                  <span>{setting.title}</span>
                  {#if setting.description}<p class="setting-desc">{setting.description}</p>{/if}
                </div>
              {:else if setting.type === 'info-text'}
                <div class="setting-info">
                  <p class="info-title">{setting.title}</p>
                  {#if setting.description}<p class="info-desc">{setting.description}</p>{/if}
                </div>
              {:else if setting.type === 'class-toggle'}
                <div class="setting-row">
                  <div class="setting-label">
                    <span>{setting.title}</span>
                    {#if setting.description}<p class="setting-desc">{setting.description}</p>{/if}
                  </div>
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      checked={!!getCurrentValue(block, setting)}
                      on:change={(e) => setSettingValue(block.id, setting, e.currentTarget.checked)}
                    />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              {:else if setting.type === 'class-select'}
                <div class="setting-row">
                  <div class="setting-label">
                    <span>{setting.title}</span>
                    {#if setting.description}<p class="setting-desc">{setting.description}</p>{/if}
                  </div>
                  <select
                    value={String(getCurrentValue(block, setting))}
                    on:change={(e) => setSettingValue(block.id, setting, e.currentTarget.value)}
                  >
                    {#if setting.allow_empty}<option value="none">None</option>{/if}
                    {#each setting.options as opt}
                      <option value={opt.value}>{opt.label}</option>
                    {/each}
                  </select>
                </div>
              {:else if setting.type === 'variable-text'}
                <div class="setting-row">
                  <div class="setting-label">
                    <span>{setting.title}</span>
                    {#if setting.description}<p class="setting-desc">{setting.description}</p>{/if}
                  </div>
                  <div class="setting-control">
                    <input
                      type="text"
                      class="text-input"
                      value={String(getCurrentValue(block, setting))}
                      on:change={(e) => setSettingValue(block.id, setting, e.currentTarget.value)}
                      placeholder={setting.default}
                    />
                    <button
                      class="reset-btn"
                      on:click={() => resetSetting(block.id, setting)}
                      title="Reset"
                    >
                      <Icon name="x" size={12} />
                    </button>
                  </div>
                </div>
              {:else if setting.type === 'variable-number'}
                <div class="setting-row">
                  <div class="setting-label">
                    <span>{setting.title}</span>
                    {#if setting.description}<p class="setting-desc">{setting.description}</p>{/if}
                  </div>
                  <div class="setting-control">
                    <input
                      type="number"
                      class="number-input"
                      value={Number(getCurrentValue(block, setting))}
                      on:change={(e) =>
                        setSettingValue(block.id, setting, Number(e.currentTarget.value))}
                    />
                    {#if setting.format}<span class="format-suffix">{setting.format}</span>{/if}
                    <button
                      class="reset-btn"
                      on:click={() => resetSetting(block.id, setting)}
                      title="Reset"
                    >
                      <Icon name="x" size={12} />
                    </button>
                  </div>
                </div>
              {:else if setting.type === 'variable-number-slider'}
                <div class="setting-row">
                  <div class="setting-label">
                    <span>{setting.title}</span>
                    {#if setting.description}<p class="setting-desc">{setting.description}</p>{/if}
                  </div>
                  <div class="setting-control slider-control">
                    <input
                      type="range"
                      min={setting.min}
                      max={setting.max}
                      step={setting.step}
                      value={Number(getCurrentValue(block, setting))}
                      on:input={(e) =>
                        setSettingValue(block.id, setting, Number(e.currentTarget.value))}
                    />
                    <span class="slider-value"
                      >{getCurrentValue(block, setting)}{setting.format || ''}</span
                    >
                    <button
                      class="reset-btn"
                      on:click={() => resetSetting(block.id, setting)}
                      title="Reset"
                    >
                      <Icon name="x" size={12} />
                    </button>
                  </div>
                </div>
              {:else if setting.type === 'variable-select'}
                <div class="setting-row">
                  <div class="setting-label">
                    <span>{setting.title}</span>
                    {#if setting.description}<p class="setting-desc">{setting.description}</p>{/if}
                  </div>
                  <div class="setting-control">
                    <select
                      value={String(getCurrentValue(block, setting))}
                      on:change={(e) => setSettingValue(block.id, setting, e.currentTarget.value)}
                    >
                      {#each setting.options as opt}
                        <option value={opt.value}>{opt.label}</option>
                      {/each}
                    </select>
                    <button
                      class="reset-btn"
                      on:click={() => resetSetting(block.id, setting)}
                      title="Reset"
                    >
                      <Icon name="x" size={12} />
                    </button>
                  </div>
                </div>
              {:else if setting.type === 'variable-color'}
                <div class="setting-row">
                  <div class="setting-label">
                    <span>{setting.title}</span>
                    {#if setting.description}<p class="setting-desc">{setting.description}</p>{/if}
                  </div>
                  <div class="setting-control">
                    <input
                      type="color"
                      value={String(getCurrentValue(block, setting)) || '#000000'}
                      on:input={(e) => setSettingValue(block.id, setting, e.currentTarget.value)}
                    />
                    <span class="color-value">{getCurrentValue(block, setting)}</span>
                    <button
                      class="reset-btn"
                      on:click={() => resetSetting(block.id, setting)}
                      title="Reset"
                    >
                      <Icon name="x" size={12} />
                    </button>
                  </div>
                </div>
              {:else if setting.type === 'variable-themed-color'}
                <div class="setting-row themed-color-row">
                  <div class="setting-label">
                    <span>{setting.title}</span>
                    {#if setting.description}<p class="setting-desc">{setting.description}</p>{/if}
                  </div>
                  <div class="themed-pickers">
                    <div class="theme-picker">
                      <span class="theme-label">Light</span>
                      <input
                        type="color"
                        value={getThemedColorValue(setting.id, 'light', setting['default-light'])}
                        on:input={(e) =>
                          setThemedColorValue(setting, 'light', e.currentTarget.value)}
                      />
                    </div>
                    <div class="theme-picker">
                      <span class="theme-label">Dark</span>
                      <input
                        type="color"
                        value={getThemedColorValue(setting.id, 'dark', setting['default-dark'])}
                        on:input={(e) =>
                          setThemedColorValue(setting, 'dark', e.currentTarget.value)}
                      />
                    </div>
                    <button
                      class="reset-btn"
                      on:click={() => resetSetting(block.id, setting)}
                      title="Reset"
                    >
                      <Icon name="x" size={12} />
                    </button>
                  </div>
                </div>
              {/if}
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  {/if}
</div>

<style>
  .css-settings-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .settings-header h3 {
    font-size: var(--font-ui-medium);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
    margin: 0;
  }
  .header-actions {
    display: flex;
    gap: 4px;
  }
  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: none;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s;
  }
  .action-btn:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }
  .action-btn.danger:hover {
    color: var(--text-error);
  }
  .loading-msg {
    font-size: var(--font-ui-menu);
    color: var(--text-muted);
  }
  .empty-state {
    padding: 16px;
    text-align: center;
    color: var(--text-muted);
    font-size: var(--font-ui-menu);
  }
  .empty-state code {
    background: var(--background-modifier-code);
    padding: 2px 4px;
    border-radius: var(--radius-xs);
    font-size: var(--font-ui-smaller);
  }
  .hint {
    font-size: var(--font-ui-smaller);
    margin-top: 8px;
  }
  .settings-block {
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    overflow: hidden;
  }
  .block-header {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 12px;
    background: var(--background-secondary);
    border: none;
    cursor: pointer;
    text-align: left;
    color: var(--text-normal);
    font-size: var(--font-ui-menu);
    font-weight: var(--font-medium);
  }
  .block-header:hover {
    background: var(--interactive-hover);
  }
  .block-name {
    flex: 1;
  }
  .block-source {
    font-size: var(--font-ui-badge);
    color: var(--text-faint);
    font-family: var(--font-monospace);
  }
  .block-settings {
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .setting-heading {
    font-size: var(--font-ui-menu);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
    padding: 6px 0 2px;
    border-bottom: 1px solid var(--border-color);
  }
  .setting-info {
    padding: 8px;
    background: var(--background-modifier-info);
    border-radius: var(--radius-s);
    font-size: var(--font-ui-smaller);
  }
  .info-title {
    font-weight: var(--font-medium);
    margin: 0;
    color: var(--text-normal);
  }
  .info-desc {
    margin: 4px 0 0;
    color: var(--text-muted);
  }
  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 4px 0;
    min-height: 32px;
  }
  .setting-label {
    flex: 1;
    min-width: 0;
  }
  .setting-label span {
    font-size: var(--font-ui-menu);
    color: var(--text-normal);
    display: block;
  }
  .setting-desc {
    font-size: var(--font-ui-badge);
    color: var(--text-muted);
    margin: 2px 0 0;
  }
  .setting-control {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .slider-control {
    gap: 8px;
  }
  .slider-control input[type='range'] {
    width: 100px;
  }
  .slider-value {
    font-size: var(--font-ui-smaller);
    font-family: var(--font-monospace);
    color: var(--text-muted);
    min-width: 40px;
  }
  .text-input {
    width: 140px;
    padding: 4px 8px;
    font-size: var(--font-ui-smaller);
    background-color: var(--background-modifier-form-field);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    outline: none;
  }
  .text-input:focus {
    border-color: var(--interactive-accent);
  }
  .number-input {
    width: 70px;
    padding: 4px 8px;
    font-size: var(--font-ui-smaller);
    background-color: var(--background-modifier-form-field);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    outline: none;
  }
  .number-input:focus {
    border-color: var(--interactive-accent);
  }
  .format-suffix {
    font-size: var(--font-ui-badge);
    color: var(--text-muted);
  }
  select {
    padding: 4px 8px;
    font-size: var(--font-ui-smaller);
    background-color: var(--background-modifier-form-field);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    cursor: pointer;
  }
  input[type='color'] {
    width: 32px;
    height: 24px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
    padding: 0;
  }
  .color-value {
    font-size: var(--font-ui-badge);
    font-family: var(--font-monospace);
    color: var(--text-muted);
  }
  .reset-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: none;
    border: none;
    border-radius: 4px;
    color: var(--text-faint);
    cursor: pointer;
    transition: all 0.15s;
  }
  .reset-btn:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 36px;
    height: 20px;
  }
  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--background-modifier-border);
    transition: 0.2s;
    border-radius: 20px;
  }
  .toggle-slider:before {
    position: absolute;
    content: '';
    height: 14px;
    width: 14px;
    left: 3px;
    bottom: 3px;
    background-color: var(--text-on-accent, white);
    transition: 0.2s;
    border-radius: 50%;
  }
  .toggle-switch input:checked + .toggle-slider {
    background-color: var(--interactive-accent);
  }
  .toggle-switch input:checked + .toggle-slider:before {
    transform: translateX(16px);
  }
  .themed-pickers {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .theme-picker {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .theme-label {
    font-size: var(--font-ui-xs);
    color: var(--text-faint);
    text-transform: uppercase;
  }
</style>
