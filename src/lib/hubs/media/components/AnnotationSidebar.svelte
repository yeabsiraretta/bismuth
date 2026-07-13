<script lang="ts">
  import { buildAnnotationDragText } from '@/hubs/media/services/pdf-service';
  import {
    getPdfAnnotations,
    removePdfAnnotation,
    saveAnnotations,
    setActiveAnnotation,
    toggleAnnotationSidebar,
    updatePdfAnnotation,
  } from '@/hubs/media/stores/pdf-store.svelte';
  import type { PdfAnnotation, PdfHighlightColor } from '@/hubs/media/types/pdf-types';

  let {
    filePath,
    highlightColors,
    onGoToPage,
  }: {
    filePath: string;
    highlightColors: PdfHighlightColor[];
    onGoToPage: (page: number) => void;
  } = $props();

  let editingAnnotationId = $state<string | null>(null);
  let editComment = $state('');
  let editTags = $state('');

  const allAnnotations = $derived(getPdfAnnotations());

  function handleAnnotationClick(ann: PdfAnnotation) {
    setActiveAnnotation(ann.id);
    onGoToPage(ann.page);
  }

  function startEditAnnotation(ann: PdfAnnotation) {
    editingAnnotationId = ann.id;
    editComment = ann.comment;
    editTags = ann.tags.join(', ');
  }

  function saveEditAnnotation() {
    if (!editingAnnotationId) return;
    const tags = editTags
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);
    updatePdfAnnotation(editingAnnotationId, { comment: editComment, tags });
    saveAnnotations(filePath, getPdfAnnotations());
    editingAnnotationId = null;
  }

  function cancelEdit() {
    editingAnnotationId = null;
  }

  function deleteAnnotation(id: string) {
    removePdfAnnotation(id);
    saveAnnotations(filePath, getPdfAnnotations());
    if (editingAnnotationId === id) editingAnnotationId = null;
  }

  function handleDragStart(e: globalThis.DragEvent, ann: PdfAnnotation) {
    const notePath = filePath.replace(/\.pdf$/i, '.md');
    const text = buildAnnotationDragText(notePath, ann);
    e.dataTransfer?.setData('text/plain', text);
  }

  function changeAnnotationColor(ann: PdfAnnotation, color: PdfHighlightColor) {
    updatePdfAnnotation(ann.id, { color: color.color, colorName: color.name });
    saveAnnotations(filePath, getPdfAnnotations());
  }
</script>

