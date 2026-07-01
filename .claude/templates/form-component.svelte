<script lang="ts">
  import Button from '@/components/ui/actions/Button.svelte';
  import { log } from '@/utils/logger';

  // Define form fields with explicit types
  interface FormData {
    name: string;
    // Add more fields as needed
  }

  export let initialValues: Partial<FormData> = {};
  export let onSubmit: (data: FormData) => Promise<void>;
  export let onCancel: (() => void) | undefined = undefined;

  let values: FormData = { name: initialValues.name ?? '', ...initialValues };
  let errors: Partial<Record<keyof FormData, string>> = {};
  let isSubmitting = false;

  function validate(): boolean {
    errors = {};
    if (!values.name.trim()) errors.name = 'Name is required';
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!validate()) return;
    isSubmitting = true;
    try {
      await onSubmit(values);
    } catch (err) {
      log.error('Form submission failed', err);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<form class="form" on:submit={handleSubmit} novalidate>
  <div class="form-group">
    <label class="form-label" for="field-name">
      Name <span class="required" aria-hidden="true">*</span>
    </label>
    <input
      id="field-name"
      class="form-input"
      class:error={!!errors.name}
      type="text"
      bind:value={values.name}
      on:blur={validate}
      required
      aria-required="true"
      aria-describedby={errors.name ? 'field-name-error' : undefined}
    />
    {#if errors.name}
      <p id="field-name-error" class="form-error" role="alert">{errors.name}</p>
    {/if}
  </div>

  <!-- Add more form fields here using the same pattern -->

  <div class="form-actions">
    {#if onCancel}
      <Button variant="secondary" type="button" on:click={onCancel} disabled={isSubmitting}>
        Cancel
      </Button>
    {/if}
    <Button variant="primary" type="submit" loading={isSubmitting} disabled={isSubmitting}>
      Save
    </Button>
  </div>
</form>

<style>
  .form { display: flex; flex-direction: column; gap: var(--spacing-m); }
  .form-group { display: flex; flex-direction: column; gap: var(--spacing-xs); }
  .form-label { font-size: var(--font-ui-small); font-weight: var(--font-semibold); color: var(--text-normal); }
  .required { color: var(--color-danger); }
  .form-input {
    padding: var(--form-input-padding-block) var(--form-input-padding-inline);
    background: var(--background-modifier-form-field);
    border: 1px solid var(--border-color);
    border-radius: var(--form-input-border-radius);
    font-size: var(--font-ui-small);
    color: var(--text-normal);
    min-height: 40px;
  }
  .form-input:focus { outline: none; border-color: var(--form-input-focus-border); }
  .form-input.error { border-color: var(--color-danger); }
  .form-error { font-size: var(--font-smallest); color: var(--color-danger); margin: 0; }
  .form-actions { display: flex; justify-content: flex-end; gap: var(--spacing-s); margin-top: var(--spacing-s); }
</style>
