<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { storyCorkboardNotes, addCorkboardNote, updateCorkboardNote, removeCorkboardNote, convertNoteToScene } from '../../stores/projectStore';
  import { addEntity } from '../../stores/entityStore';
  import type { CorkboardNote, StickyNoteTheme } from '../../types/project';

  let theme: StickyNoteTheme = 'classic';
  let editingId: string | null = null;
  let editText = '';

  const THEME_COLORS: Record<StickyNoteTheme, string[]> = {
    classic: ['#fef08a', '#fca5a5', '#93c5fd', '#86efac', '#fdba74', '#d8b4fe'],
    pastel: ['#fce4ec', '#e8eaf6', '#e0f2f1', '#fff8e1', '#fbe9e7', '#f3e5f5'],
    earth: ['#d7ccc8', '#bcaaa4', '#a1887f', '#8d6e63', '#efebe9', '#c8b6a6'],
    jewel: ['#7c3aed', '#2563eb', '#059669', '#dc2626', '#d97706', '#db2777'],
    neon: ['#facc15', '#f472b6', '#34d399', '#60a5fa', '#fb923c', '#a78bfa'],
    mono: ['#e5e5e5', '#d4d4d4', '#a3a3a3', '#737373', '#f5f5f5', '#404040'],
  };

  function handleAdd() {
    const colors = THEME_COLORS[theme];
    addCorkboardNote('New note', Math.random() * 400 + 50, Math.random() * 300 + 50, colors[Math.floor(Math.random() * colors.length)]);
  }

  function startEdit(note: CorkboardNote) {
    editingId = note.id; editText = note.text;
  }

  function saveEdit(note: CorkboardNote) {
    updateCorkboardNote({ ...note, text: editText });
    editingId = null;
  }

  function handleConvert(note: CorkboardNote) {
    const scene = addEntity('scene', note.text.split('\n')[0] || 'Untitled Scene');
    convertNoteToScene(note.id, scene.id);
  }

  function handleDragEnd(note: CorkboardNote, e: MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).parentElement?.getBoundingClientRect();
    if (!rect) return;
    updateCorkboardNote({ ...note, x: e.clientX - rect.left - 100, y: e.clientY - rect.top - 20 });
  }
</script>

<div class="cb-view">
  <div class="cb-toolbar">
    <h3>Corkboard</h3>
    <div class="cb-toolbar-actions">
      <select class="cb-theme-select" bind:value={theme}>
        <option value="classic">Classic</option>
        <option value="pastel">Pastel</option>
        <option value="earth">Earth</option>
        <option value="jewel">Jewel</option>
        <option value="neon">Neon</option>
        <option value="mono">Mono</option>
      </select>
      <button class="cb-btn-primary" on:click={handleAdd}>
        <Icon name="plus" size={13} /> Add Note
      </button>
    </div>
  </div>

  <div class="cb-canvas">
    {#each $storyCorkboardNotes as note (note.id)}
      <div class="cb-note" class:converted={!!note.convertedToSceneId}
        style="left: {note.x}px; top: {note.y}px; width: {note.width}px; min-height: {note.height}px; background: {note.color};"
        role="note" aria-label="Sticky note">
        {#if note.isImage && note.imagePath}
          <div class="cb-note-image">
            <img src={note.imagePath} alt={note.caption ?? 'Image note'} />
            {#if note.caption}<div class="cb-caption">{note.caption}</div>{/if}
          </div>
        {:else}
          <div class="cb-note-content">
            {#if editingId === note.id}
              <textarea class="cb-note-edit" bind:value={editText} on:blur={() => saveEdit(note)} on:keydown={(e) => e.key === 'Escape' && (editingId = null)}></textarea>
            {:else}
              <div class="cb-note-text" on:dblclick={() => startEdit(note)} role="textbox" tabindex="0" aria-label="Note text" on:keydown={(e) => e.key === 'Enter' && startEdit(note)}>{note.text}</div>
            {/if}
          </div>
        {/if}
        <div class="cb-note-actions">
          {#if !note.convertedToSceneId}
            <button class="cb-action" on:click={() => handleConvert(note)} title="Convert to scene">
              <Icon name="arrow-right" size={11} />
            </button>
          {:else}
            <span class="cb-converted-badge">Scene</span>
          {/if}
          <button class="cb-action cb-delete" on:click={() => removeCorkboardNote(note.id)} title="Delete">
            <Icon name="x" size={11} />
          </button>
        </div>
      </div>
    {/each}

    {#if $storyCorkboardNotes.length === 0}
      <div class="cb-empty">
        <Icon name="edit-3" size={28} />
        <p>Your corkboard is empty. Add sticky notes to brainstorm ideas, then convert them into scenes when ready.</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .cb-view { display: flex; flex-direction: column; height: 100%; }
  .cb-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid var(--background-modifier-border, #333); }
  .cb-toolbar h3 { margin: 0; font-size: 14px; }
  .cb-toolbar-actions { display: flex; gap: 8px; align-items: center; }
  .cb-theme-select { padding: 4px 6px; border: 1px solid var(--background-modifier-border, #444); border-radius: 4px; background: var(--background-primary); color: var(--text-normal); font-size: 11px; }
  .cb-btn-primary { display: flex; align-items: center; gap: 4px; padding: 5px 10px; border: none; border-radius: 4px; background: var(--interactive-accent, #7c3aed); color: #fff; cursor: pointer; font-size: 12px; }
  .cb-canvas { flex: 1; position: relative; overflow: auto; background: repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(255,255,255,0.03) 19px, rgba(255,255,255,0.03) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(255,255,255,0.03) 19px, rgba(255,255,255,0.03) 20px); min-height: 400px; }
  .cb-note { position: absolute; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: grab; font-size: 12px; color: #333; display: flex; flex-direction: column; }
  .cb-note:active { cursor: grabbing; box-shadow: 0 4px 16px rgba(0,0,0,0.4); z-index: 10; }
  .cb-note.converted { opacity: 0.6; }
  .cb-note-content { flex: 1; padding: 10px; }
  .cb-note-text { white-space: pre-wrap; word-break: break-word; cursor: text; min-height: 40px; }
  .cb-note-edit { width: 100%; min-height: 80px; border: none; background: transparent; color: #333; font-size: 12px; resize: none; outline: none; }
  .cb-note-image img { width: 100%; border-radius: 4px 4px 0 0; object-fit: cover; max-height: 150px; }
  .cb-caption { padding: 6px 10px; font-size: 10px; }
  .cb-note-actions { display: flex; justify-content: flex-end; gap: 2px; padding: 2px 4px; opacity: 0; transition: opacity 0.15s; }
  .cb-note:hover .cb-note-actions { opacity: 1; }
  .cb-action { border: none; background: rgba(0,0,0,0.1); border-radius: 3px; padding: 2px 4px; cursor: pointer; color: #555; }
  .cb-action:hover { background: rgba(0,0,0,0.2); }
  .cb-delete:hover { color: #dc2626; }
  .cb-converted-badge { font-size: 9px; padding: 1px 6px; border-radius: 6px; background: rgba(0,0,0,0.15); }
  .cb-empty { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0.4; text-align: center; padding: 20px; }
  .cb-empty p { margin-top: 8px; font-size: 12px; max-width: 280px; color: var(--text-normal); }
</style>