<aside class="ann-sidebar">
  <div class="ann-header">
    <span class="ann-title">Annotations</span>
    <span class="ann-count">{allAnnotations.length}</span>
    <button class="ann-close" onclick={toggleAnnotationSidebar}>✕</button>
  </div>

  {#if allAnnotations.length === 0}
    <div class="ann-empty">
      <p>No annotations yet</p>
      <p class="ann-empty-hint">Select text and choose a highlight color to annotate</p>
    </div>
  {:else}
    <div class="ann-list">
      {#each allAnnotations as ann (ann.id)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="ann-card" draggable="true" ondragstart={(e) => handleDragStart(e, ann)}>
          <button class="ann-card-header" onclick={() => handleAnnotationClick(ann)}>
            <span class="ann-color-dot" style="background: {ann.color}"></span>
            <span class="ann-page-label">p.{ann.page}</span>
            <span class="ann-type-label">{ann.type}</span>
            <span class="ann-block-id">^{ann.blockId}</span>
          </button>

          <div class="ann-card-body">
            {#if ann.prefix}
              <span class="ann-prefix">{ann.prefix} </span>
            {/if}
            <mark class="ann-highlight" style="background: {ann.color}40">{ann.text}</mark>
            {#if ann.postfix}
              <span class="ann-postfix"> {ann.postfix}</span>
            {/if}
          </div>

          {#if editingAnnotationId === ann.id}
            <div class="ann-edit-form">
              <textarea
                class="ann-edit-comment"
                rows="3"
                placeholder="Add a comment…"
                bind:value={editComment}></textarea>
              <input
                class="ann-edit-tags"
                type="text"
                placeholder="Tags: tag1, tag2"
                bind:value={editTags}
              />
              <div class="ann-edit-colors">
                {#each highlightColors as color (color.name)}
                  <button
                    class="ann-color-btn"
                    class:active={color.name === ann.colorName}
                    style="background: {color.color}"
                    title={color.name}
                    onclick={() => changeAnnotationColor(ann, color)}
                  ></button>
                {/each}
              </div>
              <div class="ann-edit-actions">
                <button class="ann-save-btn" onclick={saveEditAnnotation}>Save</button>
                <button class="ann-cancel-btn" onclick={cancelEdit}>Cancel</button>
                <button class="ann-delete-btn" onclick={() => deleteAnnotation(ann.id)}
                  >Delete</button
                >
              </div>
            </div>
          {:else}
            {#if ann.comment}
              <p class="ann-comment">{ann.comment}</p>
            {/if}
            {#if ann.tags.length > 0}
              <div class="ann-tags">
                {#each ann.tags as tag (tag)}
                  <span class="ann-tag">#{tag}</span>
                {/each}
              </div>
            {/if}
            <button class="ann-edit-btn" onclick={() => startEditAnnotation(ann)}>Edit</button>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</aside>

<style>
  .ann-sidebar {
    width: 280px;
    border-left: 1px solid var(--color-border);
    background: var(--color-surface);
    overflow-y: auto;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
  }
  .ann-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    border-bottom: 1px solid var(--color-border);
  }
  .ann-title {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--color-text);
    flex: 1;
  }
  .ann-count {
    font-size: 0.6rem;
    color: var(--color-text-muted);
    background: var(--color-background);
    padding: 0 5px;
    border-radius: var(--radius-m);
  }
  .ann-close {
    padding: 1px 5px;
    font-size: 0.6rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
  }
  .ann-close:hover {
    background: var(--color-surface-hover);
  }
  .ann-empty {
    padding: 24px 12px;
    text-align: center;
    font-size: 0.7rem;
    color: var(--color-text-muted);
  }
  .ann-empty-hint {
    font-size: 0.6rem;
    margin-top: 4px;
    color: var(--color-text-subtle, var(--color-text-muted));
  }
  .ann-list {
    flex: 1;
    overflow-y: auto;
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ann-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    overflow: hidden;
    cursor: grab;
  }
  .ann-card:active {
    cursor: grabbing;
  }
  .ann-card-header {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 5px 8px;
    border: none;
    background: none;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
  }
  .ann-card-header:hover {
    background: var(--color-surface-hover);
  }
  .ann-color-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .ann-page-label {
    font-size: 0.6rem;
    font-weight: 600;
    color: var(--color-text);
  }
  .ann-type-label {
    font-size: 0.55rem;
    color: var(--color-text-muted);
    text-transform: capitalize;
  }
  .ann-block-id {
    font-size: 0.5rem;
    color: var(--color-text-subtle, var(--color-text-muted));
    margin-left: auto;
    font-family: monospace;
  }
  .ann-card-body {
    padding: 4px 8px 6px;
    font-size: 0.65rem;
    line-height: 1.5;
    color: var(--color-text);
  }
  .ann-prefix,
  .ann-postfix {
    color: var(--color-text-muted);
    font-weight: 600;
  }
  .ann-highlight {
    border-radius: 2px;
    padding: 0 2px;
  }
  .ann-comment {
    padding: 4px 8px;
    font-size: 0.6rem;
    color: var(--color-text-muted);
    line-height: 1.4;
    margin: 0;
    border-top: 1px solid var(--color-border);
  }
  .ann-tags {
    padding: 2px 8px 4px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .ann-tag {
    font-size: 0.55rem;
    color: var(--color-accent);
    background: oklch(from var(--color-accent) l c h / 0.1);
    padding: 1px 5px;
    border-radius: var(--radius-s);
  }
  .ann-edit-btn {
    display: block;
    width: 100%;
    padding: 3px 8px;
    font-size: 0.55rem;
    border: none;
    border-top: 1px solid var(--color-border);
    background: none;
    color: var(--color-text-muted);
    cursor: pointer;
    text-align: center;
    font-family: inherit;
  }
  .ann-edit-btn:hover {
    background: var(--color-surface-hover);
    color: var(--color-text);
  }
  .ann-edit-form {
    padding: 6px 8px;
    border-top: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .ann-edit-comment {
    width: 100%;
    padding: 4px 6px;
    font-size: 0.65rem;
    font-family: inherit;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    color: var(--color-text);
    resize: vertical;
    outline: none;
  }
  .ann-edit-comment:focus {
    border-color: var(--color-accent);
  }
  .ann-edit-tags {
    width: 100%;
    padding: 4px 6px;
    font-size: 0.65rem;
    font-family: inherit;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    color: var(--color-text);
    outline: none;
  }
  .ann-edit-tags:focus {
    border-color: var(--color-accent);
  }
  .ann-edit-colors {
    display: flex;
    gap: 3px;
    flex-wrap: wrap;
  }
  .ann-color-btn {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-radius: var(--radius-s);
    cursor: pointer;
    padding: 0;
  }
  .ann-color-btn:hover {
    border-color: var(--color-text);
  }
  .ann-color-btn.active {
    border-color: var(--color-text);
  }
  .ann-edit-actions {
    display: flex;
    gap: 4px;
  }
  .ann-save-btn,
  .ann-cancel-btn,
  .ann-delete-btn {
    flex: 1;
    padding: 3px 6px;
    font-size: 0.6rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    cursor: pointer;
    font-family: inherit;
    text-align: center;
  }
  .ann-save-btn {
    background: var(--color-accent);
    color: var(--color-background);
    border-color: var(--color-accent);
  }
  .ann-save-btn:hover {
    opacity: 0.9;
  }
  .ann-cancel-btn {
    background: transparent;
    color: var(--color-text);
  }
  .ann-cancel-btn:hover {
    background: var(--color-surface-hover);
  }
  .ann-delete-btn {
    background: transparent;
    color: var(--color-error);
    border-color: var(--color-error);
  }
  .ann-delete-btn:hover {
    background: oklch(from var(--color-error) l c h / 0.1);
  }
</style>
