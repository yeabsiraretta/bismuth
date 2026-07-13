<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';

  let { error: renderError }: { error?: { message: string; code?: string } } = $props();

  const STATUS_LABELS: Record<number, string> = {
    400: 'Bad Request',
    403: 'Forbidden',
    404: 'Page Not Found',
    500: 'Internal Error',
  };

  let activeError = $derived(renderError ?? page.error);
  let statusLabel = $derived(STATUS_LABELS[page.status] ?? 'Something went wrong');
</script>

<div class="app-error">
  <div class="app-error-card">
    <span class="app-error-code">{page.status}</span>
    <h1 class="app-error-title">{statusLabel}</h1>
    <p class="app-error-message">{activeError?.message ?? 'An unexpected error occurred.'}</p>
    {#if activeError?.code}
      <p class="app-error-id">Reference: {activeError.code}</p>
    {/if}
    <div class="app-error-actions">
      <button class="app-error-btn primary" onclick={() => window.history.back()}>Go Back</button>
      <button class="app-error-btn secondary" onclick={() => goto('/')}>Home</button>
      <button class="app-error-btn secondary" onclick={() => goto('/editor')}>Editor</button>
    </div>
  </div>
</div>

<style>
  .app-error {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100%;
    padding: 32px;
  }
  .app-error-card {
    text-align: center;
    max-width: 380px;
  }
  .app-error-code {
    display: block;
    font-size: 3.5rem;
    font-weight: 800;
    color: var(--color-accent);
    line-height: 1;
    margin-bottom: 6px;
    font-variant-numeric: tabular-nums;
  }
  .app-error-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 6px;
  }
  .app-error-message {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin: 0 0 8px;
    line-height: 1.5;
  }
  .app-error-id {
    font-size: 0.6rem;
    color: var(--color-text-muted);
    font-family: 'JetBrains Mono', monospace;
    margin: 0 0 20px;
    opacity: 0.6;
  }
  .app-error-actions {
    display: flex;
    gap: 6px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .app-error-btn {
    padding: 6px 16px;
    font-size: 0.72rem;
    font-weight: 600;
    border-radius: var(--radius-m);
    cursor: pointer;
    font-family: inherit;
    transition: all var(--transition-base);
    border: 1px solid transparent;
  }
  .app-error-btn.primary {
    background: var(--color-accent);
    color: var(--color-background);
    border-color: var(--color-accent);
  }
  .app-error-btn.primary:hover {
    opacity: 0.85;
  }
  .app-error-btn.secondary {
    background: transparent;
    color: var(--color-text-muted);
    border-color: var(--color-border);
  }
  .app-error-btn.secondary:hover {
    border-color: var(--color-accent);
    color: var(--color-text);
  }
</style>
