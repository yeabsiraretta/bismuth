<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let { data } = $props();

  onMount(() => {
    const focus = data.focus ? encodeURIComponent(data.focus) : '';
    goto(`/graph?focus=${focus}`);
  });
</script>
