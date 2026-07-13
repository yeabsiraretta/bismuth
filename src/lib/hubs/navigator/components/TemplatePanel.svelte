<script lang="ts">
  import { getNotes } from '@/hubs/core/stores/vault-store.svelte';
  import { getCachedContent } from '@/hubs/editor/services/file-ops';
  import { readNote } from '@/sal/note-service';
  import { openNote } from '@/ui/panel-actions';
  import Panel from '@/ui/panel.svelte';
  import BIcon from '@/ui/b-icon.svelte';

  interface TemplateDef {
    name: string;
    path: string;
    description: string;
  }

  let allNotes = $derived(getNotes());
  let templates = $derived(
    allNotes
      .filter((n) => n.path.startsWith('.bismuth/templates/') || n.path.startsWith('templates/'))
      .map((n): TemplateDef => ({
        name: n.title,
        path: n.path,
        description: previewContent(n.path),
      }))
  );

  let filterQuery = $state('');
  let filtered = $derived(
    filterQuery
      ? templates.filter((t) => t.name.toLowerCase().includes(filterQuery.toLowerCase()))
      : templates
  );

  let appliedPath = $state<string | null>(null);

  function previewContent(path: string): string {
    const c = getCachedContent(path);
    if (!c) return '';
    const lines = c.split('\n').filter((l) => !l.startsWith('---'));
    return lines.slice(0, 2).join(' ').slice(0, 80);
  }

  async function getTemplateContent(path: string): Promise<string> {
    const cached = getCachedContent(path);
    if (cached) return cached;
    try {
      const note = await readNote(path);
      return note.content;
    } catch {
      return '';
    }
  }

  function handleOpen(tmpl: TemplateDef) {
    openNote(tmpl.path);
  }

  async function handleApply(tmpl: TemplateDef) {
    const content = await getTemplateContent(tmpl.path);
    if (!content) return;
    window.dispatchEvent(
      new CustomEvent('insert-template', { detail: { content, name: tmpl.name } })
    );
    appliedPath = tmpl.path;
    setTimeout(() => {
      appliedPath = null;
    }, 1200);
  }
</script>

