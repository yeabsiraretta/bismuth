<script lang="ts">
  import { MOOD_ENTRIES_KEY } from '@/constants/storage-keys';
  import BIcon from '@/ui/b-icon.svelte';
  const MOODS = [
    { emoji: ':D', label: 'Great', value: 5 },
    { emoji: ':)', label: 'Good', value: 4 },
    { emoji: ':|', label: 'Okay', value: 3 },
    { emoji: ':(', label: 'Low', value: 2 },
    { emoji: ':((', label: 'Bad', value: 1 },
  ];

  interface MoodEntry {
    id: string;
    date: string;
    time: string;
    value: number;
    note: string;
  }

  let { dateStr }: { dateStr: string } = $props();

  let entries = $state<MoodEntry[]>(loadEntries());
  let note = $state('');
  let expanded = $state(true);

  function loadEntries(): MoodEntry[] {
    try {
      return JSON.parse(localStorage.getItem(MOOD_ENTRIES_KEY) ?? '[]');
    } catch {
      return [];
    }
  }
  function save() {
    localStorage.setItem(MOOD_ENTRIES_KEY, JSON.stringify(entries));
  }

  function logMood(value: number) {
    const now = new Date();
    const entry: MoodEntry = {
      id: crypto.randomUUID(),
      date: now.toISOString().slice(0, 10),
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      value,
      note: note.trim(),
    };
    entries = [entry, ...entries];
    note = '';
    save();
  }

  function removeEntry(id: string) {
    entries = entries.filter((e) => e.id !== id);
    save();
  }

  function moodEmoji(value: number): string {
    return MOODS.find((m) => m.value === value)?.emoji ?? '❓';
  }

  let todayEntries = $derived(entries.filter((e) => e.date === dateStr));
  let weekAvg = $derived.by(() => {
    const week = entries.filter((e) => {
      const diff = Date.now() - new Date(e.date).getTime();
      return diff < 7 * 86400000;
    });
    if (week.length === 0) return null;
    return (week.reduce((s, e) => s + e.value, 0) / week.length).toFixed(1);
  });
</script>

<div class="mood-section">
  <button
    class="mood-header"
    onclick={() => {
      expanded = !expanded;
    }}
  >
    <h4 class="dn-section-title">Mood</h4>
    <span class="mood-chevron" class:expanded>▸</span>
  </button>

  {#if expanded}
    <div class="mood-picker">
      {#each MOODS as m (m.value)}
        <button class="mood-btn" onclick={() => logMood(m.value)} title={m.label}>
          <span class="mood-emoji">{m.emoji}</span>
          <span class="mood-label">{m.label}</span>
        </button>
      {/each}
    </div>
    <input
      type="text"
      bind:value={note}
      placeholder="Add a note (optional)…"
      class="mood-note-input"
      onkeydown={(e) => {
        if (e.key === 'Enter' && note.trim()) logMood(3);
      }}
    />
    {#if todayEntries.length > 0}
      <div class="mood-stat">
        Today: {todayEntries.length} check-in{todayEntries.length > 1 ? 's' : ''}
      </div>
    {/if}
    {#if weekAvg !== null}
      <div class="mood-stat">7-day avg: {weekAvg} / 5</div>
    {/if}
    {#if todayEntries.length > 0}
      <ul class="mood-list">
        {#each todayEntries as entry (entry.id)}
          <li class="mood-row">
            <span class="mood-row-emoji">{moodEmoji(entry.value)}</span>
            <div class="mood-row-info">
              <span class="mood-row-time">{entry.time}</span>
              {#if entry.note}<span class="mood-row-note">{entry.note}</span>{/if}
            </div>
            <button class="panel-action" onclick={() => removeEntry(entry.id)} title="Remove">
              <BIcon name="x" size={12} />
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

<style>
  .mood-section {
    border-top: 1px solid var(--color-border);
    padding-top: 8px;
  }
  .mood-header {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0 0 6px;
    font-family: inherit;
  }
  .mood-chevron {
    font-size: 0.6rem;
    color: var(--color-text-subtle);
    transition: transform var(--transition-base);
    margin-left: auto;
  }
  .mood-chevron.expanded {
    transform: rotate(90deg);
  }
  .mood-picker {
    display: flex;
    gap: 4px;
    justify-content: center;
    margin-bottom: 8px;
  }
  .mood-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 6px 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    cursor: pointer;
  }
  .mood-btn:hover {
    border-color: var(--color-accent);
    background: var(--color-surface-hover);
  }
  .mood-emoji {
    font-size: 1.4rem;
  }
  .mood-label {
    font-size: 0.58rem;
    color: var(--color-text-muted);
  }
  .mood-note-input {
    width: 100%;
    padding: 5px 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.75rem;
    outline: none;
    margin-bottom: 6px;
  }
  .mood-note-input:focus {
    border-color: var(--color-accent);
  }
  .mood-stat {
    font-size: 0.68rem;
    color: var(--color-text-muted);
    margin-bottom: 6px;
    text-align: center;
  }
  .mood-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .mood-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
    border-bottom: 1px solid var(--color-border);
  }
  .mood-row-emoji {
    font-size: 1rem;
  }
  .mood-row-info {
    flex: 1;
    min-width: 0;
  }
  .mood-row-time {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    display: block;
  }
  .mood-row-note {
    font-size: 0.7rem;
    color: var(--color-text);
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
