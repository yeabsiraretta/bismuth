<!-- Slot-based popover container. Consumer must wrap in position:relative.
     Only <slot /> content is injected — no {@html} bindings are permitted. -->
<script lang="ts">
  import { onDestroy } from 'svelte';

  export let placement: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  export let offset: number = 8;
  export let onDismiss: (() => void) | undefined = undefined;

  function handleClickOutside(e: MouseEvent) {
    if (!(e.target as Element).closest('.popover')) {
      onDismiss?.();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onDismiss?.();
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('click', handleClickOutside, true);
    document.addEventListener('keydown', handleKeydown);
  }

  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeydown);
    }
  });
</script>

<div class="popover popover-{placement}" style="--popover-offset: {offset}px" role="dialog">
  <slot />
</div>

<style>
  .popover {
    position: absolute;
    z-index: var(--layer-popover, 100);
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-l);
    min-width: 160px;
  }

  .popover-bottom {
    top: calc(100% + var(--popover-offset));
    left: 0;
  }

  .popover-top {
    bottom: calc(100% + var(--popover-offset));
    left: 0;
  }

  .popover-right {
    left: calc(100% + var(--popover-offset));
    top: 0;
  }

  .popover-left {
    right: calc(100% + var(--popover-offset));
    top: 0;
  }
</style>
