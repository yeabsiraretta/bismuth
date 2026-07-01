<script lang="ts">
  import { onMount } from 'svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ActionButton from '@/components/ui/actions/ActionButton.svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import {
    recordingState,
    recordingDuration,
    recordings,
    voiceSupported,
    voiceLoading,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    loadRecordings,
    removeRecording,
    attachToNote,
  } from '../stores/voice';
  import { activeNote } from '@/stores/vault/vault';

  onMount(() => {
    loadRecordings();
  });

  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async function handleRecord() {
    if ($recordingState === 'idle') {
      await startRecording();
    } else if ($recordingState === 'recording') {
      pauseRecording();
    } else {
      resumeRecording();
    }
  }

  async function handleStop() {
    await stopRecording();
  }

  async function handleAttach(id: string) {
    if ($activeNote?.path) {
      await attachToNote(id, $activeNote.path);
    }
  }
</script>

<div class="voice-panel" role="tabpanel" aria-label="Voice Recorder">
  <PanelHeader icon="mic" title="Voice Recorder">
    <svelte:fragment slot="actions">
      {#if $recordingState !== 'idle'}
        <ActionButton icon="x" title="Cancel recording" on:click={cancelRecording} />
      {/if}
    </svelte:fragment>
  </PanelHeader>

  <div class="panel-body">
    {#if !$voiceSupported}
      <div class="unsupported">
        <Icon name="alert-triangle" size={24} />
        <p>Audio recording is not supported in this environment.</p>
      </div>
    {:else}
      <div class="recorder-controls">
        <div class="timer">{formatDuration($recordingDuration)}</div>

        <div class="control-row">
          <button
            class="record-btn"
            class:recording={$recordingState === 'recording'}
            class:paused={$recordingState === 'paused'}
            on:click={handleRecord}
            title={$recordingState === 'idle'
              ? 'Start recording'
              : $recordingState === 'recording'
                ? 'Pause'
                : 'Resume'}
          >
            <Icon name={$recordingState === 'recording' ? 'pause' : 'mic'} size={20} />
          </button>

          {#if $recordingState !== 'idle'}
            <button
              class="stop-btn"
              on:click={handleStop}
              title="Stop and save"
              disabled={$voiceLoading}
            >
              <Icon name="square" size={16} />
            </button>
          {/if}
        </div>

        {#if $recordingState !== 'idle'}
          <span class="recording-label">
            {$recordingState === 'recording' ? 'Recording...' : 'Paused'}
          </span>
        {/if}
      </div>

      {#if $recordings.length > 0}
        <div class="recordings-list">
          <span class="list-label">Recordings ({$recordings.length})</span>
          {#each $recordings as rec}
            <div class="recording-item">
              <div class="rec-info">
                <span class="rec-name">{rec.filename}</span>
                <span class="rec-meta"
                  >{formatDuration(rec.duration)} - {formatDate(rec.createdAt)}</span
                >
              </div>
              <div class="rec-actions">
                {#if $activeNote}
                  <button
                    class="rec-btn"
                    title="Attach to note"
                    on:click={() => handleAttach(rec.id)}
                  >
                    <Icon name="link" size={12} />
                  </button>
                {/if}
                <button
                  class="rec-btn danger"
                  title="Delete"
                  on:click={() => removeRecording(rec.id)}
                >
                  <Icon name="trash" size={12} />
                </button>
              </div>
            </div>
          {/each}
        </div>
      {:else if $recordingState === 'idle'}
        <div class="empty-state">
          <Icon name="mic" size={24} />
          <p>No recordings yet</p>
          <p class="hint">Press the record button to start</p>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .voice-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .panel-body {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .unsupported {
    text-align: center;
    padding: 24px;
    color: var(--text-muted);
  }
  .unsupported p {
    margin: 8px 0 0;
    font-size: 12px;
  }
  .recorder-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 16px 0;
  }
  .timer {
    font-size: 28px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--text-primary);
  }
  .control-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .record-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    background: var(--accent-color, #6366f1);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .record-btn.recording {
    background: var(--error-color, #ef4444);
    animation: pulse 1.5s infinite;
  }
  .record-btn.paused {
    background: var(--warning-color, #f59e0b);
  }
  .stop-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: var(--surface-color, #313244);
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .stop-btn:hover {
    background: var(--hover-bg);
  }
  .recording-label {
    font-size: 11px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .recordings-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .list-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    padding: 4px 0;
  }
  .recording-item {
    display: flex;
    align-items: center;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid var(--border-color);
  }
  .recording-item:hover {
    background: var(--hover-bg);
  }
  .rec-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .rec-name {
    font-size: 12px;
    font-weight: 500;
  }
  .rec-meta {
    font-size: 10px;
    color: var(--text-muted);
  }
  .rec-actions {
    display: flex;
    gap: 4px;
  }
  .rec-btn {
    background: none;
    border: none;
    padding: 4px;
    border-radius: 4px;
    cursor: pointer;
    color: var(--text-muted);
  }
  .rec-btn:hover {
    background: var(--hover-bg);
    color: var(--text-primary);
  }
  .rec-btn.danger:hover {
    color: var(--error-color, #f87171);
  }
  .empty-state {
    text-align: center;
    padding: 24px;
    color: var(--text-muted);
  }
  .empty-state p {
    margin: 4px 0;
    font-size: 12px;
  }
  .hint {
    font-size: 11px;
    opacity: 0.7;
  }
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
</style>
