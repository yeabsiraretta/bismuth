<script lang="ts">
  /**
   * WorkoutLogger — log exercises, sets, reps, and weight for today's session.
   */
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import {
    activeSession,
    exerciseList,
    isLoading,
    sessionStartTime,
    loadTodaySession,
    loadExercises,
    startSession,
    addSetToSession,
    finishSession,
  } from '../stores/gymStore';
  import ExercisePicker from './ExercisePicker.svelte';
  import type { Exercise, WorkoutSet } from '../types/gym';

  export let vaultRoot: string;
  export let vaultId: string;

  /** Local set rows grouped by exerciseId: exerciseId -> pending set rows */
  let sessionSets: Record<string, WorkoutSet[]> = {};
  let showPicker = false;
  let elapsedDisplay = '0:00';
  let intervalHandle: ReturnType<typeof setInterval> | null = null;
  let sessionNotes = '';

  $: session = $activeSession;
  $: today = new Date().toISOString().slice(0, 10);
  $: exercises = $exerciseList;

  $: if (session?.sets) {
    // Rebuild grouped sets from store
    sessionSets = session.sets.reduce<Record<string, WorkoutSet[]>>((acc, s) => {
      if (!acc[s.exerciseId]) acc[s.exerciseId] = [];
      acc[s.exerciseId] = [...acc[s.exerciseId], s];
      return acc;
    }, {});
  }

  function getExerciseName(exerciseId: string): string {
    return exercises.find(e => e.id === exerciseId)?.name ?? exerciseId;
  }

  function formatElapsed(startMs: number | null): string {
    if (!startMs) return '0:00';
    const elapsedMs = Date.now() - startMs;
    const minutes = Math.floor(elapsedMs / 60000);
    const seconds = Math.floor((elapsedMs % 60000) / 1000);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  onMount(async () => {
    await loadExercises(vaultRoot);
    await loadTodaySession(vaultRoot, vaultId);

    intervalHandle = setInterval(() => {
      elapsedDisplay = formatElapsed(get(sessionStartTime));
    }, 60_000);
  });

  onDestroy(() => {
    if (intervalHandle) clearInterval(intervalHandle);
  });

  async function handleStartWorkout() {
    await startSession(vaultRoot, vaultId);
    elapsedDisplay = '0:00';
    intervalHandle = setInterval(() => {
      elapsedDisplay = formatElapsed(get(sessionStartTime));
    }, 60_000);
  }

  async function handleAddExercise(exercise: Exercise) {
    if (!session) return;
    // Add a blank first set row for this exercise
    const existingCount = (sessionSets[exercise.id] ?? []).length;
    await addSetToSession(vaultRoot, vaultId, exercise.id, existingCount + 1);
    showPicker = false;
  }

  async function handleAddSet(exerciseId: string) {
    const existing = (sessionSets[exerciseId] ?? []).length;
    await addSetToSession(vaultRoot, vaultId, exerciseId, existing + 1);
  }

  async function handleFinishSession() {
    if (!session) return;
    await finishSession(vaultRoot, vaultId);
    if (intervalHandle) clearInterval(intervalHandle);
  }

  function handleSetKeydown(event: KeyboardEvent, exerciseId: string, isLast: boolean) {
    if (event.key === 'Enter' && isLast) {
      handleAddSet(exerciseId);
    }
  }
</script>

<div class="workout-logger">
  <div class="session-header">
    <h3 class="date-header">{today}</h3>
    {#if session}
      <span class="elapsed-timer" aria-live="polite">
        {elapsedDisplay}
      </span>
    {/if}
  </div>

  {#if $isLoading}
    <div class="loading-state">Loading...</div>
  {:else if !session}
    <div class="empty-state">
      <p>No workout logged for today.</p>
      <button class="start-btn" on:click={handleStartWorkout}>Start Workout</button>
    </div>
  {:else}
    <div class="session-content">
      {#each Object.entries(sessionSets) as [exerciseId, sets]}
        <section
          class="exercise-group"
          aria-label={getExerciseName(exerciseId)}
          role="group"
        >
          <h4 class="exercise-title">{getExerciseName(exerciseId)}</h4>
          {#each sets as set, idx}
            <div class="set-row">
              <span class="set-number">{idx + 1}</span>
              <input
                type="number"
                class="set-input"
                placeholder="Reps"
                value={set.reps ?? ''}
                min="0"
                aria-label="Reps for set {idx + 1}"
                on:keydown={(e) => handleSetKeydown(e, exerciseId, idx === sets.length - 1)}
              />
              <input
                type="number"
                class="set-input"
                placeholder="kg"
                value={set.weightKg ?? ''}
                step="0.5"
                aria-label="Weight (kg) for set {idx + 1}"
              />
            </div>
          {/each}
          <button
            class="add-set-btn"
            on:click={() => handleAddSet(exerciseId)}
            aria-label="Add set for {getExerciseName(exerciseId)}"
          >+ Add Set</button>
        </section>
      {/each}

      <button class="add-exercise-btn" on:click={() => (showPicker = !showPicker)}>
        {showPicker ? 'Cancel' : '+ Add Exercise'}
      </button>

      {#if showPicker}
        <div class="picker-container">
          <ExercisePicker {vaultRoot} {vaultId} onSelect={handleAddExercise} />
        </div>
      {/if}

      <textarea
        class="session-notes"
        placeholder="Session notes (optional)"
        bind:value={sessionNotes}
        rows="2"
        aria-label="Session notes"
      ></textarea>

      <button
        class="finish-btn"
        on:click={handleFinishSession}
        aria-label="Finish workout session"
      >Finish Workout</button>
    </div>
  {/if}
</div>

<style>
  .workout-logger { display: flex; flex-direction: column; gap: var(--spacing-m); padding: var(--spacing-m); height: 100%; overflow-y: auto; }
  .session-header { display: flex; justify-content: space-between; align-items: center; }
  .date-header { font-size: var(--font-ui-medium); font-weight: 600; color: var(--text-normal); margin: 0; }
  .elapsed-timer { font-size: var(--font-ui-small); color: var(--text-muted); font-variant-numeric: tabular-nums; }
  .loading-state, .empty-state { color: var(--text-muted); text-align: center; padding: var(--spacing-xl); }
  .start-btn {
    margin-top: var(--spacing-m); padding: var(--spacing-s) var(--spacing-l);
    background: var(--interactive-accent); color: var(--text-on-accent);
    border: none; border-radius: var(--radius-m); cursor: pointer; font-size: var(--font-ui-small);
  }
  .session-content { display: flex; flex-direction: column; gap: var(--spacing-m); }
  .exercise-group { background: var(--background-secondary); border-radius: var(--radius-m); padding: var(--spacing-m); }
  .exercise-title { font-size: var(--font-ui-small); font-weight: 600; color: var(--text-normal); margin: 0 0 var(--spacing-s); }
  .set-row { display: flex; align-items: center; gap: var(--spacing-s); margin-bottom: var(--spacing-xs); }
  .set-number { width: 20px; color: var(--text-muted); font-size: var(--font-ui-small); text-align: center; }
  .set-input {
    width: 80px; padding: var(--spacing-xs) var(--spacing-s);
    background: var(--background-primary); border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s); color: var(--text-normal); font-size: var(--font-ui-small);
  }
  .add-set-btn {
    margin-top: var(--spacing-xs); padding: 2px var(--spacing-s); background: transparent;
    border: 1px dashed var(--background-modifier-border); border-radius: var(--radius-s);
    color: var(--text-muted); cursor: pointer; font-size: var(--font-smallest);
  }
  .add-exercise-btn {
    padding: var(--spacing-s); background: transparent;
    border: 1px dashed var(--interactive-accent); border-radius: var(--radius-m);
    color: var(--interactive-accent); cursor: pointer;
  }
  .picker-container { border: 1px solid var(--background-modifier-border); border-radius: var(--radius-m); padding: var(--spacing-m); max-height: 300px; overflow-y: auto; }
  .session-notes {
    width: 100%; padding: var(--spacing-s); background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border); border-radius: var(--radius-s);
    color: var(--text-normal); font-size: var(--font-ui-small); resize: vertical;
  }
  .finish-btn {
    padding: var(--spacing-s) var(--spacing-l); background: var(--interactive-accent);
    color: var(--text-on-accent); border: none; border-radius: var(--radius-m);
    cursor: pointer; font-size: var(--font-ui-small); align-self: flex-start;
  }
</style>
