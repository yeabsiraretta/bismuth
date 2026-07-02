<script lang="ts">
  /**
   * NutritionLogger — log meals with macros for a given date.
   * Shows daily summary and list of meals with delete support.
   * All persistence goes through gymStore.updateNutritionEntry.
   */
  import { onMount } from 'svelte';
  import { log } from '@/utils/logger';
  import { todayNutrition, loadTodayNutrition, updateNutritionEntry } from '../stores/gymStore';
  import { deleteNutrition } from '../services/gym';
  import type { NutritionEntry } from '../types/gym';

  export let vaultRoot: string;
  export let vaultId: string;

  let selectedDate = new Date().toISOString().slice(0, 10);

  // Form state
  let mealName = '';
  let calories: number | undefined;
  let proteinG: number | undefined;
  let carbsG: number | undefined;
  let fatG: number | undefined;
  let isSubmitting = false;
  let formError: string | null = null;

  $: entries = $todayNutrition;

  $: totalCalories = entries.reduce((sum, e) => sum + (e.calories ?? 0), 0);
  $: totalProtein = entries.reduce((sum, e) => sum + (e.proteinG ?? 0), 0);
  $: totalCarbs = entries.reduce((sum, e) => sum + (e.carbsG ?? 0), 0);
  $: totalFat = entries.reduce((sum, e) => sum + (e.fatG ?? 0), 0);

  async function handleDateChange(): Promise<void> {
    await loadTodayNutrition(vaultRoot, vaultId);
  }

  async function handleSubmit(): Promise<void> {
    const name = mealName.trim();
    if (!name) {
      formError = 'Meal name is required.';
      return;
    }
    formError = null;
    isSubmitting = true;
    try {
      await updateNutritionEntry(
        vaultRoot,
        vaultId,
        selectedDate,
        name,
        calories,
        proteinG,
        carbsG,
        fatG
      );
      mealName = '';
      calories = undefined;
      proteinG = undefined;
      carbsG = undefined;
      fatG = undefined;
      log.info('NutritionLogger: entry added', { mealName: name });
    } catch (err) {
      formError = `Failed to save: ${err}`;
      log.error('NutritionLogger: add failed', err as Error);
    } finally {
      isSubmitting = false;
    }
  }

  async function handleDelete(entry: NutritionEntry): Promise<void> {
    try {
      await deleteNutrition(vaultRoot, vaultId, entry.id);
      todayNutrition.update((list) => list.filter((e) => e.id !== entry.id));
      log.info('NutritionLogger: entry deleted', { id: entry.id });
    } catch (err) {
      log.error('NutritionLogger: delete failed', err as Error);
    }
  }

  function handleFormKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') void handleSubmit();
  }

  onMount(() => {
    loadTodayNutrition(vaultRoot, vaultId);
  });
</script>

