<script lang="ts">
  import './CapturePanel.css';
  import { getNotes } from '@/hubs/core/stores/vault-store.svelte';
  import { getCachedContent, updateCachedContent } from '@/hubs/editor/services/file-ops';
  import {
    type CaptureChoice,
    type CaptureMode,
    buildCaptureContent,
    buildDailyNotePath,
    buildDumpPath,
    buildInboxPath,
    createChoiceId,
    expandCaptureTokens,
    insertDumpEntry,
    insertIntoContent,
    loadSavedChoices,
    saveChoices,
  } from '@/hubs/navigator/services/capture-service';
  import { formatISO } from '@/hubs/editor/services/token-engine';
  import { addTask, formatTaskId, initPMStore } from '@/hubs/planner/stores/pm-task-store.svelte';
  import { writeNote } from '@/sal/note-service';
  import ContextMenu from '@/ui/context-menu.svelte';
  import { openNote } from '@/ui/panel-actions';
  import Panel from '@/ui/panel.svelte';

  initPMStore();

  // ── State ────────────────────────────────────────────────────────

  let captureText = $state('');
  let activeChoiceId = $state<string | null>(null);
  let choices = $state<CaptureChoice[]>(loadSavedChoices());
  let showChoiceEditor = $state(false);
  let editingChoice = $state<CaptureChoice | null>(null);
  let targetSearch = $state('');
  let statusMsg = $state<string | null>(null);

  // ── Derived ──────────────────────────────────────────────────────

  let allNotes = $derived(getNotes());
  let enabledChoices = $derived(choices.filter((c) => c.enabled));

  let activeChoice = $derived(
    enabledChoices.find((c) => c.id === activeChoiceId) ?? enabledChoices[0] ?? null
  );

  let inboxNotes = $derived(
    (() => {
      const matchingNotes = allNotes.filter(
        (n) => n.path.startsWith('inbox/') || n.path.startsWith('capture/')
      );
      return [...matchingNotes].sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);
    })()
  );

  let targetResults = $derived(
    targetSearch.length > 1
      ? allNotes
          .filter((n) => n.path.toLowerCase().includes(targetSearch.toLowerCase()))
          .slice(0, 8)
      : []
  );

  let modeLabel: Record<CaptureMode, string> = {
    new: 'New note',
    append: 'Append',
    prepend: 'Prepend',
    daily: 'Daily note',
    dump: 'Brain Dump',
  };

  // ── Capture execution ────────────────────────────────────────────

  async function executeCapture() {
    if (!captureText.trim() || !activeChoice) return;
    const d = new Date();
    const choice = activeChoice;

    const content = buildCaptureContent(captureText, {
      asTask: choice.asTask,
      format: choice.format || undefined,
      title: choice.name,
      date: d,
    });

    let path: string;

    if (choice.mode === 'new') {
      path = buildInboxPath(
        choice.targetPath
          ? expandCaptureTokens(choice.targetPath, { value: captureText, date: d })
          : '',
        d
      );
      openNote(path, content);
    } else if (choice.mode === 'daily') {
      path = buildDailyNotePath(d);
      const existing = getCachedContent(path) ?? '';
      const updated = insertIntoContent(existing, content, choice.insertAfter, 'append');
      try {
        await writeNote(path, updated);
        updateCachedContent(path, updated);
      } catch {
        openNote(path, updated);
      }
    } else if (choice.mode === 'dump') {
      path = buildDumpPath(choice.targetPath || '');
      const existing = getCachedContent(path) ?? '';
      const updated = insertDumpEntry(existing, captureText.trim(), d);
      try {
        await writeNote(path, updated);
        updateCachedContent(path, updated);
      } catch {
        openNote(path, updated);
      }
    } else {
      path = expandCaptureTokens(choice.targetPath, { value: captureText, date: d });
      const existing = getCachedContent(path) ?? '';
      const updated = insertIntoContent(
        existing,
        content,
        choice.insertAfter,
        choice.mode as 'append' | 'prepend'
      );
      try {
        await writeNote(path, updated);
        updateCachedContent(path, updated);
      } catch {
        openNote(path, updated);
      }
    }

    // Bridge capture → PM task store when asTask is on
    if (choice.asTask) {
      const pmTask = addTask({
        title: captureText.trim(),
        scheduledDate: formatISO(d),
        dueDate: formatISO(d),
        notePath: path,
        tags: choice.mode === 'daily' ? ['daily'] : [],
      });
      statusMsg = `${formatTaskId(pmTask.taskNumber)} → ${choice.name}`;
    } else {
      statusMsg = `Captured → ${choice.name}`;
    }

    captureText = '';
    setTimeout(() => {
      statusMsg = null;
    }, 2000);
  }

  // ── Choice management ────────────────────────────────────────────

  function startNewChoice() {
    editingChoice = {
      id: createChoiceId(),
      name: '',
      mode: 'append',
      targetPath: '',
      format: '',
      insertAfter: '',
      asTask: false,
      enabled: true,
    };
    showChoiceEditor = true;
  }

  function editChoice(c: CaptureChoice) {
    editingChoice = { ...c };
    showChoiceEditor = true;
  }

  function saveEditingChoice() {
    if (!editingChoice || !editingChoice.name.trim()) return;
    const nextChoice = { ...editingChoice };
    const existingIndex = choices.findIndex((choice) => choice.id === nextChoice.id);
    choices =
      existingIndex >= 0
        ? choices.map((choice, index) => (index === existingIndex ? nextChoice : choice))
        : [...choices, nextChoice];
    saveChoices(choices);
    showChoiceEditor = false;
    editingChoice = null;
  }

  function deleteChoice(id: string) {
    choices = choices.filter((c) => c.id !== id);
    saveChoices(choices);
    if (activeChoiceId === id) activeChoiceId = null;
  }

  function cancelEditing() {
    showChoiceEditor = false;
    editingChoice = null;
  }

  // ── Helpers ──────────────────────────────────────────────────────

  function formatRelative(ts: number): string {
    if (ts === 0) return '';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  }

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

