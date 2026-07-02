<script lang="ts">
  export let value: string = '';
  export let placeholder: string = '';
  export let type: 'text' | 'password' | 'email' | 'search' = 'text';
  export let disabled: boolean = false;
  export let error: string = '';
  export let size: 'sm' | 'md' | 'lg' = 'md';

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    value = target.value;
  }
</script>

<div class="input-wrapper" class:has-error={error}>
  <input
    {type}
    {placeholder}
    {disabled}
    {value}
    on:input={handleInput}
    on:change
    on:focus
    on:blur
    on:keydown
    class="input"
    class:input-sm={size === 'sm'}
    class:input-md={size === 'md'}
    class:input-lg={size === 'lg'}
    class:input-error={error}
  />
  {#if error}
    <span class="error-message">{error}</span>
  {/if}
</div>

<style>
  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .input {
    width: 100%;
    font-family: var(--font-text);
    color: var(--text-normal);
    background-color: var(--background-modifier-form-field);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    transition: all var(--transition-fast);
    outline: none;
  }

  .input:hover:not(:disabled) {
    background-color: var(--background-modifier-form-field-highlighted);
  }

  .input:focus {
    border-color: var(--interactive-accent);
    background-color: var(--background-modifier-form-field-highlighted);
  }

  .input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .input-sm {
    padding: var(--spacing-xs) var(--spacing-s);
    font-size: var(--font-smaller);
  }

  .input-md {
    padding: var(--spacing-s) var(--spacing-m);
    font-size: var(--font-ui-medium);
  }

  .input-lg {
    padding: var(--spacing-m) var(--spacing-l);
    font-size: var(--font-ui-large);
  }

  .input-error {
    border-color: var(--text-error);
  }

  .error-message {
    font-size: var(--font-smaller);
    color: var(--text-error);
  }
</style>
