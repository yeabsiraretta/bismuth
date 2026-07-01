<script lang="ts">
  /**
   * ExercisePicker — search/filter exercises and add custom ones.
   */
  import { onMount } from 'svelte';
  import { log } from '@/utils/logger';
  import { exerciseList, loadExercises, invalidateExerciseCache } from '../stores/gymStore';
  import * as gymService from '../services/gym';
  import type { Exercise } from '../types/gym';

  export let vaultRoot: string;
  export let vaultId: string;
  export let onSelect: (exercise: Exercise) => void;

  let searchText = '';
  let filterMuscleGroup = '';
  let showCustomForm = false;
  let customName = '';
  let customMuscleGroup = 'chest';
  let customEquipment = 'barbell';
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let filteredExercises: Exercise[] = [];

  const muscleGroups = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'full_body'];
  const equipmentTypes = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other'];

  $: allExercises = $exerciseList;

  $: {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filteredExercises = allExercises.filter(ex => {
        const matchesSearch = !searchText || ex.name.toLowerCase().includes(searchText.toLowerCase());
        const matchesGroup = !filterMuscleGroup || ex.muscleGroup === filterMuscleGroup;
        return matchesSearch && matchesGroup;
      });
    }, 300);
  }

  onMount(async () => {
    if ($exerciseList.length === 0) {
      await loadExercises(vaultRoot);
    }
    filteredExercises = $exerciseList;
  });

  function handleKeydown(event: KeyboardEvent, exercise: Exercise) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(exercise);
    }
  }

  async function saveCustomExercise() {
    if (!customName.trim()) return;
    try {
      await gymService.createExercise(vaultRoot, vaultId, customName.trim(), customMuscleGroup, customEquipment);
      await invalidateExerciseCache(vaultRoot);
      customName = '';
      showCustomForm = false;
      log.info('Custom exercise created', { name: customName });
    } catch (err) {
      log.error('Failed to create custom exercise', err as Error);
    }
  }
</script>

<div class="exercise-picker" role="search">
  <input
    type="text"
    class="search-input"
    placeholder="Search exercises..."
    bind:value={searchText}
    aria-label="Search exercises"
  />

  <div class="filter-chips" role="group" aria-label="Filter by muscle group">
    <button
      class="chip {filterMuscleGroup === '' ? 'active' : ''}"
      on:click={() => (filterMuscleGroup = '')}
    >All</button>
    {#each muscleGroups as group}
      <button
        class="chip {filterMuscleGroup === group ? 'active' : ''}"
        on:click={() => (filterMuscleGroup = filterMuscleGroup === group ? '' : group)}
        role="checkbox"
        aria-checked={filterMuscleGroup === group}
      >{group.replace('_', ' ')}</button>
    {/each}
  </div>

  <ul class="exercise-list" role="listbox" aria-label="Exercises">
    {#each filteredExercises as exercise (exercise.id)}
      <li
        class="exercise-item"
        role="option"
        aria-selected="false"
        tabindex="0"
        on:click={() => onSelect(exercise)}
        on:keydown={(e) => handleKeydown(e, exercise)}
      >
        <span class="exercise-name">{exercise.name}</span>
        <div class="exercise-meta">
          <span class="muscle-badge">{exercise.muscleGroup}</span>
          {#if exercise.isCustom}
            <span class="custom-badge">Custom</span>
          {/if}
        </div>
      </li>
    {/each}
    {#if filteredExercises.length === 0}
      <li class="no-results">No exercises found</li>
    {/if}
  </ul>

  <div class="custom-exercise-section">
    {#if !showCustomForm}
      <button class="add-custom-btn" on:click={() => (showCustomForm = true)}>+ Add Custom Exercise</button>
    {:else}
      <div class="custom-form">
        <input
          type="text"
          placeholder="Exercise name"
          bind:value={customName}
          class="form-input"
          aria-label="Custom exercise name"
        />
        <select bind:value={customMuscleGroup} class="form-select" aria-label="Muscle group">
          {#each muscleGroups as g}
            <option value={g}>{g.replace('_', ' ')}</option>
          {/each}
        </select>
        <select bind:value={customEquipment} class="form-select" aria-label="Equipment">
          {#each equipmentTypes as eq}
            <option value={eq}>{eq}</option>
          {/each}
        </select>
        <div class="form-actions">
          <button class="save-btn" on:click={saveCustomExercise} disabled={!customName.trim()}>Save</button>
          <button class="cancel-btn" on:click={() => (showCustomForm = false)}>Cancel</button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .exercise-picker { display: flex; flex-direction: column; gap: var(--spacing-s); height: 100%; }
  .search-input {
    width: 100%; padding: var(--spacing-s) var(--spacing-m);
    background: var(--background-secondary); border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m); color: var(--text-normal); font-size: var(--font-ui-small);
  }
  .filter-chips { display: flex; flex-wrap: wrap; gap: var(--spacing-xs); }
  .chip {
    padding: 2px var(--spacing-s); border-radius: 999px; font-size: var(--font-smallest);
    background: var(--background-secondary); border: 1px solid var(--background-modifier-border);
    color: var(--text-muted); cursor: pointer;
  }
  .chip.active { background: var(--interactive-accent); color: var(--text-on-accent); border-color: var(--interactive-accent); }
  .exercise-list { list-style: none; padding: 0; margin: 0; overflow-y: auto; flex: 1; }
  .exercise-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: var(--spacing-s) var(--spacing-m); cursor: pointer; border-radius: var(--radius-s);
  }
  .exercise-item:hover, .exercise-item:focus { background: var(--background-modifier-hover); outline: none; }
  .exercise-name { font-size: var(--font-ui-small); color: var(--text-normal); }
  .exercise-meta { display: flex; gap: var(--spacing-xs); align-items: center; }
  .muscle-badge {
    font-size: var(--font-smallest); background: var(--background-secondary);
    color: var(--text-muted); padding: 1px var(--spacing-xs); border-radius: var(--radius-s);
  }
  .custom-badge {
    font-size: var(--font-smallest); background: var(--color-accent, var(--interactive-accent));
    color: var(--text-on-accent); padding: 1px var(--spacing-xs); border-radius: var(--radius-s);
  }
  .no-results { padding: var(--spacing-m); color: var(--text-muted); text-align: center; font-size: var(--font-ui-small); }
  .custom-exercise-section { border-top: 1px solid var(--background-modifier-border); padding-top: var(--spacing-s); }
  .add-custom-btn {
    width: 100%; padding: var(--spacing-s); background: transparent;
    border: 1px dashed var(--background-modifier-border); border-radius: var(--radius-m);
    color: var(--text-muted); cursor: pointer; font-size: var(--font-ui-small);
  }
  .add-custom-btn:hover { border-color: var(--interactive-accent); color: var(--interactive-accent); }
  .custom-form { display: flex; flex-direction: column; gap: var(--spacing-s); }
  .form-input, .form-select {
    padding: var(--spacing-s); background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border); border-radius: var(--radius-s);
    color: var(--text-normal); font-size: var(--font-ui-small);
  }
  .form-actions { display: flex; gap: var(--spacing-s); }
  .save-btn {
    flex: 1; padding: var(--spacing-s); background: var(--interactive-accent);
    color: var(--text-on-accent); border: none; border-radius: var(--radius-s); cursor: pointer;
  }
  .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .cancel-btn {
    padding: var(--spacing-s) var(--spacing-m); background: transparent;
    border: 1px solid var(--background-modifier-border); border-radius: var(--radius-s);
    color: var(--text-muted); cursor: pointer;
  }
</style>
