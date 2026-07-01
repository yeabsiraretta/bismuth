<script lang="ts">
  import { onMount } from 'svelte';
  import {
    courses, activeCourseId, courseProgress, courseTopics,
    loadCourses, setActiveCourse, markTopicMastered, isCourseLoading,
  } from '../stores/courseStore';
  import CourseCard from './CourseCard.svelte';
  import ExamProgressView from './ExamProgressView.svelte';

  let showNewDialog = false;

  onMount(() => {
    loadCourses();
  });

  function handleSelectCourse(id: string) {
    setActiveCourse(id);
  }
</script>

<div class="course-panel">
  <div class="panel-toolbar">
    <span class="section-title">Study Vault</span>
    <button class="action-btn primary" on:click={() => (showNewDialog = true)}>+ Course</button>
  </div>

  {#if $isCourseLoading}
    <div class="empty-state">Loading courses…</div>
  {:else if $courses.length === 0}
    <div class="empty-state">
      <p>No courses yet.</p>
      <p class="hint">Add a course to start tracking your exam prep.</p>
      <button class="action-btn primary" on:click={() => (showNewDialog = true)}>Create first course</button>
    </div>
  {:else}
    <div class="course-list">
      {#each $courses as course (course.id)}
        <CourseCard
          {course}
          active={$activeCourseId === course.id}
          onSelect={() => handleSelectCourse(course.id)}
        />
      {/each}
    </div>

    {#if $activeCourseId && $courseProgress}
      <div class="course-detail">
        <ExamProgressView progress={$courseProgress} topics={$courseTopics} courseId={$activeCourseId} />
      </div>
    {/if}
  {/if}

  {#if showNewDialog}
    {#await import('./dialogs/NewCourseDialog.svelte') then m}
      <svelte:component
        this={m.default}
        onCreated={() => { showNewDialog = false; loadCourses(); }}
        onCancel={() => (showNewDialog = false)}
      />
    {/await}
  {/if}
</div>

<style>
  .course-panel { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
  .panel-toolbar { display: flex; align-items: center; justify-content: space-between; padding: var(--spacing-xs) var(--spacing-m); border-bottom: 1px solid var(--border-color); }
  .section-title { font-size: var(--font-smallest); font-weight: var(--font-semibold); text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
  .course-list { display: flex; flex-direction: column; gap: var(--spacing-xs); padding: var(--spacing-xs); overflow-y: auto; max-height: 40%; }
  .course-detail { flex: 1; overflow-y: auto; border-top: 1px solid var(--border-color); }
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: var(--spacing-s); padding: var(--spacing-xl); text-align: center; }
  .empty-state p { margin: 0; font-size: var(--font-smaller); color: var(--text-muted); }
  .hint { font-size: var(--font-smallest); color: var(--text-faint); }
  .action-btn { padding: 3px var(--spacing-s); font-size: var(--font-smallest); border-radius: var(--radius-s); cursor: pointer; border: 1px solid var(--border-color); }
  .action-btn.primary { background: var(--interactive-accent); color: var(--text-on-accent); border-color: var(--interactive-accent); font-weight: var(--font-medium); }
  .action-btn.primary:hover { filter: brightness(0.9); }
</style>
