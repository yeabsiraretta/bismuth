<script lang="ts">
  import { saveCourseAction } from '../../stores/courseStore';
  import type { Course } from '../../types/course';

  export let onCreated: ((course: Course) => void) | undefined = undefined;
  export let onCancel: (() => void) | undefined = undefined;

  let name = '';
  let subject = '';
  let examDate = '';
  let totalTopics = 10;
  let folderPath = '';
  let saving = false;
  let errors: Record<string, string> = {};

  function validate(): boolean {
    errors = {};
    if (!name.trim()) errors.name = 'Course name is required';
    if (!subject.trim()) errors.subject = 'Subject is required';
    if (!folderPath.trim()) errors.folderPath = 'Folder path is required';
    if (totalTopics < 1) errors.totalTopics = 'Must be at least 1';
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validate() || saving) return;
    saving = true;
    const course: Course = {
      id: crypto.randomUUID(),
      name: name.trim(),
      subject: subject.trim(),
      examDate: examDate || null,
      totalTopics,
      folderPath: folderPath.trim(),
      status: 'active',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };
    await saveCourseAction(course);
    saving = false;
    onCreated?.(course);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onCancel?.();
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div class="dialog-overlay" on:click|self={() => onCancel?.()} on:keydown={handleKeydown} role="presentation">
  <div
    class="dialog"
    role="dialog"
    aria-labelledby="new-course-title"
    aria-modal="true"
    tabindex="-1"
    on:keydown={handleKeydown}
  >
    <h3 id="new-course-title" class="dialog-title">New Course</h3>

    <label class="field">
      <span class="field-label">Course name <span aria-hidden="true">*</span></span>
      <input class="field-input" type="text" bind:value={name} placeholder="e.g. CompTIA Security+" />
      {#if errors.name}<span class="field-error">{errors.name}</span>{/if}
    </label>

    <label class="field">
      <span class="field-label">Subject <span aria-hidden="true">*</span></span>
      <input class="field-input" type="text" bind:value={subject} placeholder="e.g. Cybersecurity" />
      {#if errors.subject}<span class="field-error">{errors.subject}</span>{/if}
    </label>

    <label class="field">
      <span class="field-label">Topic notes folder <span aria-hidden="true">*</span></span>
      <input class="field-input" type="text" bind:value={folderPath} placeholder="e.g. Courses/Security+" />
      {#if errors.folderPath}<span class="field-error">{errors.folderPath}</span>{/if}
    </label>

    <label class="field">
      <span class="field-label">Total topics</span>
      <input class="field-input" type="number" bind:value={totalTopics} min="1" max="500" />
      {#if errors.totalTopics}<span class="field-error">{errors.totalTopics}</span>{/if}
    </label>

    <label class="field">
      <span class="field-label">Exam date (optional)</span>
      <input class="field-input" type="date" bind:value={examDate} />
    </label>

    <div class="dialog-actions">
      <button class="action-btn secondary" on:click={() => onCancel?.()}>Cancel</button>
      <button class="action-btn primary" on:click={handleSubmit} disabled={saving}>
        {saving ? 'Creating…' : 'Create Course'}
      </button>
    </div>
  </div>
</div>

<style>
  .dialog-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .dialog { background: var(--background-primary); border: 1px solid var(--border-color); border-radius: var(--radius-l); padding: var(--spacing-l); width: 360px; max-width: 90vw; display: flex; flex-direction: column; gap: var(--spacing-m); }
  .dialog-title { margin: 0; font-size: var(--font-normal); font-weight: var(--font-semibold); }
  .field { display: flex; flex-direction: column; gap: 4px; }
  .field-label { font-size: var(--font-smallest); font-weight: var(--font-medium); color: var(--text-muted); }
  .field-input { padding: var(--spacing-xs) var(--spacing-s); border: 1px solid var(--border-color); border-radius: var(--radius-s); background: var(--background-modifier-form-field); color: var(--text-normal); font-size: var(--font-smaller); }
  .field-input:focus { outline: none; border-color: var(--interactive-accent); }
  .field-error { font-size: 10px; color: var(--text-error); }
  .dialog-actions { display: flex; justify-content: flex-end; gap: var(--spacing-s); margin-top: var(--spacing-xs); }
  .action-btn { padding: var(--spacing-xs) var(--spacing-m); font-size: var(--font-smaller); border-radius: var(--radius-s); cursor: pointer; border: 1px solid var(--border-color); }
  .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .action-btn.secondary { background: var(--background-modifier-hover); color: var(--text-muted); }
  .action-btn.primary { background: var(--interactive-accent); color: var(--text-on-accent); border-color: var(--interactive-accent); font-weight: var(--font-medium); }
</style>
