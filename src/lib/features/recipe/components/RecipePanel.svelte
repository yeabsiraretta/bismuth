<script lang="ts">
  /**
   * RecipePanel — sidebar panel that detects recipe notes and shows recipe view controls.
   */
  import Icon from '@/components/icons/Icon.svelte';
  import { activeNote } from '@/stores/vault/vault';
  import {
    activeRecipe, hasRecipe, recipeViewState,
    loadRecipe, clearRecipe, setViewMode, setScale, scaleToServings,
    nextStep, prevStep, highlightStep, resetCrossOff,
  } from '../stores/recipeStore';
  import { detectRecipe } from '../stores/recipeStore';
  import { grabberState, grabRecipeAsNote } from '../stores/grabberStore';
  import { log } from '@/utils/logger';
  import RecipeCard from './RecipeCard.svelte';

  $: note = $activeNote;
  $: isRecipe = note ? detectRecipe(note.content) : false;
  $: loaded = $hasRecipe;
  $: recipe = $activeRecipe;
  $: state = $recipeViewState;

  $: if (note && isRecipe && !loaded) {
    loadRecipe(note.content, note.title);
  }
  $: if (note && !isRecipe && loaded) {
    clearRecipe();
  }

  let servingsInput = '';
  $: if (recipe?.metadata.servings) {
    servingsInput = String(Math.round(recipe.metadata.servings * state.scaleFactor));
  }

  function handleServingsChange(): void {
    const n = parseInt(servingsInput, 10);
    if (!isNaN(n) && n > 0) scaleToServings(n);
  }

  let grabUrl = '';
  $: grabState = $grabberState;

  async function handleGrabRecipe(): Promise<void> {
    const url = grabUrl.trim();
    if (!url) return;
    try {
      const path = await grabRecipeAsNote(url);
      grabUrl = '';
      const { openNote } = await import('@/appNavigation');
      await openNote(path);
    } catch (err) {
      log.error('RecipePanel: grab failed', err as Error);
    }
  }
</script>

