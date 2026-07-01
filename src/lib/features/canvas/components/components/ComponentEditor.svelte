<script lang="ts">
  import { editingComponentId } from '@/features/canvas/stores';
  import { exitComponentEditMode } from '@/features/canvas/stores';

  export let componentName = '';
</script>

{#if $editingComponentId}
  <div class="component-editor-bar">
    <div class="editor-breadcrumb">
      <span class="breadcrumb-label">Editing Component:</span>
      <span class="breadcrumb-name">{componentName}</span>
    </div>
    <button class="done-btn" on:click={exitComponentEditMode}> Done </button>
  </div>
{/if}

<style>
  .component-editor-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    z-index: 100;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .editor-breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .breadcrumb-label {
    font-size: 12px;
    opacity: 0.8;
  }

  .breadcrumb-name {
    font-size: 13px;
    font-weight: 600;
  }

  .done-btn {
    padding: 4px 16px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: var(--radius-s);
    color: var(--text-on-accent);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
  }

  .done-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }
</style>
