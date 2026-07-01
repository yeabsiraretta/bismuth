<!--
  Form Skeleton Template
  Usage: Copy this file as a starting point for form/input components.
  Location: src/lib/features/<feature>/components/<Feature>Form.svelte
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  /** Form field values */
  export let values: Record<string, string> = {};
  /** Field validation errors keyed by field name */
  export let errors: Record<string, string> = {};
  /** Whether the form is currently submitting */
  export let submitting = false;
  /** Whether the form is disabled */
  export let disabled = false;

  const dispatch = createEventDispatcher<{
    submit: Record<string, string>;
    cancel: void;
  }>();

  function handleSubmit() {
    if (submitting || disabled) return;
    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      errors = validationErrors;
      return;
    }
    dispatch('submit', values);
  }

  function validate(data: Record<string, string>): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!data.title?.trim()) errs.title = 'Title is required';
    return errs;
  }

  function handleInput(field: string, value: string) {
    values = { ...values, [field]: value };
    if (errors[field]) {
      const { [field]: _, ...rest } = errors;
      errors = rest;
    }
  }
</script>

<form class="form" on:submit|preventDefault={handleSubmit} aria-label="Form">
  <div class="form-field" class:error={!!errors.title}>
    <label for="field-title">Title</label>
    <input
      id="field-title"
      type="text"
      value={values.title ?? ''}
      on:input={(e) => handleInput('title', e.currentTarget.value)}
      {disabled}
      aria-invalid={!!errors.title}
      aria-describedby={errors.title ? 'error-title' : undefined}
    />
    {#if errors.title}
      <span class="form-error" id="error-title" role="alert">{errors.title}</span>
    {/if}
  </div>

  <div class="form-actions">
    <button type="button" class="btn-secondary" on:click={() => dispatch('cancel')} {disabled}>
      Cancel
    </button>
    <button type="submit" class="btn-primary" disabled={submitting || disabled}>
      {submitting ? 'Saving...' : 'Save'}
    </button>
  </div>
</form>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xxs);
  }

  .form-field label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  .form-field input {
    padding: var(--spacing-xs) var(--spacing-s);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    font-size: var(--font-size-base);
  }

  .form-field input:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: -1px;
  }

  .form-field.error input {
    border-color: var(--color-error);
  }

  .form-error {
    font-size: var(--font-size-xs);
    color: var(--color-error);
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-s);
    padding-top: var(--spacing-s);
  }

  .btn-primary,
  .btn-secondary {
    padding: var(--spacing-xs) var(--spacing-m);
    border-radius: var(--radius-s);
    font-size: var(--font-size-sm);
    cursor: pointer;
    border: 1px solid var(--color-border);
  }

  .btn-primary {
    background: var(--color-accent);
    color: white;
    border-color: var(--color-accent);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
  }
</style>
