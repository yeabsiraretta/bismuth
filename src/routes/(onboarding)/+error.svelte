<script lang="ts">
  import { page } from '$app/state';

  let { error: renderError }: { error?: { message: string; code?: string } } = $props();

  let activeError = $derived(renderError ?? page.error);
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
