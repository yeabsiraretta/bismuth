<script lang="ts">
  import { onMount } from 'svelte';
  import Modal from '@/components/ui/layout/Modal.svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import { availableSmartTemplates, smartTemplatesLoading } from '../stores/smartTemplateStore';
  import { filterTemplates, SOURCE_LABELS } from '../services/templateDiscovery';
  import { contextPreview } from '../services/promptBuilder';
  import type { SmartTemplate, PromptContext, BuiltPrompt } from '../types/smartTemplate';
  import {
    type ModalStep,
    STEP_ORDER,
    getStepIndex,
    canGoNext,
    canGoBack,
    nextStep,
    prevStep,
    initContext,
    assemblePrompt,
    copyToClipboard,
    toggleTemplateSelection,
    initModal,
  } from './smartTemplateLogic';

  export let isOpen: boolean = false;
  export let selection: string | undefined = undefined;
  export let onClose: (() => void) | undefined = undefined;

  let step: ModalStep = 'context';
  let context: PromptContext | null = null;
  let selectedTemplates: SmartTemplate[] = [];
  let instructions = '';
  let filterQuery = '';
  let builtPrompt: BuiltPrompt | null = null;
  let copied = false;

  onMount(async () => { await initModal(); });

  $: if (isOpen && !context) {
    context = initContext(selection);
  }
  $: filteredTemplates = filterTemplates($availableSmartTemplates, filterQuery);
  $: progress = ((getStepIndex(step) + 1) / STEP_ORDER.length) * 100;

  function handleNext() {
    if (step === 'instructions' && context) {
      builtPrompt = assemblePrompt(context, selectedTemplates, instructions);
    }
    step = nextStep(step);
  }

  function handleBack() { step = prevStep(step); }

  async function handleCopy() {
    if (!builtPrompt) return;
    copied = await copyToClipboard(builtPrompt.text);
    setTimeout(() => { copied = false; }, 2000);
  }

  function handleClose() {
    step = 'context';
    context = null;
    selectedTemplates = [];
    instructions = '';
    builtPrompt = null;
    filterQuery = '';
    onClose?.();
  }

  function isSelected(t: SmartTemplate): boolean {
    return selectedTemplates.some(s => s.name === t.name);
  }
</script>

