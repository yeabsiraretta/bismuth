<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { themeStore } from '@/services/theme';

  let showDropdown = false;

  function toggleTheme() {
    const currentMode = $themeStore.mode;
    if (currentMode === 'light') {
      themeStore.setMode('dark');
    } else if (currentMode === 'dark') {
      themeStore.setMode('auto');
    } else {
      themeStore.setMode('light');
    }
  }

  function selectMode(mode: 'light' | 'dark' | 'auto') {
    themeStore.setMode(mode);
    showDropdown = false;
  }

  $: icon = $themeStore.mode === 'light' ? 'sun' : $themeStore.mode === 'dark' ? 'moon' : 'monitor';
</script>

<div class="theme-switcher">
  <button
    class="theme-btn"
    on:click={toggleTheme}
    on:contextmenu|preventDefault={() => showDropdown = !showDropdown}
    title="Toggle theme (right-click for options)"
  >
    <Icon name={icon} size={16} />
  </button>

  {#if showDropdown}
    <div class="theme-dropdown">
      <button
        class="theme-option"
        class:active={$themeStore.mode === 'light'}
        on:click={() => selectMode('light')}
      >
        <Icon name="sun" size={14} />
        <span>Light</span>
        {#if $themeStore.mode === 'light'}
          <Icon name="check" size={14} />
        {/if}
      </button>

      <button
        class="theme-option"
        class:active={$themeStore.mode === 'dark'}
        on:click={() => selectMode('dark')}
      >
        <Icon name="moon" size={14} />
        <span>Dark</span>
        {#if $themeStore.mode === 'dark'}
          <Icon name="check" size={14} />
        {/if}
      </button>

      <button
        class="theme-option"
        class:active={$themeStore.mode === 'auto'}
        on:click={() => selectMode('auto')}
      >
        <Icon name="monitor" size={14} />
        <span>Auto</span>
        {#if $themeStore.mode === 'auto'}
          <Icon name="check" size={14} />
        {/if}
      </button>
    </div>
  {/if}
</div>

<svelte:window on:click={() => showDropdown = false} />

<style>
  .theme-switcher {
    position: relative;
  }

  .theme-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .theme-btn:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }

  .theme-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    min-width: 140px;
    background-color: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 4px;
    z-index: 100;
  }

  .theme-option {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 12px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-normal);
    font-size: 13px;
    cursor: pointer;
    transition: background-color 0.15s ease;
    text-align: left;
  }

  .theme-option span {
    flex: 1;
  }

  .theme-option:hover {
    background-color: var(--interactive-hover);
  }

  .theme-option.active {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
  }
</style>
