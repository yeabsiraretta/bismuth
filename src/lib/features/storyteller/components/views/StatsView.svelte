<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import {
    goalProgress,
    writingGoals,
    writingSprint,
    writingStreak,
    rangedSessions,
    totalWordsInRange,
    statsRange,
    updateGoals,
    startSprint,
    endSprint,
    cancelSprint,
    setStatsRange,
  } from '../../stores/statsStore';
  import { filteredEntities } from '../../stores/entityStore';
  import { activeStory } from '../../stores/storyStore';
  import { unresolvedSetups } from '../../stores/plotlineStore';
  import { analyzePacing, detectPlotHoles } from '../../services/statsService';
  import type { SceneEntity } from '../../types/entity';

  let sprintMinutes = 25;
  let editingGoals = false;
  let goalDaily = 500;
  let goalWeekly = 3500;
  let goalMonthly = 15000;

  $: scenes = $filteredEntities.filter((e) => e.type === 'scene') as unknown as SceneEntity[];
  $: pacing = analyzePacing(scenes);
  $: plotHoles = $activeStory
    ? detectPlotHoles($filteredEntities, $filteredEntities, $unresolvedSetups, $activeStory.id)
    : [];
  $: totalWords = $activeStory?.wordCount ?? scenes.reduce((s, sc) => s + (sc.wordCount ?? 0), 0);

  function handleStartSprint() {
    startSprint(sprintMinutes, totalWords);
  }
  function handleEndSprint() {
    endSprint(totalWords);
  }
  function saveGoals() {
    updateGoals({ dailyTarget: goalDaily, weeklyTarget: goalWeekly, monthlyTarget: goalMonthly });
    editingGoals = false;
  }

  function progressColor(p: number): string {
    return p >= 1 ? '#10b981' : p >= 0.5 ? '#f59e0b' : '#ef4444';
  }
</script>

