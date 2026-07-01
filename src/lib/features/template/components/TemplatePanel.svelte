<script lang="ts">
  import { onMount } from 'svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ActionButton from '@/components/ui/actions/ActionButton.svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import {
    templates,
    refreshTemplates,
    templateLoading,
    insertTemplateAtCursor,
    autoCreateFromTemplate,
  } from '../stores/template';
  import type { Template, TemplatePrompt } from '../services/template';
  import {
    type PanelView,
    DEFAULT_TEMPLATE_CONTENT,
    handleSaveTemplate,
    handleDeleteTemplate as handleDelete,
    getPromptsForTemplate,
    executeTemplate,
  } from './templatePanelLogic';

  let view: PanelView = 'list';
  let editingTemplate: Template | null = null;
  let editorName = '';
  let editorContent = '';
  let editorDescription = '';
  let pendingPrompts: TemplatePrompt[] = [];
  let promptAnswers: Record<string, string> = {};
  let pendingTemplateName = '';
  let filterQuery = '';

  /** Path of the template currently being hovered; drives the preview tooltip. */
  let hoveredTemplateName: string | null = null;

  onMount(() => {
    refreshTemplates();
  });

  $: filteredTemplates = filterQuery
    ? $templates.filter((t) => t.name.toLowerCase().includes(filterQuery.toLowerCase()))
    : $templates;

  /** First 3-5 lines of hovered template content for preview. */
  $: previewLines = hoveredTemplateName
    ? ($templates.find((t) => t.name === hoveredTemplateName)?.content ?? '')
        .split('\n')
        .slice(0, 5)
        .join('\n')
    : '';

  function startNewTemplate() {
    editingTemplate = null;
    editorName = '';
    editorContent = DEFAULT_TEMPLATE_CONTENT;
    editorDescription = '';
    view = 'editor';
  }

  function startEditTemplate(tmpl: Template) {
    editingTemplate = tmpl;
    editorName = tmpl.name;
    editorContent = tmpl.content;
    editorDescription = tmpl.description;
    view = 'editor';
  }

  async function handleSave() {
    if (await handleSaveTemplate(editorName, editorContent, editorDescription)) view = 'list';
  }

  function handleUseTemplate(tmpl: Template) {
    const prompts = getPromptsForTemplate(tmpl);
    if (prompts.length > 0) {
      pendingPrompts = prompts;
      promptAnswers = {};
      for (const p of prompts) promptAnswers[p.key] = p.defaultValue;
      pendingTemplateName = tmpl.name;
      view = 'prompts';
    } else {
      executeTemplate(tmpl.name, promptAnswers);
    }
  }

  async function handlePromptSubmit() {
    await executeTemplate(pendingTemplateName, promptAnswers);
    view = 'list';
  }

  function handleInsertTemplate(e: MouseEvent, tmpl: Template) {
    e.stopPropagation();
    insertTemplateAtCursor(tmpl);
  }

  async function handleNewFromTemplate(e: MouseEvent, tmpl: Template) {
    e.stopPropagation();
    await autoCreateFromTemplate(tmpl.name);
  }
</script>

