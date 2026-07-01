<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ActionButton from '@/components/ui/actions/ActionButton.svelte';
  import EmptyState from '@/components/ui/feedback/EmptyState.svelte';
  import { activeNote, updateNoteInStore } from '@/stores/vault/vault';
  import { writeNote } from '@/services/vault/vault';
  import { log } from '@/utils/logger';
  import { onMount } from 'svelte';
  import { getAllProperties, getPropertyValues } from '@/services/frontmatter/properties';

  interface NoteProperty {
    key: string;
    value: string;
  }

  let newKey = '';
  let newValue = '';
  let showAddForm = false;
  let keySuggestions: string[] = [];
  let valueSuggestions: string[] = [];
  let showKeySuggestions = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let properties: NoteProperty[] = [];
  let trackedPath = '';

  onMount(async () => {
    keySuggestions = await getAllProperties();
  });

  $: {
    const path = $activeNote?.path ?? '';
    if (path !== trackedPath) {
      trackedPath = path;
      properties = extractProperties($activeNote?.content || '');
    }
  }

  $: if (newKey !== undefined) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      valueSuggestions = newKey.trim()
        ? (await getPropertyValues(newKey)).slice(0, 7)
        : [];
    }, 300);
  }

  $: filteredKeySuggestions = newKey.trim()
    ? keySuggestions.filter(k => k.toLowerCase().includes(newKey.toLowerCase())).slice(0, 7)
    : keySuggestions.slice(0, 7);

  function extractProperties(content: string): NoteProperty[] {
    if (!content.startsWith('---')) return [];
    const end = content.indexOf('---', 3);
    if (end === -1) return [];
    const frontmatter = content.slice(3, end).trim();
    const items: NoteProperty[] = [];
    for (const line of frontmatter.split('\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        items.push({ key: line.slice(0, colonIdx).trim(), value: line.slice(colonIdx + 1).trim() });
      }
    }
    return items;
  }

  function buildFrontmatter(props: NoteProperty[]): string {
    if (props.length === 0) return '';
    return '---\n' + props.map(p => `${p.key}: ${p.value}`).join('\n') + '\n---';
  }

  function getBodyContent(content: string): string {
    if (!content.startsWith('---')) return content;
    const end = content.indexOf('---', 3);
    if (end === -1) return content;
    return content.slice(end + 3).replace(/^\n/, '');
  }

  async function saveProperties(updatedProps: NoteProperty[]) {
    if (!$activeNote) return;
    properties = updatedProps;
    const body = getBodyContent($activeNote.content);
    const fm = buildFrontmatter(updatedProps);
    const newContent = fm ? `${fm}\n${body}` : body;
    try {
      await writeNote($activeNote.path, newContent);
      updateNoteInStore({ ...$activeNote, content: newContent });
    } catch (error) {
      log.error('Failed to save properties', error as Error);
    }
  }

  async function handlePropertyChange(index: number, field: 'key' | 'value', newVal: string) {
    const updated = [...properties];
    updated[index] = { ...updated[index], [field]: newVal };
    await saveProperties(updated);
  }

  async function handleDeleteProperty(index: number) {
    await saveProperties(properties.filter((_, i) => i !== index));
  }

  async function handleAddProperty() {
    if (!newKey.trim()) return;
    await saveProperties([...properties, { key: newKey.trim(), value: newValue.trim() }]);
    newKey = '';
    newValue = '';
    showAddForm = false;
    showKeySuggestions = false;
  }

  function handleAddKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleAddProperty();
    else if (e.key === 'Escape') { showAddForm = false; newKey = ''; newValue = ''; showKeySuggestions = false; }
  }

  function selectKeySuggestion(suggestion: string) {
    newKey = suggestion;
    showKeySuggestions = false;
  }
</script>

