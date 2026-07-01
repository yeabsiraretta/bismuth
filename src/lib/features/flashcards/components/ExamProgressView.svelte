<script lang="ts">
  import type { CourseProgress, TopicMastery } from '../types/course';
  import { markTopicMastered } from '../stores/courseStore';

  export let progress: CourseProgress;
  export let topics: TopicMastery[] = [];
  export let courseId: string;

  async function toggleMastery(notePath: string, current: boolean) {
    await markTopicMastered(courseId, notePath, !current);
  }

  function topicName(path: string): string {
    return path.split('/').pop()?.replace(/\.md$/, '') ?? path;
  }
</script>

<div class="exam-progress">
  <!-- Exam countdown -->
  <div class="exam-header">
    {#if progress.daysUntilExam !== null}
      <div class="countdown" class:urgent={progress.daysUntilExam <= 7}>
        <span class="countdown-num">{progress.daysUntilExam}</span>
        <span class="countdown-label">days until exam</span>
      </div>
    {:else}
      <div class="no-date">No exam date set</div>
    {/if}

    <div class="mastery-summary">
      <div
        class="mastery-bar"
        role="progressbar"
        aria-valuenow={progress.masteredPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div class="mastery-fill" style="width:{progress.masteredPercent}%"></div>
      </div>
      <span class="mastery-label"
        >{progress.masteredTopics}/{progress.totalTopics} mastered ({progress.masteredPercent}%)</span
      >
    </div>
  </div>

  <!-- Topic list -->
  {#if topics.length > 0}
    <div class="topic-section">
      <h4 class="section-heading">Topics</h4>
      <ul class="topic-list" role="list">
        {#each topics as topic (topic.notePath)}
          <li class="topic-item" role="listitem">
            <label class="topic-label">
              <input
                type="checkbox"
                checked={topic.mastered}
                on:change={() => toggleMastery(topic.notePath, topic.mastered)}
                aria-label="Mark {topicName(topic.notePath)} as mastered"
              />
              <span class="topic-name" class:mastered={topic.mastered}
                >{topicName(topic.notePath)}</span
              >
            </label>
            {#if topic.cardCount > 0}
              <span class="topic-cards">{topic.cardCount} cards</span>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  {:else}
    <div class="empty-topics">
      <p>No topic notes found in this course folder.</p>
      <p class="hint">Create notes in the course folder to track topics.</p>
    </div>
  {/if}
</div>

<style>
  .exam-progress {
    padding: var(--spacing-m);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
  }
  .exam-header {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
  }
  .countdown {
    display: flex;
    align-items: baseline;
    gap: var(--spacing-xs);
  }
  .countdown-num {
    font-size: 28px;
    font-weight: var(--font-bold);
    color: var(--interactive-accent);
  }
  .countdown.urgent .countdown-num {
    color: #dc2626;
  }
  .countdown-label {
    font-size: var(--font-smaller);
    color: var(--text-muted);
  }
  .no-date {
    font-size: var(--font-smaller);
    color: var(--text-faint);
  }
  .mastery-bar {
    height: 6px;
    background: var(--background-modifier-border);
    border-radius: 3px;
    overflow: hidden;
  }
  .mastery-fill {
    height: 100%;
    background: var(--interactive-accent);
    border-radius: 3px;
    transition: width 0.4s;
  }
  .mastery-label {
    font-size: var(--font-smallest);
    color: var(--text-muted);
  }
  .section-heading {
    margin: 0 0 var(--spacing-xs);
    font-size: var(--font-smallest);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }
  .topic-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .topic-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 3px 0;
  }
  .topic-label {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    cursor: pointer;
    flex: 1;
    min-width: 0;
  }
  .topic-name {
    font-size: var(--font-smallest);
    color: var(--text-normal);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .topic-name.mastered {
    text-decoration: line-through;
    color: var(--text-muted);
  }
  .topic-cards {
    font-size: 10px;
    color: var(--text-faint);
    flex-shrink: 0;
  }
  .empty-topics {
    text-align: center;
    padding: var(--spacing-l);
  }
  .empty-topics p {
    margin: 0;
    font-size: var(--font-smaller);
    color: var(--text-muted);
  }
  .hint {
    font-size: var(--font-smallest);
    color: var(--text-faint);
  }
</style>