<div class="template-panel" role="tabpanel" aria-label="Templates">
  {#if view === 'list'}
    <PanelHeader icon="file-text" title="Templates" count={$templates.length || undefined}>
      <svelte:fragment slot="actions">
        <ActionButton icon="plus" title="New template" on:click={startNewTemplate} />
        <ActionButton icon="refresh-cw" title="Refresh" on:click={refreshTemplates} />
      </svelte:fragment>
    </PanelHeader>

    <div class="panel-body">
      {#if $templates.length > 3}
        <div class="filter-bar">
          <Icon name="search" size={12} />
          <input
            bind:value={filterQuery}
            class="filter-input"
            type="text"
            placeholder="Filter templates…"
            spellcheck="false"
          />
        </div>
      {/if}

      {#if $templateLoading}
        <div class="loading">
          <Icon name="loader" size={24} />
          <span>Loading templates…</span>
        </div>
      {:else if filteredTemplates.length === 0}
        <div class="empty-state">
          <Icon name="file-text" size={28} />
          <p>{filterQuery ? 'No matching templates' : 'No templates found'}</p>
          <p class="hint">Add .md files to .bismuth/templates/</p>
        </div>
      {:else}
        <div class="template-list">
          {#each filteredTemplates as tmpl}
            <div
              class="template-item"
              role="listitem"
              on:mouseenter={() => {
                hoveredTemplateName = tmpl.name;
              }}
              on:mouseleave={() => {
                hoveredTemplateName = null;
              }}
            >
              <button
                class="template-main"
                on:click={() => handleUseTemplate(tmpl)}
                title="Create from {tmpl.name}"
              >
                <div class="template-icon"><Icon name="file-text" size={14} /></div>
                <div class="template-info">
                  <span class="template-name">{tmpl.name}</span>
                  {#if tmpl.description}
                    <span class="template-desc">{tmpl.description}</span>
                  {/if}
                </div>
                <span class="template-type">{tmpl.template_type}</span>
              </button>
              <div class="template-actions">
                <button
                  class="icon-btn new-note"
                  title="New note from template"
                  aria-label="New note from {tmpl.name}"
                  on:click={(e) => handleNewFromTemplate(e, tmpl)}
                >
                  <Icon name="file-plus" size={12} />
                </button>
                <button
                  class="icon-btn insert"
                  title="Insert into active note"
                  aria-label="Insert {tmpl.name} into active note"
                  on:click={(e) => handleInsertTemplate(e, tmpl)}
                >
                  <Icon name="arrow-right-circle" size={12} />
                </button>
                <button class="icon-btn" title="Edit" on:click={() => startEditTemplate(tmpl)}>
                  <Icon name="edit" size={12} />
                </button>
                <button class="icon-btn danger" title="Delete" on:click={() => handleDelete(tmpl)}>
                  <Icon name="trash" size={12} />
                </button>
              </div>

              {#if hoveredTemplateName === tmpl.name && previewLines}
                <div class="template-preview" role="tooltip" aria-label="Preview of {tmpl.name}">
                  <pre class="preview-content">{previewLines}</pre>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}

      <div class="syntax-help">
        <details>
          <summary>Template syntax</summary>
          <div class="help-content">
            <code>{'{{date.today}}'}</code> Current date<br />
            <code>{'{{date.now}}'}</code> Date + time<br />
            <code>{'{{file.title}}'}</code> Note title<br />
            <code>{'{{system.uuid}}'}</code> Random UUID<br />
            <code>{'{{system.cursor}}'}</code> Cursor position<br />
            <code>{'{{frontmatter.header}}'}</code> YAML block<br />
            <code>{'{{#if key}}...{{/if}}'}</code> Conditional<br />
            <code>{'{{value | uppercase}}'}</code> Pipe filter<br />
            <code>{'{{prompt "Title" title=Untitled}}'}</code> User prompt
          </div>
        </details>
      </div>
    </div>
  {:else if view === 'editor'}
    <PanelHeader icon="edit" title={editingTemplate ? 'Edit Template' : 'New Template'}>
      <svelte:fragment slot="actions">
        <ActionButton
          icon="x"
          title="Cancel"
          on:click={() => {
            view = 'list';
          }}
        />
      </svelte:fragment>
    </PanelHeader>

    <div class="panel-body editor-body">
      <label class="field-label"
        >Name
        <input bind:value={editorName} class="field-input" placeholder="Template name" />
      </label>

      <label class="field-label"
        >Description
        <input
          bind:value={editorDescription}
          class="field-input"
          placeholder="Optional description"
        />
      </label>

      <label class="field-label"
        >Content
        <textarea
          bind:value={editorContent}
          class="editor-textarea"
          spellcheck="false"
          placeholder="Template content…"
        ></textarea>
      </label>

      <button class="save-btn" on:click={handleSave} disabled={!editorName.trim()}>
        <Icon name="check" size={14} />
        Save Template
      </button>
    </div>
  {:else if view === 'prompts'}
    <PanelHeader icon="file-text" title="Template Prompts">
      <svelte:fragment slot="actions">
        <ActionButton
          icon="x"
          title="Cancel"
          on:click={() => {
            view = 'list';
          }}
        />
      </svelte:fragment>
    </PanelHeader>

    <div class="panel-body prompt-body">
      <p class="prompt-intro">Fill in the template variables:</p>
      {#each pendingPrompts as prompt}
        <label class="field-label"
          >{prompt.label}
          <input
            bind:value={promptAnswers[prompt.key]}
            class="field-input"
            placeholder={prompt.defaultValue || prompt.label}
          />
        </label>
      {/each}
      <button class="save-btn" on:click={handlePromptSubmit}>
        <Icon name="check" size={14} />
        Create Note
      </button>
    </div>
  {/if}
</div>

<style>
  .template-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
  .panel-body {
    flex: 1;
    overflow-y: auto;
  }
  .filter-bar {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-s);
    border-bottom: 1px solid var(--border-color);
    color: var(--text-muted);
  }
  .filter-input {
    flex: 1;
    border: none;
    background: none;
    color: var(--text-normal);
    font-size: var(--font-ui-small);
    outline: none;
  }
  .filter-input::placeholder {
    color: var(--text-faint);
  }
  .loading,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xl);
    color: var(--text-muted);
    text-align: center;
  }
  .empty-state p,
  .loading span {
    margin: 0;
    font-size: var(--font-ui-small);
  }
  .hint {
    font-size: var(--font-smallest);
    opacity: 0.7;
  }
  .template-list {
    display: flex;
    flex-direction: column;
  }
  .template-item {
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    flex-wrap: wrap;
    position: relative;
  }
  .template-main {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    min-height: 32px;
    padding: var(--spacing-xs) var(--spacing-s);
    border: none;
    background: none;
    color: var(--text-normal);
    text-align: left;
    cursor: pointer;
    transition: background var(--transition-fast);
  }
  .template-main:hover {
    background: var(--background-modifier-hover);
  }
  .template-icon {
    color: var(--text-muted);
    flex-shrink: 0;
  }
  .template-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .template-name {
    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .template-desc {
    font-size: var(--font-smallest);
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .template-type {
    font-size: 10px;
    color: var(--text-faint);
    background: var(--background-modifier-hover);
    padding: 1px 5px;
    border-radius: var(--radius-s);
    flex-shrink: 0;
  }
  .template-actions {
    display: flex;
    gap: 2px;
    padding-right: var(--spacing-xs);
    opacity: 0;
    transition: opacity var(--transition-fast);
  }
  .template-item:hover .template-actions {
    opacity: 1;
  }
  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    background: none;
    color: var(--text-muted);
    border-radius: var(--radius-s);
    cursor: pointer;
  }
  .icon-btn:hover {
    background: var(--interactive-hover);
    color: var(--text-normal);
  }
  .icon-btn.danger:hover {
    color: var(--text-error);
  }
  .icon-btn.insert:hover {
    color: var(--interactive-accent);
  }
  .icon-btn.new-note:hover {
    color: var(--status-added, #22c55e);
  }
  .template-preview {
    position: absolute;
    left: 0;
    top: 100%;
    z-index: 50;
    width: 260px;
    background: var(--background-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    padding: var(--spacing-xs) var(--spacing-s);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    pointer-events: none;
  }
  .preview-content {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 10px;
    line-height: 1.5;
    color: var(--text-muted);
    white-space: pre-wrap;
    overflow: hidden;
    max-height: 80px;
  }
  .syntax-help {
    padding: var(--spacing-s);
    border-top: 1px solid var(--border-color);
  }
  .syntax-help summary {
    font-size: var(--font-smallest);
    color: var(--text-muted);
    cursor: pointer;
    user-select: none;
  }
  .help-content {
    margin-top: var(--spacing-xs);
    font-size: 11px;
    line-height: 1.8;
    color: var(--text-muted);
  }
  .help-content code {
    font-family: var(--font-mono);
    font-size: 10px;
    background: var(--background-modifier-hover);
    padding: 1px 4px;
    border-radius: 3px;
  }
  .editor-body,
  .prompt-body {
    padding: var(--spacing-s);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  .field-label {
    font-size: var(--font-smallest);
    color: var(--text-muted);
    font-weight: var(--font-medium);
  }
  .field-input {
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-s);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: var(--font-ui-small);
    outline: none;
    transition: border-color var(--transition-fast);
  }
  .field-input:focus {
    border-color: var(--interactive-accent);
  }
  .editor-textarea {
    flex: 1;
    min-height: 200px;
    width: 100%;
    padding: var(--spacing-s);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.5;
    resize: vertical;
    outline: none;
  }
  .editor-textarea:focus {
    border-color: var(--interactive-accent);
  }
  .save-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-m);
    border: none;
    border-radius: var(--radius-s);
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
    cursor: pointer;
    transition: opacity var(--transition-fast);
    margin-top: var(--spacing-xs);
  }
  .save-btn:hover {
    opacity: 0.9;
  }
  .save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .prompt-intro {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
    margin: 0 0 var(--spacing-xs);
  }
</style>