<Panel title="Templates">
  {#snippet badge()}<span class="panel-badge">{templates.length}</span>{/snippet}
  {#if templates.length > 3}
    <div class="tp-filter">
      <input
        class="tp-filter-input"
        type="text"
        placeholder="Filter templates…"
        bind:value={filterQuery}
      />
    </div>
  {/if}

  {#if filtered.length === 0}
    <div class="panel-empty">
      {#if filterQuery}
        <p>No matching templates</p>
      {:else}
        <p>No templates found</p>
        <p class="panel-empty-hint">Add .md files to <code>.bismuth/templates/</code></p>
      {/if}
    </div>
  {:else}
    <ul class="tp-list">
      {#each filtered as tmpl (tmpl.path)}
        <li class="tp-item" class:tp-applied={appliedPath === tmpl.path}>
          <button class="tp-item-main" onclick={() => handleApply(tmpl)} title="Apply template">
            <BIcon name="templates" size={14} class="tp-icon" />
            <div class="tp-item-info">
              <span class="tp-item-name">{tmpl.name}</span>
              {#if tmpl.description}
                <span class="tp-item-desc">{tmpl.description}</span>
              {/if}
            </div>
            {#if appliedPath === tmpl.path}
              <span class="tp-applied-label">Applied</span>
            {/if}
          </button>
          <div class="tp-item-actions">
            <button class="tp-action" onclick={() => handleOpen(tmpl)} title="Open template file">
              <BIcon name="externalLink" size={12} />
            </button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}

  <details class="tp-syntax">
    <summary>Template syntax</summary>
    <div class="tp-help">
      <strong>Date</strong><br />
      <code>{'{{date.today}}'}</code> Today (YYYY-MM-DD)<br />
      <code>{'{{date.today+7}}'}</code> Date arithmetic<br />
      <code>{'{{date.tomorrow}}'}</code> Tomorrow<br />
      <code>{'{{date.yesterday}}'}</code> Yesterday<br />
      <code>{'{{date.weekday}}'}</code> Day name<br />
      <code>{'{{date.time24}}'}</code> HH:MM<br />
      <code>{'{{date.week}}'}</code> Week number<br />
      <code>{'{{date.quarter}}'}</code> Q1–Q4<br />
      <code>{'{{date.unix}}'}</code> Unix timestamp<br />
      <br />
      <strong>File</strong><br />
      <code>{'{{file.title}}'}</code> Note title<br />
      <code>{'{{file.path}}'}</code> Full path<br />
      <code>{'{{file.folder}}'}</code> Parent folder<br />
      <code>{'{{file.name}}'}</code> Filename<br />
      <br />
      <strong>Frontmatter</strong><br />
      <code>{'{{frontmatter.KEY}}'}</code> YAML value<br />
      <br />
      <strong>System</strong><br />
      <code>{'{{system.uuid}}'}</code> Random UUID<br />
      <code>{'{{system.timestamp}}'}</code> Unix ms<br />
      <br />
      <strong>Vault</strong><br />
      <code>{'{{vault.name}}'}</code> Vault name<br />
      <code>{'{{vault.noteCount}}'}</code> Total notes<br />
      <br />
      <strong>Config</strong><br />
      <code>{'{{config.dateFormat}}'}</code> Date format<br />
      <code>{'{{config.language}}'}</code> Language<br />
      <br />
      <strong>Commands</strong><br />
      <code>{'{{cursor}}'}</code> Cursor position<br />
      <code>{'{{- expr}}'}</code> Trim whitespace
    </div>
  </details>
</Panel>

<style>
  .tp-filter {
    padding: 6px 8px;
    border-bottom: 1px solid var(--color-border);
  }
  .tp-filter-input {
    width: 100%;
    padding: 4px 8px;
    font-size: 0.7rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-family: inherit;
    outline: none;
  }
  .tp-filter-input:focus {
    border-color: var(--color-accent);
  }
  :global(.panel-empty-hint) code {
    font-family: var(--font-mono);
    font-size: 0.6rem;
    background: var(--color-surface);
    padding: 1px 4px;
    border-radius: var(--radius-s);
  }
  .tp-list {
    list-style: none;
    padding: 4px;
    margin: 0;
  }
  .tp-item {
    display: flex;
    align-items: center;
    gap: 2px;
    border-radius: var(--radius-s);
  }
  .tp-item:hover {
    background: var(--color-surface-hover);
  }
  .tp-item.tp-applied {
    background: oklch(from var(--color-accent) l c h / 0.08);
  }
  .tp-item-main {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
    padding: 6px 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
    border-radius: var(--radius-s);
    color: var(--color-text);
  }
  .tp-item-main:hover {
    color: var(--color-accent);
  }
  .tp-item-main :global(.tp-icon) {
    flex-shrink: 0;
    color: var(--color-text-muted);
  }
  .tp-item-main:hover :global(.tp-icon) {
    color: var(--color-accent);
  }
  .tp-item-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }
  .tp-applied-label {
    flex-shrink: 0;
    font-size: 0.6rem;
    font-weight: 600;
    color: var(--color-accent);
    padding: 1px 6px;
    border-radius: var(--radius-s);
    background: oklch(from var(--color-accent) l c h / 0.12);
  }
  .tp-item-name {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tp-item-desc {
    font-size: 0.6rem;
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tp-item-actions {
    display: flex;
    gap: 2px;
    opacity: 0;
    flex-shrink: 0;
  }
  .tp-item:hover .tp-item-actions {
    opacity: 1;
  }
  .tp-action {
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    color: var(--color-text-muted);
    cursor: pointer;
    font-size: 0.7rem;
  }
  .tp-action:hover {
    background: var(--color-surface);
    color: var(--color-text);
  }
  .tp-syntax {
    padding: 8px;
    border-top: 1px solid var(--color-border);
    margin-top: auto;
  }
  .tp-syntax summary {
    font-size: 0.6rem;
    color: var(--color-text-muted);
    cursor: pointer;
    user-select: none;
  }
  .tp-help {
    margin-top: 4px;
    font-size: 0.6rem;
    line-height: 1.8;
    color: var(--color-text-muted);
  }
  .tp-help code {
    font-family: var(--font-mono);
    font-size: 0.55rem;
    background: var(--color-surface);
    padding: 1px 4px;
    border-radius: var(--radius-s);
  }
</style>
