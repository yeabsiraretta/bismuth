<script lang="ts">
  import { goto } from '$app/navigation';
  import { openSettings } from '@/hubs/core/stores/settings-modal.svelte';
  import type { SettingsTab } from '@/hubs/core/types/settings-tabs';
  import { onMount } from 'svelte';

  let { data } = $props();

  onMount(() => {
    openSettings(data.tab as SettingsTab);
    goto('/');
  });
</script>
