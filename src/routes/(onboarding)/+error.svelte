<script lang="ts">
  import { page } from '$app/state';
  import { getRuntimeError, type RuntimeErrorRecord } from '@/utils/log/runtime-errors';

  let {
    error: renderError,
  }: {
    error?: { message: string; code?: string; details?: string; source?: string; timestamp?: string };
  } = $props();

  let activeError = $derived(renderError ?? page.error);
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

<div class="onboarding-error">
  <span class="onboarding-error-code">{page.status}</span>
  <h1 class="onboarding-error-title">
    {#if page.status === 404}
      Page Not Found
    {:else}
      Something went wrong
    {/if}
  </h1>
  <p class="onboarding-error-message">{activeError?.message ?? 'An unexpected error occurred.'}</p>
  {#if activeError?.code}
    <p class="onboarding-error-id">Reference: {activeError.code}</p>
  {/if}
  {#if diagnostics}
    <details class="onboarding-error-details">
      <summary>Diagnostics</summary>
      <div class="onboarding-error-meta">
        {#if errorSource}<span>Source: {errorSource}</span>{/if}
        {#if errorTimestamp}<span>Time: {errorTimestamp}</span>{/if}
        <span>Status: {page.status}</span>
      </div>
      <pre>{diagnostics}</pre>
      <button class="onboarding-error-copy" onclick={copyDiagnostics}>Copy diagnostics</button>
    </details>
  {/if}
  <a class="onboarding-error-link" href="/welcome">Back to Welcome</a>
</div>

<style>
  .onboarding-error {
    text-align: center;
    padding: 48px 32px;
  }
  .onboarding-error-code {
    display: block;
    font-size: 3rem;
    font-weight: 800;
    color: var(--color-accent);
    line-height: 1;
    margin-bottom: 8px;
  }
  .onboarding-error-title {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 8px;
  }
  .onboarding-error-message {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin: 0 0 8px;
  }
  .onboarding-error-id {
    font-size: 0.6rem;
    color: var(--color-text-muted);
    font-family: 'JetBrains Mono', monospace;
    margin: 0 0 20px;
    opacity: 0.6;
  }
  .onboarding-error-details {
    margin: 0 auto 20px;
    max-width: 560px;
    padding: 10px 12px;
    text-align: left;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-m);
    background: var(--color-surface);
  }
  .onboarding-error-details summary {
    cursor: pointer;
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--color-text);
  }
  .onboarding-error-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 10px 0 8px;
    font-size: 0.62rem;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
  }
  .onboarding-error-details pre {
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
  .onboarding-error-copy {
    padding: 6px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--color-text);
    font-size: 0.66rem;
    font-family: inherit;
    cursor: pointer;
  }
  .onboarding-error-copy:hover {
    border-color: var(--color-accent);
  }
  .onboarding-error-link {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-accent);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .onboarding-error-link:hover {
    color: var(--color-text);
  }
</style>