<div class="sv-view">
  <div class="sv-header"><h3>Statistics</h3></div>

  <div class="sv-content">
    <div class="sv-section">
      <h4>Writing Goals</h4>
      <div class="sv-goals-rings">
        {#each [{ label: 'Today', value: $goalProgress.daily }, { label: 'This Week', value: $goalProgress.weekly }, { label: 'This Month', value: $goalProgress.monthly }] as ring}
          <div class="sv-ring">
            <svg viewBox="0 0 36 36" class="sv-ring-svg">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--background-modifier-border, #333)"
                stroke-width="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={progressColor(ring.value)}
                stroke-width="3"
                stroke-dasharray="{ring.value * 100}, 100"
                stroke-linecap="round"
              />
            </svg>
            <div class="sv-ring-label">{ring.label}</div>
            <div class="sv-ring-pct">{Math.round(ring.value * 100)}%</div>
          </div>
        {/each}
      </div>
      <button
        class="sv-btn-ghost"
        on:click={() => {
          editingGoals = !editingGoals;
          goalDaily = $writingGoals.dailyTarget;
          goalWeekly = $writingGoals.weeklyTarget;
          goalMonthly = $writingGoals.monthlyTarget;
        }}
      >
        <Icon name="settings" size={12} /> Edit Goals
      </button>
      {#if editingGoals}
        <div class="sv-goals-edit">
          <label>Daily <input type="number" bind:value={goalDaily} min={0} /></label>
          <label>Weekly <input type="number" bind:value={goalWeekly} min={0} /></label>
          <label>Monthly <input type="number" bind:value={goalMonthly} min={0} /></label>
          <button class="sv-btn-primary" on:click={saveGoals}>Save</button>
        </div>
      {/if}
    </div>

    <div class="sv-section">
      <h4>Writing Sprint</h4>
      {#if $writingSprint.isRunning}
        <div class="sv-sprint-active">
          <Icon name="play" size={16} />
          <span>Sprint in progress ({$writingSprint.durationMinutes} min)</span>
          <button class="sv-btn-primary" on:click={handleEndSprint}>End Sprint</button>
          <button class="sv-btn-ghost" on:click={cancelSprint}>Cancel</button>
        </div>
      {:else}
        <div class="sv-sprint-setup">
          <input
            type="number"
            class="sv-sprint-input"
            bind:value={sprintMinutes}
            min={1}
            max={120}
          />
          min
          <button class="sv-btn-primary" on:click={handleStartSprint}
            ><Icon name="play" size={12} /> Start</button
          >
        </div>
        {#if $writingSprint.wordsWritten > 0}
          <div class="sv-sprint-result">
            Last sprint: {$writingSprint.wordsWritten} words in {$writingSprint.durationMinutes} min
          </div>
        {/if}
      {/if}
    </div>

    <div class="sv-section">
      <div class="sv-section-header">
        <h4>Writing History</h4>
        <div class="sv-range-btns">
          {#each [7, 30, 90, 365] as r}
            <button class:active={$statsRange === r} on:click={() => setStatsRange(r)}
              >{r === 365 ? 'All' : `${r}d`}</button
            >
          {/each}
        </div>
      </div>
      <div class="sv-stat-row">
        <span>Total words</span><strong>{$totalWordsInRange.toLocaleString()}</strong>
      </div>
      <div class="sv-stat-row"><span>Sessions</span><strong>{$rangedSessions.length}</strong></div>
      <div class="sv-stat-row">
        <span>Streak</span><strong
          >{$writingStreak.currentDays} days (best: {$writingStreak.longestDays})</strong
        >
      </div>
      <div class="sv-bar-chart">
        {#each $rangedSessions.slice(-14) as session (session.date)}
          {@const maxWords = Math.max(...$rangedSessions.map((s) => s.wordsWritten), 1)}
          <div
            class="sv-bar"
            style="height: {(session.wordsWritten / maxWords) * 60}px"
            title="{session.date}: {session.wordsWritten} words"
          ></div>
        {/each}
      </div>
    </div>

    <div class="sv-section">
      <h4>Pacing Analysis</h4>
      {#each pacing.slice(0, 10) as p (p.sceneId)}
        <div class="sv-pacing-row">
          <span class="sv-pacing-name">{p.sceneName}</span>
          <span class="sv-pacing-wc">{p.wordCount}</span>
          <div class="sv-pacing-bar-wrap">
            <div
              class="sv-pacing-bar"
              style="width: {Math.min(
                100,
                (p.wordCount / Math.max(p.avgWordCount, 1)) * 50
              )}%; background: {p.deviation > 0.5
                ? '#f59e0b'
                : p.deviation < -0.5
                  ? '#ef4444'
                  : '#10b981'}"
            ></div>
          </div>
        </div>
      {/each}
      {#if pacing.length === 0}<div class="sv-empty">No scenes to analyze</div>{/if}
    </div>

    <div class="sv-section">
      <h4>Plot Hole Detection</h4>
      {#if plotHoles.length > 0}
        {#each plotHoles as hole (hole.id)}
          <div
            class="sv-hole"
            class:warning={hole.severity === 'warning'}
            class:error={hole.severity === 'error'}
          >
            <Icon
              name={hole.severity === 'error'
                ? 'alert-circle'
                : hole.severity === 'warning'
                  ? 'alert-triangle'
                  : 'info'}
              size={13}
            />
            <span>{hole.message}</span>
          </div>
        {/each}
      {:else}
        <div class="sv-no-holes"><Icon name="check-circle" size={14} /> No plot holes detected</div>
      {/if}
    </div>
  </div>
</div>

<style>
  .sv-view {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .sv-header {
    padding: 10px 14px;
    border-bottom: 1px solid var(--background-modifier-border, #333);
  }
  .sv-header h3 {
    margin: 0;
    font-size: 14px;
  }
  .sv-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px 14px;
  }
  .sv-section {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--background-modifier-border, #2a2a2a);
  }
  .sv-section h4 {
    margin: 0 0 10px;
    font-size: 13px;
  }
  .sv-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .sv-section-header h4 {
    margin: 0;
  }
  .sv-goals-rings {
    display: flex;
    gap: 16px;
    justify-content: center;
    margin-bottom: 10px;
  }
  .sv-ring {
    text-align: center;
    width: 70px;
  }
  .sv-ring-svg {
    width: 60px;
    height: 60px;
  }
  .sv-ring-label {
    font-size: 10px;
    opacity: 0.6;
    margin-top: 4px;
  }
  .sv-ring-pct {
    font-size: 14px;
    font-weight: 700;
  }
  .sv-goals-edit {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 8px;
    align-items: center;
  }
  .sv-goals-edit label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
  }
  .sv-goals-edit input {
    width: 60px;
    padding: 3px 6px;
    border: 1px solid var(--background-modifier-border, #444);
    border-radius: 3px;
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: 11px;
  }
  .sv-sprint-active {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .sv-sprint-setup {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .sv-sprint-input {
    width: 50px;
    padding: 4px 6px;
    border: 1px solid var(--background-modifier-border, #444);
    border-radius: 4px;
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: 12px;
  }
  .sv-sprint-result {
    font-size: 11px;
    opacity: 0.6;
    margin-top: 6px;
  }
  .sv-range-btns {
    display: flex;
    gap: 2px;
  }
  .sv-range-btns button {
    padding: 2px 8px;
    border: 1px solid var(--background-modifier-border, #444);
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 10px;
    border-radius: 3px;
  }
  .sv-range-btns button.active {
    background: var(--interactive-accent, #7c3aed);
    color: #fff;
    border-color: transparent;
  }
  .sv-stat-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    padding: 3px 0;
  }
  .sv-bar-chart {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 70px;
    margin-top: 8px;
  }
  .sv-bar {
    width: 14px;
    background: var(--interactive-accent, #7c3aed);
    border-radius: 2px 2px 0 0;
    min-height: 2px;
  }
  .sv-pacing-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    padding: 3px 0;
  }
  .sv-pacing-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sv-pacing-wc {
    width: 40px;
    text-align: right;
    opacity: 0.6;
  }
  .sv-pacing-bar-wrap {
    width: 80px;
    height: 6px;
    background: var(--background-modifier-border, #333);
    border-radius: 3px;
  }
  .sv-pacing-bar {
    height: 100%;
    border-radius: 3px;
  }
  .sv-hole {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding: 5px 0;
    font-size: 12px;
  }
  .sv-hole.warning {
    color: #f59e0b;
  }
  .sv-hole.error {
    color: #ef4444;
  }
  .sv-no-holes {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #10b981;
  }
  .sv-btn-primary {
    padding: 4px 10px;
    border: none;
    border-radius: 4px;
    background: var(--interactive-accent, #7c3aed);
    color: #fff;
    cursor: pointer;
    font-size: 11px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .sv-btn-ghost {
    display: flex;
    align-items: center;
    gap: 4px;
    border: none;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 11px;
  }
  .sv-empty {
    font-size: 11px;
    opacity: 0.4;
  }
</style>
