<script lang="ts">
  /**
   * Searchable command palette overlay triggered by keyboard shortcut.
   * Supports arrow-key navigation and focus trapping.
   * @component
   */
  import {
    isPaletteOpen,
    closePalette,
    getPaletteQuery,
    setPaletteQuery,
    searchCommands,
    executeCommand,
  } from '@/hubs/core/stores/command-store.svelte';
  import { createFocusTrap, type FocusTrapInstance } from '@/utils/focus-trap';

  let open = $derived(isPaletteOpen());
  let query = $derived(getPaletteQuery());
  let results = $derived(searchCommands(query));
  let selectedIdx = $state(0);
  let inputEl: HTMLInputElement | undefined = $state();
  let paletteEl: HTMLDivElement | undefined = $state();
  let trap: FocusTrapInstance | null = null;

  $effect(() => {
    if (open && paletteEl) {
      trap = createFocusTrap(paletteEl, {
        initialFocus: inputEl ?? null,
        returnFocus: true,
        onEscape: closePalette,
      });
      trap.activate();
      selectedIdx = 0;
    } else if (trap) {
      trap.deactivate();
      trap = null;
    }
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closePalette();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIdx = Math.min(selectedIdx + 1, results.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIdx = Math.max(selectedIdx - 1, 0);
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      e.preventDefault();
      void executeCommand(results[selectedIdx].id);
      closePalette();
    }
  }
</script>

{#if open}
  <div class="palette-overlay" onclick={closePalette} role="presentation">
    <div
      bind:this={paletteEl}
      class="palette"
      onclick={(e) => e.stopPropagation()}
      onkeydown={handleKeydown}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      tabindex="-1"
    >
      <input
        bind:this={inputEl}
        type="text"
        class="palette-input"
        placeholder="Type a command..."
        aria-label="Command palette search"
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls="palette-results"
        aria-activedescendant={results[selectedIdx]
          ? `palette-opt-${results[selectedIdx].id}`
          : undefined}
        autocomplete="off"
        value={query}
        oninput={(e) => {
          setPaletteQuery((e.target as HTMLInputElement).value);
          selectedIdx = 0;
        }}
      />
      <div class="palette-results" id="palette-results" role="listbox" aria-label="Commands">
        {#each results as cmd, i (cmd.id)}
          <button
            class="palette-item"
            class:palette-item-active={i === selectedIdx}
            id="palette-opt-{cmd.id}"
            role="option"
            aria-selected={i === selectedIdx}
            onclick={() => {
              void executeCommand(cmd.id);
              closePalette();
            }}
            onmouseenter={() => (selectedIdx = i)}
          >
            <div class="palette-item-main">
              <span class="palette-item-name">{cmd.name}</span>
              <span class="palette-item-cat">{cmd.category}</span>
            </div>
            {#if cmd.shortcut}
              <span class="palette-item-shortcut">{cmd.shortcut}</span>
            {/if}
          </button>
        {/each}
        {#if results.length === 0}
          <div class="palette-empty">No commands found</div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .palette-overlay {
    position: fixed;
    inset: 0;
    background: oklch(0 0 0 / 0.3);
    display: flex;
    justify-content: center;
    padding-top: 15vh;
    z-index: var(--z-modal);
  }
  .palette {
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-l);
    width: 520px;
    max-height: 400px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: var(--shadow-l);
    animation: palette-in 0.15s ease;
  }
  .palette-input {
    padding: 14px 16px;
    border: none;
    border-bottom: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-size: 0.9rem;
    outline: none;
    font-family: inherit;
  }
  .palette-results {
    flex: 1;
    overflow-y: auto;
    padding: 4px;
  }
  .palette-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: transparent;
    color: var(--color-text);
    font-size: 0.8rem;
    cursor: pointer;
    border-radius: var(--radius-s);
    text-align: left;
    font-family: inherit;
  }
  .palette-item-active {
    background: var(--color-surface-hover);
  }
  .palette-item-main {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .palette-item-name {
    font-weight: 500;
  }
  .palette-item-cat {
    font-size: 0.7rem;
    color: var(--color-text-subtle);
  }
  .palette-item-shortcut {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
    padding: 2px 6px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
  }
  .palette-empty {
    padding: 24px;
    text-align: center;
    color: var(--color-text-subtle);
    font-size: 0.8rem;
  }
  @keyframes palette-in {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