<div class="nutrition-logger">
  <div class="date-row">
    <label class="date-label" for="nutrition-date">Date</label>
    <input
      id="nutrition-date"
      type="date"
      class="date-input"
      bind:value={selectedDate}
      on:change={handleDateChange}
      aria-label="Nutrition log date"
    />
  </div>

  <section class="add-meal-form" aria-label="Add meal">
    <h4 class="form-title">Add Meal</h4>
    <div class="form-row">
      <input
        type="text"
        class="form-input form-input--wide"
        placeholder="Meal name"
        bind:value={mealName}
        on:keydown={handleFormKeydown}
        aria-label="Meal name"
      />
    </div>
    <div class="form-row form-row--macros">
      <label class="macro-label">
        <span>kcal</span>
        <input
          type="number"
          class="macro-input"
          min="0"
          bind:value={calories}
          aria-label="Calories"
          placeholder="0"
        />
      </label>
      <label class="macro-label">
        <span>Protein (g)</span>
        <input
          type="number"
          class="macro-input"
          min="0"
          step="0.1"
          bind:value={proteinG}
          aria-label="Protein in grams"
          placeholder="0"
        />
      </label>
      <label class="macro-label">
        <span>Carbs (g)</span>
        <input
          type="number"
          class="macro-input"
          min="0"
          step="0.1"
          bind:value={carbsG}
          aria-label="Carbohydrates in grams"
          placeholder="0"
        />
      </label>
      <label class="macro-label">
        <span>Fat (g)</span>
        <input
          type="number"
          class="macro-input"
          min="0"
          step="0.1"
          bind:value={fatG}
          aria-label="Fat in grams"
          placeholder="0"
        />
      </label>
    </div>
    {#if formError}
      <div class="form-error" role="alert">{formError}</div>
    {/if}
    <button
      class="submit-btn"
      disabled={isSubmitting}
      on:click={handleSubmit}
      aria-label="Add meal entry">{isSubmitting ? 'Saving...' : 'Add Meal'}</button
    >
  </section>

  {#if entries.length > 0}
    <section class="daily-summary" aria-label="Daily nutrition summary">
      <h4 class="summary-title">Daily Totals</h4>
      <div class="summary-row">
        <span class="summary-item"><strong>{totalCalories}</strong> kcal</span>
        <span class="summary-item"><strong>{totalProtein.toFixed(1)}</strong> g protein</span>
        <span class="summary-item"><strong>{totalCarbs.toFixed(1)}</strong> g carbs</span>
        <span class="summary-item"><strong>{totalFat.toFixed(1)}</strong> g fat</span>
      </div>
    </section>

    <section class="meal-list" aria-label="Logged meals">
      <h4 class="list-title">Meals</h4>
      <ul class="meals">
        {#each entries as entry (entry.id)}
          <li class="meal-item">
            <div class="meal-main">
              <span class="meal-name">{entry.mealName}</span>
              {#if entry.calories}
                <span class="meal-calories">{entry.calories} kcal</span>
              {/if}
            </div>
            <div class="meal-macros">
              {#if entry.proteinG}<span>{entry.proteinG.toFixed(0)}g P</span>{/if}
              {#if entry.carbsG}<span>{entry.carbsG.toFixed(0)}g C</span>{/if}
              {#if entry.fatG}<span>{entry.fatG.toFixed(0)}g F</span>{/if}
            </div>
            <button
              class="delete-btn"
              on:click={() => handleDelete(entry)}
              aria-label="Delete {entry.mealName}"
              title="Delete meal">&#10005;</button
            >
          </li>
        {/each}
      </ul>
    </section>
  {:else}
    <div class="empty-state">
      <p class="empty-text">No meals logged for {selectedDate}.</p>
    </div>
  {/if}
</div>

<style>
  .nutrition-logger {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
    padding: var(--spacing-m);
    overflow-y: auto;
  }
  .date-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
  }
  .date-label {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
  }
  .date-input {
    padding: var(--spacing-xs) var(--spacing-s);
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    font-size: var(--font-ui-small);
  }
  .add-meal-form {
    background: var(--background-secondary);
    border-radius: var(--radius-m);
    padding: var(--spacing-m);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
  }
  .form-title,
  .summary-title,
  .list-title {
    font-size: var(--font-ui-small);
    font-weight: 600;
    color: var(--text-normal);
    margin: 0;
  }
  .form-row {
    display: flex;
    gap: var(--spacing-s);
  }
  .form-row--macros {
    flex-wrap: wrap;
    gap: var(--spacing-s);
  }
  .form-input {
    padding: var(--spacing-xs) var(--spacing-s);
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    font-size: var(--font-ui-small);
  }
  .form-input--wide {
    flex: 1;
  }
  .macro-label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: var(--font-smallest);
    color: var(--text-muted);
  }
  .macro-input {
    width: 70px;
    padding: var(--spacing-xs);
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    font-size: var(--font-ui-small);
  }
  .form-error {
    font-size: var(--font-ui-smaller);
    color: var(--text-error);
  }
  .submit-btn {
    align-self: flex-start;
    padding: var(--spacing-s) var(--spacing-m);
    background: var(--interactive-accent);
    color: var(--text-on-accent, #fff);
    border: none;
    border-radius: var(--radius-s);
    cursor: pointer;
    font-size: var(--font-ui-small);
    font-weight: 500;
  }
  .submit-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .daily-summary {
    padding: var(--spacing-s) 0;
    border-top: 1px solid var(--background-modifier-border);
  }
  .summary-row {
    display: flex;
    gap: var(--spacing-m);
    flex-wrap: wrap;
    margin-top: var(--spacing-xs);
  }
  .summary-item {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
  }
  .meal-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
  }
  .meals {
    list-style: none;
    margin: var(--spacing-xs) 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  .meal-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-s);
    background: var(--background-secondary);
    border-radius: var(--radius-s);
  }
  .meal-main {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    flex: 1;
  }
  .meal-name {
    font-size: var(--font-ui-small);
    color: var(--text-normal);
    font-weight: 500;
  }
  .meal-calories {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
  }
  .meal-macros {
    display: flex;
    gap: var(--spacing-xs);
    font-size: var(--font-smallest);
    color: var(--text-faint);
  }
  .delete-btn {
    background: none;
    border: none;
    color: var(--text-faint);
    cursor: pointer;
    padding: 2px 4px;
    border-radius: var(--radius-s);
    font-size: 11px;
  }
  .delete-btn:hover {
    color: var(--text-error);
    background: var(--background-modifier-error);
  }
  .empty-state {
    text-align: center;
    padding: var(--spacing-l) 0;
  }
  .empty-text {
    color: var(--text-muted);
    font-size: var(--font-ui-small);
  }
</style>
