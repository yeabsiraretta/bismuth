<script lang="ts">
  /**
   * Manages the lifecycle of the pre-rendered `#splash` overlay from
   * `app.html`. Fades it out once the Svelte app has mounted and cancels
   * the fallback removal timer set by the static HTML.
   * @component
   */
  import { onMount } from 'svelte';

  onMount(() => {
    const w = window as unknown as Record<string, unknown>;
    if (w['__splashTimeout']) {
      clearTimeout(w['__splashTimeout'] as number);
    }

    const splash = document.getElementById('splash');
    if (!splash) return;

    splash.classList.add('fade-out');

    const timer = setTimeout(() => {
      splash.remove();
    }, 500);

    return () => clearTimeout(timer);
  });
</script>
