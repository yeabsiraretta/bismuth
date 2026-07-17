<script lang="ts">
  import { getNotes } from '@/hubs/core/stores/vault-store.svelte';
  import { getCachedContent } from '@/hubs/editor/services/file-ops';
  import {
    type ReviewGroup,
    type VaultNote,
    DEFAULT_REVIEW_CONFIG,
    matchNotesToTimeSpans,
  } from '@/hubs/planner/services/journal-review';
  import BIcon from '@/ui/b-icon.svelte';
  import ContextMenu from '@/ui/context-menu.svelte';
  import MoodSection from '@/hubs/planner/components/MoodSection.svelte';
  import ReviewSection from '@/hubs/planner/components/ReviewSection.svelte';
  import { openNote } from '@/ui/panel-actions';
  import Panel from '@/ui/panel.svelte';

  // ── Date navigation ──────────────────────────────────────────────────────────

  let today = $state(new Date());
  let dateStr = $derived(formatDate(today));

  function formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function friendlyDate(d: Date): string {
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function shiftDay(delta: number) {
    const ts = today.getTime() + delta * 86400000;
    today = fromTimestamp(ts);
  }

  function goToToday() {
    today = fromTimestamp(Date.now());
  }

  function fromTimestamp(ms: number): Date {
    return new Date(ms);
  }

  // ── Daily note ────────────────────────────────────────────────────────────────

  let dailyNotePath = $derived(`daily/${dateStr}.md`);
  let allNotes = $derived(getNotes());
  let existingNote = $derived(
    allNotes.find((n) => n.path === dailyNotePath || n.path.endsWith(`/${dateStr}.md`))
  );

  function openDailyNote() {
    const path = existingNote?.path ?? dailyNotePath;
    openNote(path);
  }

  function createDailyNote() {
    openNote(dailyNotePath);
  }

  // ── Quick journal entry ───────────────────────────────────────────────────────

  let journalEntry = $state('');

  function appendEntry() {
    const text = journalEntry.trim();
    if (!text) return;
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const line = `\n- ${time} ${text}`;
    const path = existingNote?.path ?? dailyNotePath;
    openNote(path, { content: line, append: true });
    journalEntry = '';
  }

  function handleEntryKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      appendEntry();
    }
  }

  // ── Recent dailies ────────────────────────────────────────────────────────────

  let recentDailies = $derived(
    (() => {
      const dailyMatches = allNotes.filter((n) => /\d{4}-\d{2}-\d{2}\.md$/.test(n.path));
      return [...dailyMatches].sort((a, b) => b.path.localeCompare(a.path)).slice(0, 7);
    })()
  );

  // ── On This Day review ────────────────────────────────────────────────────────

  let vaultNotes = $derived<VaultNote[]>(
    allNotes
      .map((n) => ({ path: n.path, content: getCachedContent(n.path) ?? '' }))
      .filter((n) => n.content.length > 0)
  );

  let reviewGroups = $derived<ReviewGroup[]>(
    matchNotesToTimeSpans(
      vaultNotes,
      {
        ...DEFAULT_REVIEW_CONFIG,
        lookupMargin: 1,
      },
      today
    )
  );

  // ── Context menu ──────────────────────────────────────────────────────────────

  let ctxPath: string | null = $state(null);
  let ctxX = $state(0);
  let ctxY = $state(0);

  function handleContext(e: MouseEvent, path: string) {
    e.preventDefault();
    ctxPath = path;
    ctxX = e.clientX;
    ctxY = e.clientY;
  }

  function closeCtx() {
    ctxPath = null;
  }
</script>