<Panel title="Quick Capture">
  <div class="cp-body">
    <!-- Choice selector pills -->
    {#if enabledChoices.length > 0}
      <div class="cp-choices">
        {#each enabledChoices as c (c.id)}
          <button
            class="cp-choice-pill"
            class:active={activeChoice?.id === c.id}
            onclick={() => {
              activeChoiceId = c.id;
            }}
            ondblclick={() => editChoice(c)}
            title="{modeLabel[c.mode]} · double-click to edit"
          >
            {#if c.asTask}<span class="cp-pill-icon">☐</span>{/if}
            {c.name}
            <span class="cp-pill-mode"
              >{c.mode === 'daily'
                ? 'D'
                : c.mode === 'new'
                  ? '+'
                  : c.mode === 'dump'
                    ? '🗑'
                    : c.mode === 'prepend'
                      ? '⇡'
                      : '⇣'}</span
            >
          </button>
        {/each}
        <button class="cp-choice-add" onclick={startNewChoice} title="Add capture choice">+</button>
      </div>
    {/if}

    <!-- Capture form -->
    <div class="cp-form">
      {#if activeChoice && (activeChoice.mode === 'append' || activeChoice.mode === 'prepend' || activeChoice.mode === 'dump')}
        <div class="cp-target-row">
          <span class="cp-target-label">Target:</span>
          <span
            class="cp-target-path"
            title={activeChoice.mode === 'dump'
              ? buildDumpPath(activeChoice.targetPath || '')
              : activeChoice.targetPath}
          >
            {activeChoice.mode === 'dump'
              ? buildDumpPath(activeChoice.targetPath || '')
              : activeChoice.targetPath || '(not set — edit choice)'}
          </span>
        </div>
      {/if}

      <textarea
        class="cp-textarea"
        placeholder={activeChoice?.asTask ? 'Add a task…' : 'Capture a thought…'}
        bind:value={captureText}
        onkeydown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) executeCapture();
        }}></textarea>

      <div class="cp-form-footer">
        {#if statusMsg}
          <span class="cp-status">{statusMsg}</span>
        {:else}
          <span class="cp-hint">⌘/Ctrl + Enter</span>
        {/if}
        <button class="cp-submit" onclick={executeCapture} disabled={!captureText.trim()}>
          {activeChoice?.mode === 'new'
            ? 'Create'
            : activeChoice?.mode === 'daily'
              ? 'Log'
              : 'Capture'}
        </button>
      </div>
    </div>

    <!-- Choice editor (inline) -->
    {#if showChoiceEditor && editingChoice}
      <div class="cp-editor">
        <h4 class="cp-section-title">
          {choices.some((c) => c.id === editingChoice?.id) ? 'Edit' : 'New'} Choice
        </h4>
        <div class="cp-editor-fields">
          <input
            class="cp-input"
            type="text"
            placeholder="Choice name"
            bind:value={editingChoice.name}
          />

          <div class="cp-field-row">
            <label class="cp-field-label" for="cp-mode">Mode</label>
            <select id="cp-mode" class="cp-select" bind:value={editingChoice.mode}>
              <option value="new">New note</option>
              <option value="append">Append</option>
              <option value="prepend">Prepend</option>
              <option value="daily">Daily note</option>
              <option value="dump">Brain Dump</option>
            </select>
          </div>

          {#if editingChoice.mode === 'dump'}
            <div class="cp-field-row">
              <label class="cp-field-label" for="cp-dump-folder">Dump folder</label>
              <input
                id="cp-dump-folder"
                class="cp-input"
                type="text"
                placeholder="folder (empty = vault root)"
                bind:value={editingChoice.targetPath}
              />
              <span class="cp-field-hint"
                >Writes to {buildDumpPath(editingChoice.targetPath || '')}</span
              >
            </div>
          {:else if editingChoice.mode === 'append' || editingChoice.mode === 'prepend'}
            <div class="cp-field-row">
              <label class="cp-field-label" for="cp-target">Target file</label>
              <div class="cp-target-input-wrap">
                <input
                  id="cp-target"
                  class="cp-input"
                  type="text"
                  placeholder="path/to/note.md"
                  bind:value={editingChoice.targetPath}
                  oninput={(e) => {
                    targetSearch = (e.target as HTMLInputElement).value;
                  }}
                />
                {#if targetResults.length > 0}
                  <ul class="cp-target-results">
                    {#each targetResults as n (n.path)}
                      <li>
                        <button
                          class="cp-target-result-item"
                          onclick={() => {
                            if (!editingChoice) return;
                            editingChoice = { ...editingChoice, targetPath: n.path };
                            targetSearch = '';
                          }}
                        >
                          {n.path}
                        </button>
                      </li>
                    {/each}
                  </ul>
                {/if}
              </div>
            </div>
          {/if}

          {#if editingChoice.mode !== 'new'}
            <div class="cp-field-row">
              <label class="cp-field-label" for="cp-insert-after">Insert after</label>
              <input
                id="cp-insert-after"
                class="cp-input"
                type="text"
                placeholder="## Section heading (optional)"
                bind:value={editingChoice.insertAfter}
              />
            </div>
          {/if}

          <div class="cp-field-row">
            <label class="cp-field-label" for="cp-format">Format</label>
            <input
              id="cp-format"
              class="cp-input"
              type="text"
              placeholder="e.g. - {'{{date.time24}}'} {'{{value}}'}"
              bind:value={editingChoice.format}
            />
          </div>

          <div class="cp-field-row">
            <label class="cp-checkbox-label">
              <input type="checkbox" bind:checked={editingChoice.asTask} />
              Capture as task
            </label>
          </div>

          <div class="cp-editor-actions">
            <button
              class="cp-btn cp-btn-accent"
              onclick={saveEditingChoice}
              disabled={!editingChoice.name.trim()}>Save</button
            >
            <button class="cp-btn" onclick={cancelEditing}>Cancel</button>
            {#if choices.some((c) => c.id === editingChoice?.id)}
              <button
                class="cp-btn cp-btn-danger"
                onclick={() => {
                  deleteChoice(editingChoice!.id);
                  cancelEditing();
                }}>Delete</button
              >
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <!-- Inbox -->
    {#if inboxNotes.length > 0}
      <div class="cp-inbox">
        <h4 class="cp-section-title">Inbox ({inboxNotes.length})</h4>
        <ul class="cp-list">
          {#each inboxNotes as note (note.path)}
            <li>
              <button
                class="cp-item"
                onclick={() => openNote(note.path)}
                oncontextmenu={(e) => handleContext(e, note.path)}
                title={note.path}
              >
                <span class="cp-item-name">{note.title}</span>
                <span class="cp-item-date">{formatRelative(note.createdAt)}</span>
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {:else}
      <div class="panel-empty">
        <p>Inbox empty</p>
        <p class="panel-empty-hint">Captured notes appear in <code>inbox/</code></p>
      </div>
    {/if}

    <!-- Format syntax help -->
    <details class="cp-syntax">
      <summary>Capture format tokens</summary>
      <div class="cp-help">
        <code>{'{{value}}'}</code> Captured text<br />
        <code>{'{{date}}'}</code> YYYY-MM-DD<br />
        <code>{'{{date:fmt}}'}</code> Custom date<br />
        <code>{'{{date.time24}}'}</code> HH:MM<br />
        <code>{'{{title}}'}</code> Choice name<br />
        <code>{'{{system.timestamp}}'}</code> Unix ms<br />
        <code>{'{{uuid}}'}</code> Random UUID<br />
        <code>\n</code> Newline
      </div>
    </details>
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
