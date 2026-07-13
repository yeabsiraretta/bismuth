<script lang="ts">
  import { goto } from '$app/navigation';
  import { openSettings } from '@/hubs/core/stores/settings-modal.svelte';
  import { onMount } from 'svelte';

  onMount(() => {
    openSettings();
    goto('/');
  });
</script>
