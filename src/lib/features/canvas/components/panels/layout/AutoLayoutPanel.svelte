<script lang="ts">
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ActionButton from '@/components/ui/actions/ActionButton.svelte';
  import { selectedElements, currentCanvas } from '@/features/canvas/stores';
  import { updateElement } from '@/features/canvas/stores';
  import { createAutoLayout } from '@/features/canvas/utils/autoLayout/index';
  import AutoLayoutControls from '@/features/canvas/components/panels/layout/AutoLayoutControls.svelte';
  import type { CanvasElement, AutoLayout } from '@/features/canvas/types';

  $: element = getSelectedFrame($selectedElements, $currentCanvas?.elements ?? []);
  $: autoLayout = element?.properties.autoLayout ?? null;

  function getSelectedFrame(ids: string[], elements: CanvasElement[]): CanvasElement | null {
    if (ids.length !== 1) return null;
    const el = elements.find((e) => e.id === ids[0]);
    if (!el || (el.element_type !== 'frame' && el.element_type !== 'group')) return null;
    return el;
  }

  function enableAutoLayout() {
    if (!element) return;
    const layout = createAutoLayout('vertical', 8, 16);
    updateElement({ ...element, properties: { ...element.properties, autoLayout: layout } });
  }

  function disableAutoLayout() {
    if (!element) return;
    const { autoLayout: _omitted, ...rest } = element.properties;
    void _omitted;
    updateElement({ ...element, properties: rest });
  }

  function updateLayout(updates: Partial<AutoLayout>) {
    if (!element || !autoLayout) return;
    const newLayout = { ...autoLayout, ...updates };
    updateElement({ ...element, properties: { ...element.properties, autoLayout: newLayout } });
  }

  function updatePadding(side: 'top' | 'right' | 'bottom' | 'left', value: number) {
    if (!autoLayout) return;
    const newPadding = { ...autoLayout.padding, [side]: value };
    updateLayout({ padding: newPadding });
  }
</script>

{#if element}
  <div class="auto-layout-panel">
    <PanelHeader icon="layout" title="Auto Layout">
      <svelte:fragment slot="actions">
        {#if autoLayout}
          <ActionButton icon="x" title="Remove auto layout" on:click={disableAutoLayout} />
        {:else}
          <ActionButton icon="plus" title="Add auto layout" on:click={enableAutoLayout} />
        {/if}
      </svelte:fragment>
    </PanelHeader>

    {#if autoLayout}
      <AutoLayoutControls
        {autoLayout}
        onUpdateLayout={updateLayout}
        onUpdatePadding={updatePadding}
      />
    {/if}
  </div>
{/if}

<style>
  .auto-layout-panel {
    border-top: 1px solid var(--border-color);
  }
</style>
