<script lang="ts">
  import { writable } from 'svelte/store';
  import type { CanvasAnnotation } from '@/features/canvas/types/design/documentation';

  export let visible = true;

  const annotations = writable<CanvasAnnotation[]>([]);
  let editingId: string | null = null;
  let editText = '';

  function addAnnotation(x: number, y: number) {
    const ann: CanvasAnnotation = {
      id: crypto.randomUUID(),
      x, y,
      content: '',
      color: '#FFEB3B',
      visible: true,
    };
    annotations.update(list => [...list, ann]);
    editingId = ann.id;
    editText = '';
  }

  function saveAnnotation() {
    if (!editingId) return;
    annotations.update(list =>
      list.map(a => a.id === editingId ? { ...a, content: editText } : a)
    );
    editingId = null;
  }

  function deleteAnnotation(id: string) {
    annotations.update(list => list.filter(a => a.id !== id));
  }

  function handleCanvasClick(e: MouseEvent) {
    if (e.detail === 2) {
      addAnnotation(e.offsetX, e.offsetY);
    }
  }
</script>

{#if visible}
  <div class="annotation-layer" on:dblclick={handleCanvasClick} role="presentation">
    {#each $annotations as ann (ann.id)}
      {#if ann.visible}
        <div
          class="annotation-note"
          style="left: {ann.x}px; top: {ann.y}px; background: {ann.color}"
        >
          {#if editingId === ann.id}
            <textarea
              bind:value={editText}
              on:blur={saveAnnotation}
              on:keydown={(e) => e.key === 'Enter' && !e.shiftKey && saveAnnotation()}
              class="edit-area"
            ></textarea>
          {:else}
            <div class="note-content" on:dblclick|stopPropagation={() => { editingId = ann.id; editText = ann.content; }} role="button" tabindex="0" on:keydown={(e) => e.key === 'Enter' && (() => { editingId = ann.id; editText = ann.content; })()}>
              {ann.content || 'Double-click to edit'}
            </div>
          {/if}
          <button class="delete-btn" on:click={() => deleteAnnotation(ann.id)}>×</button>
        </div>
      {/if}
    {/each}
  </div>
{/if}

<style>
  .annotation-layer { position: absolute; inset: 0; pointer-events: none; z-index: 100; }
  .annotation-note { position: absolute; min-width: 120px; max-width: 240px; padding: 8px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); pointer-events: all; font-size: var(--font-size-sm); }
  .note-content { cursor: text; min-height: 20px; white-space: pre-wrap; }
  .edit-area { width: 100%; min-height: 40px; border: none; background: transparent; resize: vertical; font-family: inherit; font-size: inherit; outline: none; }
  .delete-btn { position: absolute; top: 2px; right: 4px; background: none; border: none; cursor: pointer; font-size: 14px; opacity: 0; transition: opacity 0.2s; }
  .annotation-note:hover .delete-btn { opacity: 1; }
</style>
