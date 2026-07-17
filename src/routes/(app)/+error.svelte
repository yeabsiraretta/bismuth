<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { getRuntimeError, type RuntimeErrorRecord } from '@/utils/log/runtime-errors';

  let {
    error: renderError,
  }: {
    error?: { message: string; code?: string; details?: string; source?: string; timestamp?: string };
  } = $props();

  const STATUS_LABELS: Record<number, string> = {
    400: 'Bad Request',
    403: 'Forbidden',
    404: 'Page Not Found',
    500: 'Internal Error',
  };

  let activeError = $derived(renderError ?? page.error);
  let statusLabel = $derived(STATUS_LABELS[page.status] ?? 'Something went wrong');
  let persistedError = $derived<RuntimeErrorRecord | null>(
    activeError?.code ? getRuntimeError(activeError.code) : null
  );
  let diagnostics = $derived(activeError?.details ?? persistedError?.details);
  let errorSource = $derived(activeError?.source ?? persistedError?.source);
  let errorTimestamp = $derived(activeError?.timestamp ?? persistedError?.timestamp);

  async function copyDiagnostics() {
    if (!diagnostics) return;
    await navigator.clipboard.writeText(diagnostics);
  }
</script>

<div class="app-error">
  <div class="app-error-card">
    <span class="app-error-code">{page.status}</span>
    <h1 class="app-error-title">{statusLabel}</h1>
    <p class="app-error-message">{activeError?.message ?? 'An unexpected error occurred.'}</p>
    {#if activeError?.code}
      <p class="app-error-id">Reference: {activeError.code}</p>
    {/if}
    {#if diagnostics}
      <details class="app-error-details">
        <summary>Diagnostics</summary>
        <div class="app-error-meta">
          {#if errorSource}<span>Source: {errorSource}</span>{/if}
          {#if errorTimestamp}<span>Time: {errorTimestamp}</span>{/if}
          <span>Status: {page.status}</span>
        </div>
        <pre>{diagnostics}</pre>
        <button class="app-error-copy" onclick={copyDiagnostics}>Copy diagnostics</button>
      </details>
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
  .app-error-details {
    margin: 0 0 18px;
    padding: 10px 12px;
    text-align: left;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-m);
    background: var(--color-surface);
  }
  .app-error-details summary {
    cursor: pointer;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--color-text);
  }
  .app-error-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 10px 0 8px;
    font-size: 0.62rem;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
  }
  .app-error-details pre {
    margin: 0 0 8px;
    padding: 10px;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 0.62rem;
    line-height: 1.45;
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text-muted);
    max-height: 220px;
    overflow: auto;
  }
  .app-error-copy {
    padding: 6px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--color-text);
    font-size: 0.66rem;
    font-family: inherit;
    cursor: pointer;
  }
  .app-error-copy:hover {
    border-color: var(--color-accent);
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