<div class="recipe-panel">
  {#if loaded && recipe}
    <div class="panel-header">
      <h3 class="panel-title">
        <Icon name="coffee" size={16} />
        Recipe View
      </h3>
      <button class="close-btn" on:click={clearRecipe} aria-label="Close recipe view">
        <Icon name="x" size={14} />
      </button>
    </div>

    <div class="quick-controls">
      {#if recipe.metadata.servings}
        <div class="servings-row">
          <label class="servings-label" for="recipe-servings">Servings:</label>
          <input
            id="recipe-servings"
            type="number"
            class="servings-input"
            min="1"
            max="100"
            bind:value={servingsInput}
            on:change={handleServingsChange}
          />
        </div>
      {/if}

      <div class="step-tracker">
        <span class="tracker-label">Step:</span>
        {#if state.highlightedStep !== null}
          <button class="nav-btn" on:click={prevStep} disabled={state.highlightedStep <= 0} aria-label="Previous step">
            <Icon name="chevron-left" size={14} />
          </button>
          <span class="step-display">{state.highlightedStep + 1}/{recipe.steps.length}</span>
          <button class="nav-btn" on:click={nextStep} disabled={state.highlightedStep >= recipe.steps.length - 1} aria-label="Next step">
            <Icon name="chevron-right" size={14} />
          </button>
          <button class="nav-btn" on:click={() => highlightStep(null)} aria-label="Clear step highlight">
            <Icon name="x" size={12} />
          </button>
        {:else}
          <button class="start-btn" on:click={() => highlightStep(0)} aria-label="Start cooking">
            Start
          </button>
        {/if}
      </div>

      <button class="reset-link" on:click={resetCrossOff} aria-label="Reset all checks">
        Reset checks
      </button>
    </div>

    <div class="recipe-content">
      <RecipeCard />
    </div>
  {:else if note && !isRecipe}
    <div class="empty-state">
      <Icon name="coffee" size={32} />
      <p>This note doesn't look like a recipe.</p>
      <p class="hint">Add <strong>## Ingredients</strong> and <strong>## Instructions</strong> headings to enable recipe view.</p>
      <button class="force-btn" on:click={() => { if (note) loadRecipe(note.content, note.title); }} aria-label="Force load as recipe">
        Load anyway
      </button>
    </div>
  {:else}
    <div class="empty-state">
      <Icon name="coffee" size={32} />
      <p>Open a note to view it as a recipe.</p>
    </div>
  {/if}

  <div class="grabber-section">
    <div class="grabber-header">
      <Icon name="download" size={14} />
      <span>Grab Recipe from URL</span>
    </div>
    <form class="grabber-form" on:submit|preventDefault={handleGrabRecipe}>
      <input
        type="url"
        class="grabber-input"
        placeholder="Paste recipe URL..."
        bind:value={grabUrl}
        disabled={grabState.isGrabbing}
      />
      <button
        type="submit"
        class="grabber-btn"
        disabled={grabState.isGrabbing || !grabUrl.trim()}
        aria-label="Grab recipe"
      >
        {#if grabState.isGrabbing}
          <Icon name="loader" size={14} />
        {:else}
          <Icon name="download" size={14} />
        {/if}
      </button>
    </form>
    {#if grabState.lastError}
      <p class="grabber-error">{grabState.lastError}</p>
    {/if}
  </div>
</div>

<style>
  .recipe-panel { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
  .panel-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--color-border); }
  .panel-title { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 600; margin: 0; color: var(--color-text); }
  .close-btn { background: none; border: none; cursor: pointer; color: var(--color-text-muted); padding: 2px; border-radius: 3px; display: flex; }
  .close-btn:hover { background: var(--color-bg-secondary); }
  .quick-controls { padding: 8px 12px; border-bottom: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 6px; }
  .servings-row { display: flex; align-items: center; gap: 6px; }
  .servings-label { font-size: 0.8rem; color: var(--color-text-secondary); }
  .servings-input { width: 48px; padding: 2px 4px; border: 1px solid var(--color-border); border-radius: 4px; font-size: 0.8rem; text-align: center; background: var(--color-bg); color: var(--color-text); }
  .step-tracker { display: flex; align-items: center; gap: 4px; }
  .tracker-label { font-size: 0.8rem; color: var(--color-text-secondary); margin-right: 4px; }
  .nav-btn { background: none; border: 1px solid var(--color-border); border-radius: 3px; padding: 1px 4px; cursor: pointer; display: flex; align-items: center; color: var(--color-text-secondary); }
  .nav-btn:disabled { opacity: 0.3; cursor: default; }
  .step-display { font-size: 0.8rem; font-weight: 600; color: var(--color-text); min-width: 32px; text-align: center; }
  .start-btn { font-size: 0.75rem; padding: 2px 10px; border: 1px solid var(--color-accent); border-radius: 4px; background: var(--color-accent); color: white; cursor: pointer; }
  .reset-link { font-size: 0.75rem; color: var(--color-text-muted); background: none; border: none; cursor: pointer; text-decoration: underline; align-self: flex-start; padding: 0; }
  .recipe-content { flex: 1; overflow-y: auto; }
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; text-align: center; gap: 8px; color: var(--color-text-muted); flex: 1; }
  .empty-state p { margin: 0; font-size: 0.85rem; }
  .hint { font-size: 0.8rem; color: var(--color-text-muted); }
  .force-btn { margin-top: 8px; padding: 4px 12px; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-bg); color: var(--color-text-secondary); cursor: pointer; font-size: 0.8rem; }
  .force-btn:hover { background: var(--color-bg-secondary); }
  .grabber-section { padding: 8px 12px; border-top: 1px solid var(--color-border); margin-top: auto; }
  .grabber-header { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 6px; }
  .grabber-form { display: flex; gap: 4px; }
  .grabber-input { flex: 1; padding: 4px 8px; border: 1px solid var(--color-border); border-radius: 4px; font-size: 0.8rem; background: var(--color-bg); color: var(--color-text); min-width: 0; }
  .grabber-input:focus { border-color: var(--color-accent); outline: none; }
  .grabber-btn { padding: 4px 8px; border: 1px solid var(--color-accent); border-radius: 4px; background: var(--color-accent); color: white; cursor: pointer; display: flex; align-items: center; }
  .grabber-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .grabber-error { font-size: 0.75rem; color: var(--color-error, #e53935); margin-top: 4px; margin-bottom: 0; }
</style>
