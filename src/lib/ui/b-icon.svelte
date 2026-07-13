<script lang="ts">
  /**
   * Icon wrapper that resolves a Lucide icon by name from the icon registry.
   * @component
   */
  import { ICON_COMPONENTS } from '@/assets/icon-registry';

  let {
    name,
    size = 16,
    strokeWidth = 1.5,
    class: className = '',
    ...rest
  }: {
    name: string;
    size?: number;
    strokeWidth?: number;
    class?: string;
    [key: string]: unknown;
  } = $props();

  let IconComponent = $derived(ICON_COMPONENTS[name]);
</script>

{#if IconComponent}
  <IconComponent {size} {strokeWidth} class={className} {...rest} />
{/if}
