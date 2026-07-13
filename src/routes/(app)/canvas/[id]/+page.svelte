<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { openCanvas } from '@/hubs/canvas/stores/canvas-store.svelte';

  let { data } = $props();

  onMount(async () => {
    if (data.canvasPath) {
      await openCanvas(data.canvasPath);
    }
    goto('/canvas');
  });
</script>
