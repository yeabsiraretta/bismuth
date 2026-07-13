<script lang="ts">
  import { goto } from '$app/navigation';
  import { buildDailyNotePath } from '@/hubs/navigator/services/capture-service';
  import { openTab } from '@/hubs/editor/stores/editor-tabs.svelte';
  import { onMount } from 'svelte';

  onMount(() => {
    const dailyPath = buildDailyNotePath();
    const title = dailyPath.split('/').pop()?.replace('.md', '') ?? 'Daily';
    openTab(dailyPath, title);
    goto('/editor');
  });
</script>
