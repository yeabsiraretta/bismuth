<script lang="ts">
  import { onMount } from 'svelte';

  export let options: Array<{ value: string; label: string }> = [];
  export let value: string = '';
  export let placeholder: string = 'Select an option';
  export let disabled: boolean = false;
  export let onChange: ((detail: { value: string }) => void) | undefined = undefined;
  let isOpen = false;
  let dropdownElement: HTMLDivElement;
  let selectedIndex = -1;

  $: selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder;

  function toggleDropdown() {
    if (!disabled) {
      isOpen = !isOpen;
      if (isOpen) {
        selectedIndex = options.findIndex((opt) => opt.value === value);
      }
    }
  }

  function selectOption(option: { value: string; label: string }) {
    value = option.value;
    isOpen = false;
    onChange?.({ value: option.value });
  }

  function handleKeydown(event: KeyboardEvent) {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isOpen && selectedIndex >= 0) {
          selectOption(options[selectedIndex]);
        } else {
          toggleDropdown();
        }
        break;
      case 'Escape':
        event.preventDefault();
        isOpen = false;
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          toggleDropdown();
        } else {
          selectedIndex = Math.min(selectedIndex + 1, options.length - 1);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          selectedIndex = Math.max(selectedIndex - 1, 0);
        }
        break;
    }
  }

  function handleClickOutside(event: MouseEvent) {
    if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
      isOpen = false;
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<div class="dropdown" bind:this={dropdownElement}>
  <button
    type="button"
    class="dropdown-trigger"
    class:disabled
    {disabled}
    on:click={toggleDropdown}
    on:keydown={handleKeydown}
  >
    <span class="dropdown-label">{selectedLabel}</span>
    <svg class="dropdown-icon" class:open={isOpen} width="12" height="12" viewBox="0 0 12 12">
      <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none" />
    </svg>
  </button>

  {#if isOpen}
    <div class="dropdown-menu">
      {#each options as option, index}
        <button
          type="button"
          class="dropdown-option"
          class:selected={option.value === value}
          class:highlighted={index === selectedIndex}
          on:click={() => selectOption(option)}
        >
          {option.label}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .dropdown {
    position: relative;
    width: 100%;
  }

  .dropdown-trigger {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-s) var(--spacing-m);
    font-family: var(--font-text);
    font-size: var(--font-ui-medium);
    color: var(--text-normal);
    background-color: var(--background-modifier-form-field);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    cursor: pointer;
    transition: all var(--transition-fast);
    outline: none;
  }

  .dropdown-trigger:hover:not(.disabled) {
    background-color: var(--background-modifier-form-field-highlighted);
  }

  .dropdown-trigger:focus {
    border-color: var(--interactive-accent);
  }

  .dropdown-trigger.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .dropdown-label {
    flex: 1;
    text-align: left;
  }

  .dropdown-icon {
    transition: transform var(--transition-fast);
  }

  .dropdown-icon.open {
    transform: rotate(180deg);
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + var(--spacing-xs));
    left: 0;
    right: 0;
    max-height: 300px;
    overflow-y: auto;
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    box-shadow: var(--shadow-l);
    z-index: var(--layer-popover);
  }

  .dropdown-option {
    width: 100%;
    padding: var(--spacing-s) var(--spacing-m);
    font-family: var(--font-text);
    font-size: var(--font-ui-medium);
    color: var(--text-normal);
    background-color: transparent;
    border: none;
    text-align: left;
    cursor: pointer;
    transition: background-color var(--transition-fast);
  }

  .dropdown-option:hover,
  .dropdown-option.highlighted {
    background-color: var(--interactive-hover);
  }

  .dropdown-option.selected {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
  }
</style>
