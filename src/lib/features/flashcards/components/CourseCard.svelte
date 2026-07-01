<script lang="ts">
  import type { Course } from '../types/course';
  import type { CourseProgress } from '../types/course';

  export let course: Course;
  export let progress: CourseProgress | null = null;
  export let active = false;
  export let onSelect: () => void = () => {};

  $: examDays = progress?.daysUntilExam;
  $: pct = progress?.masteredPercent ?? 0;

  function examBadgeClass(days: number | null): string {
    if (days === null) return 'no-date';
    if (days <= 7) return 'urgent';
    if (days <= 30) return 'soon';
    return 'later';
  }
</script>

<button
  class="course-card"
  class:active
  on:click={onSelect}
  aria-pressed={active}
  title="Open {course.name}"
>
  <div class="card-header">
    <span class="course-name">{course.name}</span>
    {#if examDays !== null && examDays !== undefined}
      <span class="exam-badge {examBadgeClass(examDays)}">
        {examDays === 0 ? 'Today!' : `${examDays}d`}
      </span>
    {/if}
  </div>

  <div class="course-subject">{course.subject}</div>

  <div class="progress-row">
    <div
      class="progress-bar"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div class="progress-fill" style="width:{pct}%"></div>
    </div>
    <span class="progress-label">{pct}%</span>
  </div>

  <div class="card-meta">
    <span>{progress?.masteredTopics ?? 0}/{progress?.totalTopics ?? course.totalTopics} topics</span
    >
    {#if progress?.totalCards}
      <span>{progress.totalCards} cards</span>
    {/if}
  </div>
</button>

<style>
  .course-card {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-s);
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-m);
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: border-color 0.12s;
  }
  .course-card:hover,
  .course-card.active {
    border-color: var(--interactive-accent);
  }
  .course-card.active {
    background: var(--background-modifier-hover);
  }
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-xs);
  }
  .course-name {
    font-size: var(--font-smaller);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .exam-badge {
    font-size: 10px;
    font-weight: var(--font-semibold);
    padding: 1px 5px;
    border-radius: var(--radius-s);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .exam-badge.urgent {
    background: #fee2e2;
    color: #dc2626;
  }
  .exam-badge.soon {
    background: #fef3c7;
    color: #d97706;
  }
  .exam-badge.later {
    background: var(--background-modifier-hover);
    color: var(--text-muted);
  }
  .exam-badge.no-date {
    display: none;
  }
  .course-subject {
    font-size: var(--font-smallest);
    color: var(--text-muted);
  }
  .progress-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }
  .progress-bar {
    flex: 1;
    height: 4px;
    background: var(--background-modifier-border);
    border-radius: 2px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: var(--interactive-accent);
    border-radius: 2px;
    transition: width 0.3s;
  }
  .progress-label {
    font-size: 10px;
    color: var(--text-muted);
    width: 28px;
    text-align: right;
    flex-shrink: 0;
  }
  .card-meta {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: var(--text-faint);
  }
</style>