<div class="properties-panel">
  <PanelHeader count={properties.length || undefined}>
    <svelte:fragment slot="actions">
      <ActionButton icon="plus" title="Add property" on:click={() => { showAddForm = true; }} />
    </svelte:fragment>
  </PanelHeader>

  <div class="panel-body">

  {#if !$activeNote}
    <EmptyState icon="file-text" title="No note open" description="Open a note to see its properties" />
  {:else}
    <div class="properties-list">
      {#each properties as prop, i}
        <div class="property-row">
          <div class="property-field">
            <input
              class="prop-input prop-key"
              value={prop.key}
              on:blur={(e) => handlePropertyChange(i, 'key', e.currentTarget.value)}
              placeholder="key"
            />
            <button class="prop-delete" on:click={() => handleDeleteProperty(i)} title="Remove property">
              <Icon name="x" size={12} />
            </button>
          </div>
          <input
            class="prop-input prop-value"
            value={prop.value}
            on:blur={(e) => handlePropertyChange(i, 'value', e.currentTarget.value)}
            placeholder="value"
          />
        </div>
      {/each}

      {#if showAddForm}
        <div class="property-row add-row">
          <div class="key-suggest-wrap">
            <input
              class="prop-input prop-key"
              bind:value={newKey}
              on:keydown={handleAddKeydown}
              on:focus={() => (showKeySuggestions = true)}
              on:blur={() => setTimeout(() => (showKeySuggestions = false), 150)}
              placeholder="property name"
            />
            {#if showKeySuggestions && filteredKeySuggestions.length > 0}
              <ul class="suggest-list">
                {#each filteredKeySuggestions as s}
                  <li><button class="suggest-item" on:mousedown|preventDefault={() => selectKeySuggestion(s)}>{s}</button></li>
                {/each}
              </ul>
            {/if}
          </div>
          <input
            class="prop-input prop-value"
            bind:value={newValue}
            on:keydown={handleAddKeydown}
            list="value-suggestions"
            placeholder="value"
          />
          <datalist id="value-suggestions">
            {#each valueSuggestions as v}<option value={v}></option>{/each}
          </datalist>
        </div>
      {/if}

      <button class="add-btn" on:click={() => { showAddForm = true; }}>
        <Icon name="plus" size={14} />
        <span>Add property</span>
      </button>
    </div>
  {/if}
  </div>
</div>

<style>
  .properties-panel { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
  .panel-body { flex: 1; overflow-y: auto; padding: var(--spacing-m); }

  .properties-list { display: flex; flex-direction: column; gap: var(--spacing-xs); }

  .property-row {
    display: flex;
    flex-direction: row;
    gap: var(--spacing-s, 8px);
    padding: 6px 8px;
    border-radius: 4px;
    background: var(--background-secondary);
    align-items: center;
  }

  .prop-input {
    flex: 1;
    min-width: 0;
    padding: 4px 6px;
    border: 1px solid var(--border-color);
    border-radius: 3px;
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: var(--font-ui-smaller);
    outline: none;
    transition: border-color 0.15s;
  }

  .prop-input:focus { border-color: var(--interactive-accent); }
  .prop-key { font-weight: var(--font-semibold); color: var(--text-muted); }
  .prop-value { font-size: var(--font-ui-small); }
  .property-field { display: flex; align-items: center; gap: 4px; flex: 1; min-width: 0; }

  .prop-delete {
    display: flex; align-items: center; justify-content: center;
    width: 18px; height: 18px; border: none; border-radius: 3px;
    background: transparent; color: var(--text-muted); cursor: pointer; flex-shrink: 0;
  }

  .prop-delete:hover { background: var(--background-modifier-hover); color: var(--text-error, #ef4444); }

  .add-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 8px; border: 1px dashed var(--border-color); border-radius: 4px;
    background: transparent; color: var(--text-muted); font-size: var(--font-ui-smaller);
    cursor: pointer; transition: all 0.15s; margin-top: 4px;
  }

  .add-btn:hover { border-color: var(--interactive-accent); color: var(--interactive-accent); }
  .add-row { border: 1px solid var(--interactive-accent); background: var(--background-primary); }

  .key-suggest-wrap { position: relative; flex: 1; min-width: 0; }
  .key-suggest-wrap .prop-key { width: 100%; }

  .suggest-list {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 50;
    margin: 2px 0 0;
    padding: 2px 0;
    background: var(--background-primary);
    border: 1px solid var(--interactive-accent);
    border-radius: var(--radius-s);
    list-style: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-height: 168px;
    overflow-y: auto;
  }

  .suggest-item {
    display: block;
    width: 100%;
    padding: 4px 8px;
    background: none;
    border: none;
    text-align: left;
    font-size: var(--font-ui-smaller);
    color: var(--text-normal);
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .suggest-item:hover { background: var(--background-modifier-hover); }
</style>
