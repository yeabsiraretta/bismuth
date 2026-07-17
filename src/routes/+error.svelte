<script lang="ts">
  import { page } from '$app/state';
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

<div class="error-page">
  <div class="error-card">
    <span class="error-code">{page.status}</span>
    <h1 class="error-title">{statusLabel}</h1>
    <p class="error-message">{activeError?.message ?? 'An unexpected error occurred.'}</p>
    {#if activeError?.code}
      <p class="error-id">Reference: {activeError.code}</p>
    {/if}
    {#if diagnostics}
      <details class="error-details">
        <summary>Diagnostics</summary>
        <div class="error-meta">
          {#if errorSource}<span>Source: {errorSource}</span>{/if}
          {#if errorTimestamp}<span>Time: {errorTimestamp}</span>{/if}
          <span>Status: {page.status}</span>
        </div>
        <pre>{diagnostics}</pre>
        <button class="error-copy" onclick={copyDiagnostics}>Copy diagnostics</button>
      </details>
    {/if}
    <div class="error-actions">
      <button class="error-btn error-btn-primary" onclick={() => window.history.back()}
        >Go Back</button
      >
      <a class="error-btn error-btn-secondary" href="/">Home</a>
    </div>
  </div>
</div>

<style>
  .error-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 32px;
    background: var(--color-background);
  }
  .error-card {
    text-align: center;
    max-width: 400px;
  }
  .error-code {
    display: block;
    font-size: 4rem;
    font-weight: 800;
    color: var(--color-accent);
    line-height: 1;
    margin-bottom: 8px;
    font-variant-numeric: tabular-nums;
  }
  .error-title {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 8px;
  }
  .error-message {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin: 0 0 12px;
    line-height: 1.5;
  }
  .error-id {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    font-family: 'JetBrains Mono', monospace;
    margin: 0 0 24px;
    opacity: 0.6;
  }
  .error-actions {
    display: flex;
    gap: 8px;
    justify-content: center;
  }
  .error-details {
    margin: 0 0 20px;
    text-align: left;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-m);
    padding: 10px 12px;
    background: var(--color-surface);
  }
  .error-details summary {
    cursor: pointer;
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--color-text);
  }
  .error-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 10px 0 8px;
    font-size: 0.65rem;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
  }
  .error-details pre {
    margin: 0 0 8px;
    padding: 10px;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 0.65rem;
    line-height: 1.45;
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text-muted);
    max-height: 220px;
    overflow: auto;
  }
  .error-copy {
    padding: 6px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--color-text);
    font-size: 0.68rem;
    font-family: inherit;
    cursor: pointer;
  }
  .error-copy:hover {
    border-color: var(--color-accent);
  }
  .error-btn {
    padding: 8px 20px;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: var(--radius-m);
    cursor: pointer;
    font-family: inherit;
    text-decoration: none;
    transition: all var(--transition-base);
    border: 1px solid transparent;
  }
  .error-btn-primary {
    background: var(--color-accent);
    color: var(--color-background);
    border-color: var(--color-accent);
  }
  .error-btn-primary:hover {
    opacity: 0.85;
  }
  .error-btn-secondary {
    background: transparent;
    color: var(--color-text-muted);
    border-color: var(--color-border);
  }
  .error-btn-secondary:hover {
    border-color: var(--color-accent);
    color: var(--color-text);
  }
</style>