<Modal {isOpen} title="Smart Templates" onClose={handleClose}>
  <div class="st-modal">
    <div class="st-progress">
      <div class="st-progress-bar" style="width: {progress}%"></div>
    </div>
    <div class="st-steps">
      {#each STEP_ORDER as s, i}
        <span class="st-step" class:active={s === step} class:done={getStepIndex(step) > i}>
          {i + 1}. {s === 'context' ? 'Context' : s === 'templates' ? 'Templates' : s === 'instructions' ? 'Instructions' : 'Result'}
        </span>
      {/each}
    </div>

    <div class="st-body">
      {#if step === 'context'}
        <div class="st-section">
          <h4><Icon name="file-text" size={14} /> Context</h4>
          {#if context}
            <p class="st-label">{context.isSelection ? 'Selected text' : context.noteTitle}</p>
            <pre class="st-preview">{contextPreview(context.content, 8)}</pre>
            <p class="st-meta">{context.content.length} chars</p>
          {:else}
            <p class="st-empty">No active note. Open a note first.</p>
          {/if}
        </div>

      {:else if step === 'templates'}
        <div class="st-section">
          <h4><Icon name="layers" size={14} /> Choose Templates ({selectedTemplates.length} selected)</h4>
          <input bind:value={filterQuery} class="st-input" type="text" placeholder="Filter templates…" />
          {#if $smartTemplatesLoading}
            <p class="st-loading">Loading…</p>
          {:else}
            <div class="st-template-list">
              {#each filteredTemplates as tmpl}
                <button
                  class="st-template-item"
                  class:selected={isSelected(tmpl)}
                  on:click={() => { selectedTemplates = toggleTemplateSelection(selectedTemplates, tmpl); }}
                >
                  <span class="st-tmpl-check">{isSelected(tmpl) ? '✓' : '○'}</span>
                  <span class="st-tmpl-name">{tmpl.name}</span>
                  <span class="st-tmpl-source">{SOURCE_LABELS[tmpl.source] || tmpl.source}</span>
                  {#if tmpl.description}
                    <span class="st-tmpl-desc">{tmpl.description}</span>
                  {/if}
                </button>
              {/each}
            </div>
          {/if}
        </div>

      {:else if step === 'instructions'}
        <div class="st-section">
          <h4><Icon name="message-square" size={14} /> Additional Instructions</h4>
          <textarea bind:value={instructions} class="st-textarea" placeholder="Optional: add specific instructions for the AI…" rows="4"></textarea>
          <p class="st-meta">Templates: {selectedTemplates.map(t => t.name).join(', ') || 'none'}</p>
        </div>

      {:else if step === 'result'}
        <div class="st-section">
          <h4><Icon name="clipboard" size={14} /> Ready to Copy</h4>
          {#if builtPrompt}
            <pre class="st-result">{builtPrompt.text}</pre>
            <div class="st-result-meta">
              <span>{builtPrompt.charCount} chars</span>
              <span>~{builtPrompt.estimatedTokens} tokens</span>
              <span>{builtPrompt.templateNames.length} template(s)</span>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <div class="st-footer">
      {#if canGoBack(step)}
        <button class="st-btn st-btn-secondary" on:click={handleBack}>
          <Icon name="arrow-left" size={14} /> Back
        </button>
      {:else}
        <div></div>
      {/if}

      <div class="st-footer-right">
        {#if step === 'result'}
          <button class="st-btn st-btn-primary" on:click={handleCopy}>
            <Icon name={copied ? 'check' : 'clipboard'} size={14} />
            {copied ? 'Copied!' : 'Copy Prompt'}
          </button>
        {:else if canGoNext(step)}
          <button class="st-btn st-btn-primary" on:click={handleNext} disabled={step === 'context' && !context}>
            Next <Icon name="arrow-right" size={14} />
          </button>
        {/if}
      </div>
    </div>
  </div>
</Modal>

<style>
  .st-modal { display: flex; flex-direction: column; gap: 12px; min-height: 320px; }
  .st-progress { height: 3px; background: var(--background-modifier-border); border-radius: 2px; overflow: hidden; }
  .st-progress-bar { height: 100%; background: var(--interactive-accent, #6366f1); transition: width 0.3s ease; }
  .st-steps { display: flex; gap: 12px; font-size: 11px; color: var(--text-faint); }
  .st-step { opacity: 0.5; }
  .st-step.active { opacity: 1; font-weight: 600; color: var(--text-normal); }
  .st-step.done { opacity: 0.7; text-decoration: line-through; }
  .st-body { flex: 1; overflow-y: auto; max-height: 360px; }
  .st-section h4 { display: flex; align-items: center; gap: 6px; margin: 0 0 8px; font-size: 13px; }
  .st-label { font-weight: 600; font-size: 13px; margin: 0 0 4px; color: var(--text-normal); }
  .st-preview, .st-result { font-size: 11px; padding: 8px; background: var(--background-secondary); border-radius: 4px; overflow: auto; max-height: 180px; white-space: pre-wrap; word-break: break-word; margin: 0; }
  .st-result { max-height: 240px; }
  .st-meta { font-size: 11px; color: var(--text-faint); margin: 4px 0 0; }
  .st-empty { color: var(--text-faint); font-style: italic; }
  .st-loading { color: var(--text-faint); }
  .st-input { width: 100%; padding: 6px 8px; border: 1px solid var(--background-modifier-border); border-radius: 4px; background: var(--background-primary); font-size: 12px; margin-bottom: 8px; }
  .st-textarea { width: 100%; padding: 8px; border: 1px solid var(--background-modifier-border); border-radius: 4px; background: var(--background-primary); font-size: 12px; resize: vertical; font-family: inherit; }
  .st-template-list { display: flex; flex-direction: column; gap: 2px; max-height: 220px; overflow-y: auto; }
  .st-template-item { display: grid; grid-template-columns: 20px 1fr auto; gap: 4px; align-items: center; padding: 6px 8px; border: 1px solid transparent; border-radius: 4px; background: none; cursor: pointer; text-align: left; font-size: 12px; }
  .st-template-item:hover { background: var(--background-secondary); }
  .st-template-item.selected { border-color: var(--interactive-accent, #6366f1); background: rgba(99, 102, 241, 0.06); }
  .st-tmpl-check { font-size: 13px; text-align: center; }
  .st-tmpl-name { font-weight: 500; }
  .st-tmpl-source { font-size: 10px; color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.04em; }
  .st-tmpl-desc { grid-column: 2 / -1; font-size: 11px; color: var(--text-muted); }
  .st-result-meta { display: flex; gap: 12px; font-size: 11px; color: var(--text-faint); margin-top: 6px; }
  .st-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid var(--background-modifier-border); }
  .st-footer-right { display: flex; gap: 8px; }
  .st-btn { display: inline-flex; align-items: center; gap: 4px; padding: 6px 14px; border-radius: 4px; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid var(--background-modifier-border); }
  .st-btn-primary { background: var(--interactive-accent, #6366f1); color: #fff; border-color: transparent; }
  .st-btn-primary:hover { opacity: 0.9; }
  .st-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .st-btn-secondary { background: var(--background-secondary); color: var(--text-normal); }
  .st-btn-secondary:hover { background: var(--background-modifier-hover); }
</style>