<Panel title="Daily Journal">
  <div class="dn-body">
    <!-- ── Date navigation ──────────────────────────────────────────── -->
    <div class="dn-nav">
      <button class="dn-nav-btn" onclick={() => shiftDay(-1)} aria-label="Previous day"
        >&lsaquo;</button
      >
      <button class="dn-date-btn" onclick={goToToday}>{friendlyDate(today)}</button>
      <button class="dn-nav-btn" onclick={() => shiftDay(1)} aria-label="Next day">&rsaquo;</button>
    </div>

    <div class="dn-actions">
      {#if existingNote}
        <button class="dn-open-btn" onclick={openDailyNote}>
          Open {dateStr}
        </button>
      {:else}
        <button class="dn-create-btn" onclick={createDailyNote}>
          Create {dateStr}
        </button>
      {/if}
    </div>

    <!-- ── Mood tracker ─────────────────────────────────────────────── -->
    <MoodSection {dateStr} />

    <!-- ── Quick journal capture ────────────────────────────────────── -->
    <div class="dn-capture">
      <textarea
        class="dn-capture-input"
        placeholder="Quick journal entry…"
        rows="2"
        bind:value={journalEntry}
        onkeydown={handleEntryKeydown}></textarea>
      {#if journalEntry.trim()}
        <button class="dn-capture-btn" onclick={appendEntry}>
          <BIcon name="arrow-up" size={14} />
        </button>
      {/if}
    </div>

    <!-- ── Recent daily notes ───────────────────────────────────────── -->
    {#if recentDailies.length > 0}
      <div class="dn-recent">
        <h4 class="dn-section-title">Recent</h4>
        <ul class="dn-list">
          {#each recentDailies as note (note.path)}
            <li>
              <button
                class="dn-item"
                onclick={() => openNote(note.path)}
                oncontextmenu={(e) => handleContext(e, note.path)}
                title={note.path}
              >
                <BIcon name="calendar" size={14} class="dn-icon" />
                <span class="dn-item-name">{note.title}</span>
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {:else}
      <div class="panel-empty">
        <p>No daily notes yet</p>
        <p class="panel-empty-hint">Create your first daily note to start journaling</p>
      </div>
    {/if}

    <!-- ── On This Day reviews ─────────────────────────────────────── -->
    <ReviewSection groups={reviewGroups} />
  </div>
</Panel>

<ContextMenu x={ctxX} y={ctxY} show={!!ctxPath} onclose={closeCtx}>
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxPath) openNote(ctxPath);
      closeCtx();
    }}
    role="menuitem">Open</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxPath) navigator.clipboard.writeText(ctxPath);
      closeCtx();
    }}
    role="menuitem">Copy Path</button
  >
</ContextMenu>

<style>
  .dn-body {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .dn-nav {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .dn-nav-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    color: var(--color-text);
    cursor: pointer;
    font-size: 1rem;
    font-family: inherit;
  }
  .dn-nav-btn:hover {
    background: var(--color-surface-hover);
  }
  .dn-date-btn {
    flex: 1;
    min-width: 0;
    padding: 4px 8px;
    font-size: 0.7rem;
    font-family: inherit;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    color: var(--color-text);
    cursor: pointer;
    text-align: center;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dn-date-btn:hover {
    background: var(--color-surface-hover);
  }
  .dn-actions {
    display: flex;
  }
  .dn-open-btn,
  .dn-create-btn {
    width: 100%;
    padding: 6px 12px;
    font-size: 0.7rem;
    font-family: inherit;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    cursor: pointer;
  }
  .dn-open-btn {
    background: var(--color-surface);
    color: var(--color-text);
  }
  .dn-open-btn:hover {
    background: var(--color-surface-hover);
  }
  .dn-create-btn {
    background: var(--color-accent);
    color: var(--color-background);
    border-color: var(--color-accent);
  }
  .dn-create-btn:hover {
    opacity: 0.9;
  }
  .dn-capture {
    position: relative;
  }
  .dn-capture-input {
    width: 100%;
    padding: 6px 8px;
    padding-right: 32px;
    font-size: 0.7rem;
    font-family: inherit;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    color: var(--color-text);
    resize: vertical;
    min-height: 40px;
    outline: none;
  }
  .dn-capture-input:focus {
    border-color: var(--color-accent);
  }
  .dn-capture-input::placeholder {
    color: var(--color-text-muted);
  }
  .dn-capture-btn {
    position: absolute;
    right: 4px;
    bottom: 4px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: var(--color-accent);
    color: var(--color-background);
    border-radius: var(--radius-s);
    cursor: pointer;
    padding: 0;
  }
  .dn-capture-btn:hover {
    opacity: 0.9;
  }
  .dn-recent {
    border-top: 1px solid var(--color-border);
    padding-top: 8px;
  }
  .dn-section-title {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
    margin: 0 0 6px;
  }
  .dn-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .dn-item {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 4px 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: var(--radius-s);
    font-size: 0.75rem;
    color: var(--color-text);
    text-align: left;
    font-family: inherit;
  }
  .dn-item:hover {
    background: var(--color-surface-hover);
  }
  .dn-item :global(.dn-icon) {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: var(--color-text-muted);
  }
  .dn-item-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
