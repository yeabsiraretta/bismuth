<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import CodeEditor from './CodeEditor.svelte';

  export let code: string = '';
  export let language: string = '';
  export let isOpen: boolean = false;

  const dispatch = createEventDispatcher<{ close: void; save: string }>();

  let editorRef: CodeEditor;
  let editedCode = code;

  $: if (isOpen) editedCode = code;

  function handleSave() {
    const content = editorRef?.getContent() ?? editedCode;
    dispatch('save', content);
    dispatch('close');
  }

  function handleCancel() {
    dispatch('close');
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') handleCancel();
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  }

  function handleContentChange(newContent: string) {
    editedCode = newContent;
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
{#if isOpen}
  <div class="code-modal-overlay" on:click={handleCancel} on:keydown={handleKeydown}>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div class="code-modal" on:click|stopPropagation on:keydown={handleKeydown}>
      <div class="code-modal-header">
        <div class="header-left">
          <Icon name="braces" size={14} />
          <span class="header-title">Edit Code Block</span>
          {#if language}
            <span class="header-lang">{language}</span>
          {/if}
        </div>
        <div class="header-actions">
          <button class="modal-btn save" on:click={handleSave} title="Save (Ctrl+S)">
            <Icon name="save" size={13} />
            Save
          </button>
          <button class="modal-btn" on:click={handleCancel} title="Cancel (Esc)">
            <Icon name="x" size={13} />
          </button>
        </div>
      </div>
      <div class="code-modal-body">
        <CodeEditor
          bind:this={editorRef}
          content={editedCode}
          filePath={language ? `block.${language}` : 'block.txt'}
          onContentChange={handleContentChange}
          on:save={handleSave}
        />
      </div>
    </div>
  </div>
{/if}

<style>
  .code-modal-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(0, 0, 0, 0.5);
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(2px);
  }
  .code-modal {
    width: 80vw; max-width: 900px; height: 70vh;
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-m, 8px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
    display: flex; flex-direction: column; overflow: hidden;
  }
  .code-modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 12px;
    background: var(--background-secondary);
    border-bottom: 1px solid var(--border-color);
  }
  .header-left { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: var(--text-normal); }
  .header-title { font-weight: 600; }
  .header-lang {
    font-size: 0.7rem; padding: 1px 6px; border-radius: 4px;
    background: var(--background-modifier-hover); color: var(--text-muted); font-weight: 500;
  }
  .header-actions { display: flex; align-items: center; gap: 4px; }
  .modal-btn {
    display: flex; align-items: center; gap: 4px;
    padding: 4px 8px; font-size: 0.75rem; border-radius: var(--radius-s, 4px);
    border: 1px solid var(--border-color); background: var(--background-primary);
    color: var(--text-muted); cursor: pointer;
  }
  .modal-btn:hover { background: var(--background-modifier-hover); color: var(--text-normal); }
  .modal-btn.save { background: var(--interactive-accent); color: #fff; border-color: var(--interactive-accent); }
  .modal-btn.save:hover { opacity: 0.9; }
  .code-modal-body { flex: 1; overflow: hidden; }
</style>
