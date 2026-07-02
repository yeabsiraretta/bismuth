<script lang="ts">
  /**
   * RecipeCard — interactive recipe view with scaling, cross-off, and step tracking.
   */
  import Icon from '@/components/icons/Icon.svelte';
  import {
    activeRecipe,
    recipeViewState,
    scaledIngredients,
    setScale,
    setViewMode,
    toggleIngredientCrossOff,
    highlightStep,
    nextStep,
    prevStep,
    resetCrossOff,
  } from '../stores/recipeStore';
  import { formatQuantity, scaleQuantity } from '../services/recipeParser';
  import type { RecipeViewMode } from '../types';

  $: recipe = $activeRecipe;
  $: state = $recipeViewState;
  $: ingredients = $scaledIngredients;
  $: isSplit = state.viewMode === 'split';

  const modes: { id: RecipeViewMode; label: string }[] = [
    { id: 'card', label: 'Card' },
    { id: 'split', label: 'Split' },
    { id: 'steps', label: 'Steps' },
  ];

  function handleScaleInput(e: Event): void {
    const val = parseFloat((e.target as HTMLInputElement).value);
    if (!isNaN(val) && val > 0) setScale(val);
  }

  function scalePreset(factor: number): void {
    setScale(factor);
  }
</script>

{#if recipe}
  <div class="recipe-card" class:split-view={isSplit}>
    <header class="recipe-header">
      <h1 class="recipe-title">{recipe.metadata.title || 'Untitled Recipe'}</h1>
      {#if recipe.metadata.source}
        <span class="recipe-source">{recipe.metadata.source}</span>
      {/if}
      <div class="recipe-meta">
        {#if recipe.metadata.prepTime}
          <span class="meta-chip"
            ><Icon name="clock" size={14} /> Prep: {recipe.metadata.prepTime}</span
          >
        {/if}
        {#if recipe.metadata.cookTime}
          <span class="meta-chip"
            ><Icon name="clock" size={14} /> Cook: {recipe.metadata.cookTime}</span
          >
        {/if}
        {#if recipe.metadata.servings}
          <span class="meta-chip"
            ><Icon name="users" size={14} /> {recipe.metadata.servings} servings</span
          >
        {/if}
      </div>
      {#if recipe.metadata.tags.length > 0}
        <div class="recipe-tags">
          {#each recipe.metadata.tags as tag}
            <span class="tag-badge">#{tag}</span>
          {/each}
        </div>
      {/if}
    </header>

    <div class="recipe-controls">
      <div class="view-modes" role="tablist" aria-label="View modes">
        {#each modes as mode}
          <button
            class="mode-btn {state.viewMode === mode.id ? 'active' : ''}"
            role="tab"
            aria-selected={state.viewMode === mode.id}
            on:click={() => setViewMode(mode.id)}>{mode.label}</button
          >
        {/each}
      </div>
      <div class="scale-controls">
        <span class="scale-label">Scale:</span>
        <button class="scale-btn" on:click={() => scalePreset(0.5)} aria-label="Half">0.5x</button>
        <button class="scale-btn" on:click={() => scalePreset(1)} aria-label="Original">1x</button>
        <button class="scale-btn" on:click={() => scalePreset(2)} aria-label="Double">2x</button>
        <button class="scale-btn" on:click={() => scalePreset(3)} aria-label="Triple">3x</button>
        <input
          type="number"
          class="scale-input"
          min="0.25"
          max="10"
          step="0.25"
          value={state.scaleFactor}
          on:change={handleScaleInput}
          aria-label="Custom scale factor"
        />
      </div>
    </div>

    {#if recipe.description}
      <p class="recipe-description">{recipe.description}</p>
    {/if}

    <div class="recipe-body" class:two-column={isSplit}>
      <section class="ingredients-section">
        <div class="section-header">
          <h2>Ingredients</h2>
          <button class="reset-btn" on:click={resetCrossOff} aria-label="Reset ingredient checks">
            Reset
          </button>
        </div>
        <ul class="ingredient-list" role="list">
          {#each ingredients as ing, i}
            <li
              class="ingredient-item {state.crossedOff.has(i) ? 'crossed-off' : ''}"
              role="listitem"
            >
              <button
                class="ingredient-check"
                on:click={() => toggleIngredientCrossOff(i)}
                aria-label="Toggle {ing.name}"
                aria-pressed={state.crossedOff.has(i)}
              >
                <span class="check-box">{state.crossedOff.has(i) ? '\u2713' : ''}</span>
                <span class="ingredient-text">
                  {#if ing.displayQty}
                    <strong class="qty">{ing.displayQty}</strong>
                  {/if}
                  {#if ing.unit}
                    <span class="unit">{ing.unit}</span>
                  {/if}
                  <span class="name">{ing.name}</span>
                  {#if ing.note}
                    <span class="note">({ing.note})</span>
                  {/if}
                </span>
              </button>
            </li>
          {/each}
        </ul>
      </section>

      <section class="steps-section">
        <div class="section-header">
          <h2>{state.viewMode === 'steps' ? 'Step-by-Step' : 'Instructions'}</h2>
          {#if state.highlightedStep !== null}
            <div class="step-nav">
              <button
                on:click={prevStep}
                disabled={state.highlightedStep <= 0}
                aria-label="Previous step"
              >
                <Icon name="chevron-left" size={16} />
              </button>
              <span class="step-counter"
                >{(state.highlightedStep ?? 0) + 1} / {recipe.steps.length}</span
              >
              <button
                on:click={nextStep}
                disabled={state.highlightedStep >= recipe.steps.length - 1}
                aria-label="Next step"
              >
                <Icon name="chevron-right" size={16} />
              </button>
            </div>
          {/if}
        </div>

        {#if state.viewMode === 'steps' && state.highlightedStep !== null}
          <div class="single-step">
            <div class="step-number">{(state.highlightedStep ?? 0) + 1}</div>
            <p class="step-text">{recipe.steps[state.highlightedStep ?? 0]?.text ?? ''}</p>
          </div>
        {:else}
          <ol class="step-list">
            {#each recipe.steps as step}
              <li class="step-item {state.highlightedStep === step.index ? 'highlighted' : ''}">
                <button
                  class="step-btn"
                  on:click={() =>
                    highlightStep(state.highlightedStep === step.index ? null : step.index)}
                  aria-label="Highlight step {step.index + 1}"
                >
                  <span class="step-num">{step.index + 1}</span>
                  <span class="step-content">{step.text}</span>
                </button>
              </li>
            {/each}
          </ol>
        {/if}
      </section>
    </div>

    {#if recipe.notes.length > 0}
      <section class="notes-section">
        <h2>Notes</h2>
        <ul class="notes-list">
          {#each recipe.notes as note}
            <li>{note}</li>
          {/each}
        </ul>
      </section>
    {/if}
  </div>
{/if}

<style>
  .recipe-card {
    padding: 1.5rem;
    max-width: 800px;
    margin: 0 auto;
  }
  .recipe-header {
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 1rem;
  }
  .recipe-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
    color: var(--color-text);
  }
  .recipe-source {
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }
  .recipe-meta {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
  }
  .meta-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.8rem;
    color: var(--color-text-secondary);
    background: var(--color-bg-secondary);
    padding: 2px 8px;
    border-radius: 4px;
  }
  .recipe-tags {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
  }
  .tag-badge {
    font-size: 0.75rem;
    color: var(--color-accent);
    background: var(--color-accent-bg, rgba(var(--accent-rgb, 99, 102, 241), 0.1));
    padding: 1px 6px;
    border-radius: 3px;
  }
  .recipe-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }
  .view-modes {
    display: flex;
    gap: 2px;
    background: var(--color-bg-secondary);
    border-radius: 6px;
    padding: 2px;
  }
  .mode-btn {
    padding: 4px 12px;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    color: var(--color-text-secondary);
  }
  .mode-btn.active {
    background: var(--color-bg);
    color: var(--color-text);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  .scale-controls {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .scale-label {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin-right: 4px;
  }
  .scale-btn {
    padding: 2px 8px;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
    color: var(--color-text-secondary);
  }
  .scale-btn:hover {
    background: var(--color-bg-secondary);
  }
  .scale-input {
    width: 50px;
    padding: 2px 4px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-size: 0.8rem;
    background: var(--color-bg);
    color: var(--color-text);
    text-align: center;
  }
  .recipe-description {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    margin-bottom: 1rem;
    line-height: 1.5;
  }
  .recipe-body {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .recipe-body.two-column {
    flex-direction: row;
  }
  .two-column .ingredients-section {
    flex: 0 0 35%;
    border-right: 1px solid var(--color-border);
    padding-right: 1rem;
  }
  .two-column .steps-section {
    flex: 1;
  }
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  .section-header h2 {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
    color: var(--color-text);
  }
  .reset-btn {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    background: none;
    border: none;
    cursor: pointer;
    text-decoration: underline;
  }
  .ingredient-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .ingredient-item {
    border-bottom: 1px solid var(--color-border-light, var(--color-border));
  }
  .ingredient-item.crossed-off {
    opacity: 0.4;
  }
  .ingredient-item.crossed-off .ingredient-text {
    text-decoration: line-through;
  }
  .ingredient-check {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
    padding: 6px 4px;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    color: var(--color-text);
    font-size: 0.9rem;
    line-height: 1.4;
  }
  .check-box {
    flex: 0 0 18px;
    height: 18px;
    border: 1.5px solid var(--color-border);
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: var(--color-accent);
    margin-top: 1px;
  }
  .qty {
    color: var(--color-accent);
    margin-right: 2px;
  }
  .unit {
    color: var(--color-text-secondary);
    margin-right: 2px;
  }
  .note {
    color: var(--color-text-muted);
    font-style: italic;
    font-size: 0.85em;
  }
  .step-list {
    padding-left: 0;
    margin: 0;
    list-style: none;
    counter-reset: step;
  }
  .step-item {
    margin-bottom: 2px;
    border-radius: 6px;
    transition: background 0.15s;
  }
  .step-item.highlighted {
    background: var(--color-accent-bg, rgba(var(--accent-rgb, 99, 102, 241), 0.08));
  }
  .step-btn {
    display: flex;
    gap: 10px;
    width: 100%;
    padding: 8px;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    color: var(--color-text);
    font-size: 0.9rem;
    line-height: 1.5;
    border-radius: 6px;
  }
  .step-btn:hover {
    background: var(--color-bg-secondary);
  }
  .step-num {
    flex: 0 0 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--color-bg-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.8rem;
    color: var(--color-text-secondary);
    margin-top: 1px;
  }
  .highlighted .step-num {
    background: var(--color-accent);
    color: white;
  }
  .single-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    text-align: center;
  }
  .single-step .step-number {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--color-accent);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }
  .single-step .step-text {
    font-size: 1.2rem;
    line-height: 1.6;
    color: var(--color-text);
    max-width: 500px;
  }
  .step-nav {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .step-nav button {
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 2px 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    color: var(--color-text-secondary);
  }
  .step-nav button:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .step-counter {
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }
  .notes-section {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
  }
  .notes-section h2 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
    color: var(--color-text);
  }
  .notes-list {
    padding-left: 1.25rem;
    margin: 0;
  }
  .notes-list li {
    font-size: 0.85rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin-bottom: 4px;
  }
</style>
