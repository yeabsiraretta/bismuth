<script lang="ts">
  import {
    DEFAULT_OG,
    DEFAULT_TWITTER,
    SITE_DESCRIPTION,
    SITE_NAME,
    SITE_THEME_COLOR,
    SITE_URL,
  } from '@/constants/seo';
  import { dev } from '$app/environment';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import '../app.css';
  import { MetaTags } from 'svelte-meta-tags';
  import SplashScreen from '$lib/ui/splash-screen.svelte';
  import { isFeatureEnabled } from '@/feature-flags/openfeature';
  import { startLogBridge } from '@/utils/log/logger';
  import { installGlobalRuntimeErrorHandlers } from '@/utils/log/runtime-errors';
  import { isTauriAvailable } from '@/utils/platform';

  let { children } = $props();

  let dynamicTitle = $derived(page.data?.title ? `${page.data.title} — ${SITE_NAME}` : SITE_NAME);

  onMount(() => {
    startLogBridge();
    const detachRuntimeErrorHandlers = installGlobalRuntimeErrorHandlers();

    // Register service worker only in web deployments — skip Tauri desktop app
    if (
      'serviceWorker' in navigator &&
      !isTauriAvailable() &&
      isFeatureEnabled('web_service_worker')
    ) {
      navigator.serviceWorker.register('/service-worker.js', {
        type: dev ? 'module' : 'classic',
      });
    }

    return () => {
      detachRuntimeErrorHandlers();
    };
  });
</script>

<MetaTags
  title={dynamicTitle}
  description={SITE_DESCRIPTION}
  canonical={SITE_URL}
  openGraph={DEFAULT_OG}
  twitter={DEFAULT_TWITTER}
  additionalMetaTags={[
    { name: 'application-name', content: SITE_NAME },
    { name: 'theme-color', content: SITE_THEME_COLOR },
    {
      name: 'keywords',
      content: 'PKM, Zettelkasten, knowledge management, notes, markdown, local-first',
    },
    { name: 'author', content: 'Bismuth Team' },
    { name: 'robots', content: 'index, follow' },
  ]}
  additionalLinkTags={[{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]}
/>

<SplashScreen />
{@render children()}
