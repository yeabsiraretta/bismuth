<script lang="ts">
  import { getActiveNotePath } from '@/hubs/core/stores/vault-store.svelte';
  import {
    extractMetadata,
    buildFrontmatter,
    type NoteMetadata,
  } from '@/hubs/editor/services/metadata-extractor';
  import Panel from '@/ui/panel.svelte';
  import { getCachedContent, updateCachedContent } from '@/hubs/editor/services/file-ops';
  import { writeNote } from '@/sal/note-service';

  interface FmEntry {
    key: string;
    value: string;
  }

  let notePath = $derived(getActiveNotePath());
  let content = $derived(notePath ? (getCachedContent(notePath) ?? '') : '');
  let metadata = $derived(extractMetadata(content));
  let entries = $derived(metadataToEntries(metadata));

  let newKey = $state('');
  let newValue = $state('');

  function metadataToEntries(meta: NoteMetadata): FmEntry[] {
    const result: FmEntry[] = [];
    if (meta.title) result.push({ key: 'title', value: meta.title });
    if (meta.tags.length) result.push({ key: 'tags', value: meta.tags.join(', ') });
    if (meta.aliases.length) result.push({ key: 'aliases', value: meta.aliases.join(', ') });
    if (meta.created) result.push({ key: 'created', value: meta.created });
    if (meta.modified) result.push({ key: 'modified', value: meta.modified });
    for (const [k, v] of Object.entries(meta.custom)) {
      result.push({ key: k, value: typeof v === 'string' ? v : JSON.stringify(v) });
    }
    return result;
  }

  function entriesToMetadata(props: FmEntry[]): NoteMetadata {
    const meta: NoteMetadata = {
      title: '',
      tags: [],
      aliases: [],
      created: '',
      modified: '',
      custom: {},
    };
    for (const p of props) {
      switch (p.key) {
        case 'title':
          meta.title = p.value;
          break;
        case 'tags':
          meta.tags = p.value
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
          break;
        case 'aliases':
          meta.aliases = p.value
            .split(',')
            .map((a) => a.trim())
            .filter(Boolean);
          break;
        case 'created':
          meta.created = p.value;
          break;
        case 'modified':
          meta.modified = p.value;
          break;
        default:
          meta.custom[p.key] = p.value;
      }
    }
    return meta;
  }

  function getBody(src: string): string {
    if (!src.startsWith('---')) return src;
    const end = src.indexOf('---', 3);
    if (end === -1) return src;
    return src.slice(end + 3).replace(/^\n/, '');
  }

  async function save(props: FmEntry[]) {
    if (!notePath) return;
    const body = getBody(content);
    const meta = entriesToMetadata(props);
    const hasContent = props.length > 0;
    const newContent = hasContent ? buildFrontmatter(meta) + '\n' + body : body;
    updateCachedContent(notePath, newContent);
    try {
      await writeNote(notePath, newContent);
    } catch {
      /* browser dev */
    }
  }

  function handleEdit(idx: number, val: string) {
    const updated = entries.map((e, i) => (i === idx ? { ...e, value: val } : e));
    save(updated);
  }

  function handleDelete(idx: number) {
    save(entries.filter((_, i) => i !== idx));
  }

  function handleAdd() {
    const k = newKey.trim();
    if (!k) return;
    save([...entries, { key: k, value: newValue.trim() }]);
    newKey = '';
    newValue = '';
  }
</script>

<Panel title="Properties">
  {#snippet badge()}<span class="panel-badge">{entries.length}</span>{/snippet}
  <div class="props-body">
    {#if !notePath}
      <div class="panel-empty">No note selected</div>
    {:else if entries.length === 0}
      <div class="panel-empty">No frontmatter properties</div>
    {:else}
      <dl class="props-list">
        {#each entries as entry, idx (entry.key)}
          <div class="props-row">
            <dt class="props-key">{entry.key}</dt>
            <dd class="props-value">
              <input
                class="props-input"
                value={entry.value}
                onchange={(e) => handleEdit(idx, (e.target as HTMLInputElement).value)}
              />
            </dd>
            <button
              class="props-delete"
              onclick={() => handleDelete(idx)}
              aria-label="Remove {entry.key}">×</button
            >
          </div>
        {/each}
      </dl>
    {/if}

    {#if notePath}
      <div class="props-add">
        <input
          class="props-add-key"
          placeholder="key"
          bind:value={newKey}
          onkeydown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <input
          class="props-add-val"
          placeholder="value"
          bind:value={newValue}
          onkeydown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button class="props-add-btn" onclick={handleAdd} disabled={!newKey.trim()}>+</button>
      </div>
    {/if}
  </div>
</Panel>

<style>
  .props-body {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }
  .props-list {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .props-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 4px;
    border-radius: var(--radius-s);
  }
  .props-row:hover {
    background: var(--color-surface-hover);
  }
  .props-key {
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--color-text-muted);
    min-width: 60px;
    flex-shrink: 0;
  }
  .props-value {
    flex: 1;
    margin: 0;
    min-width: 0;
  }
  .props-input {
    width: 100%;
    border: 1px solid transparent;
    background: transparent;
    color: var(--color-text);
    font-size: 0.7rem;
    font-family: inherit;
    padding: 2px 4px;
    border-radius: var(--radius-s);
    outline: none;
  }
  .props-input:focus {
    border-color: var(--color-accent);
    background: var(--color-background);
  }
  .props-delete {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.8rem;
    color: var(--color-text-subtle);
    opacity: 0;
    padding: 0 2px;
    flex-shrink: 0;
  }
  .props-row:hover .props-delete {
    opacity: 1;
  }
  .props-delete:hover {
    color: var(--color-error);
  }
  .props-add {
    display: flex;
    gap: 4px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--color-border);
  }
  .props-add-key,
  .props-add-val {
    flex: 1;
    padding: 3px 6px;
    font-size: 0.65rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-family: inherit;
    outline: none;
  }
  .props-add-key:focus,
  .props-add-val:focus {
    border-color: var(--color-accent);
  }
  .props-add-btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
    font-size: 0.8rem;
    flex-shrink: 0;
  }
  .props-add-btn:hover:not(:disabled) {
    background: var(--color-surface-hover);
    border-color: var(--color-accent);
  }
  .props-add-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
