<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { filteredEntities } from '../../stores/entityStore';
  import { activeStoryId } from '../../stores/storyStore';
  import type { SceneEntity, ChapterEntity } from '../../types/entity';

  let plainText = true;
  let lockLinks = true;
  let focusMode = false;

  $: scenes = ($filteredEntities.filter(e => e.type === 'scene') as unknown as SceneEntity[]);
  $: chapters = ($filteredEntities.filter(e => e.type === 'chapter') as unknown as ChapterEntity[]);
  $: ordered = orderScenes(scenes, chapters);
  $: totalWords = scenes.reduce((s, sc) => s + (sc.wordCount ?? 0), 0);

  interface ManuscriptBlock { type: 'chapter' | 'scene'; name: string; status?: string; content: string; wordCount: number; }

  function orderScenes(sc: SceneEntity[], ch: ChapterEntity[]): ManuscriptBlock[] {
    const blocks: ManuscriptBlock[] = [];
    const chOrder = new Map(ch.map((c, i) => [c.id, i]));
    const sorted = [...sc].sort((a, b) => {
      const ca = chOrder.get(a.chapterId ?? '') ?? 999;
      const cb = chOrder.get(b.chapterId ?? '') ?? 999;
      return ca !== cb ? ca - cb : a.sortOrder - b.sortOrder;
    });
    let currentChapter = '';
    for (const scene of sorted) {
      const chap = ch.find(c => c.id === scene.chapterId);
      if (chap && chap.name !== currentChapter) {
        currentChapter = chap.name;
        blocks.push({ type: 'chapter', name: currentChapter, content: '', wordCount: 0 });
      }
      blocks.push({
        type: 'scene', name: scene.name, status: scene.status,
        content: scene.synopsis ?? scene.description ?? '',
        wordCount: scene.wordCount ?? 0,
      });
    }
    return blocks;
  }

  function cleanText(text: string): string {
    if (!plainText) return text;
    return text.replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, '$1').replace(/#[\w-]+/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  }

  const STATUS_COLORS: Record<string, string> = {
    outline: '#6b7280', draft: '#3b82f6', revision: '#f59e0b', final: '#10b981', cut: '#ef4444',
  };
</script>

<div class="ms-view" class:focus={focusMode}>
  <div class="ms-toolbar">
    <h3>Manuscript</h3>
    <div class="ms-toggles">
      <label class="ms-toggle"><input type="checkbox" bind:checked={plainText} /> Plain Text</label>
      <label class="ms-toggle"><input type="checkbox" bind:checked={lockLinks} /> Lock Links</label>
      <button class="ms-focus-btn" class:active={focusMode} on:click={() => { focusMode = !focusMode; }} title="Focus Mode">
        <Icon name="eye" size={14} />
      </button>
    </div>
  </div>

  <div class="ms-content" class:lock-links={lockLinks}>
    {#each ordered as block, i (i)}
      {#if block.type === 'chapter'}
        <div class="ms-chapter-divider">
          <span class="ms-chapter-name">{block.name}</span>
        </div>
      {:else}
        <div class="ms-scene-block">
          <div class="ms-scene-header">
            <span class="ms-scene-title">{block.name}</span>
            {#if block.status}
              <span class="ms-scene-badge" style="background: {STATUS_COLORS[block.status] ?? '#666'}">{block.status}</span>
            {/if}
          </div>
          <div class="ms-scene-prose">{cleanText(block.content)}</div>
        </div>
      {/if}
    {/each}

    {#if ordered.length === 0}
      <div class="ms-empty">
        <Icon name="file-text" size={28} />
        <p>No scenes to display. Create scenes in the Entity panel.</p>
      </div>
    {/if}
  </div>

  <div class="ms-footer">
    <span>{scenes.length} scenes</span>
    <span>{totalWords.toLocaleString()} words</span>
    <span>~{Math.ceil(totalWords / 250)} min read</span>
  </div>
</div>

<style>
  .ms-view { display: flex; flex-direction: column; height: 100%; transition: filter 0.3s; }
  .ms-view.focus { filter: none; }
  .ms-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid var(--background-modifier-border, #333); }
  .ms-toolbar h3 { margin: 0; font-size: 14px; }
  .ms-toggles { display: flex; align-items: center; gap: 10px; }
  .ms-toggle { display: flex; align-items: center; gap: 4px; font-size: 11px; cursor: pointer; }
  .ms-focus-btn { border: none; background: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 4px; }
  .ms-focus-btn.active { background: var(--interactive-accent, #7c3aed); color: #fff; }
  .ms-content { flex: 1; overflow-y: auto; padding: 20px; max-width: 700px; margin: 0 auto; width: 100%; }
  .ms-content.lock-links :global(a) { pointer-events: none; }
  .ms-chapter-divider { text-align: center; padding: 24px 0 12px; border-top: 2px solid var(--background-modifier-border, #444); margin-top: 20px; }
  .ms-chapter-name { font-size: 18px; font-weight: 700; letter-spacing: 0.5px; }
  .ms-scene-block { margin-bottom: 24px; }
  .ms-scene-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .ms-scene-title { font-size: 14px; font-weight: 600; cursor: pointer; }
  .ms-scene-title:hover { text-decoration: underline; }
  .ms-scene-badge { padding: 1px 8px; border-radius: 8px; font-size: 10px; color: #fff; }
  .ms-scene-prose { font-size: 14px; line-height: 1.7; white-space: pre-wrap; }
  .ms-footer { display: flex; gap: 16px; padding: 8px 14px; border-top: 1px solid var(--background-modifier-border, #333); font-size: 11px; opacity: 0.6; }
  .ms-empty { text-align: center; padding: 60px 20px; opacity: 0.4; }
  .ms-empty p { margin-top: 8px; font-size: 12px; }
</style>
