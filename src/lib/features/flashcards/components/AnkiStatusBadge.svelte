<script lang="ts">
  import type { AnkiConnectionStatus } from '../types/flashcard';

  export let status: AnkiConnectionStatus = 'unknown';

  const LABEL: Record<AnkiConnectionStatus, string> = {
    unknown: 'Checking…',
    connected: 'Anki connected',
    unreachable: 'Anki not running',
    'permission-denied': 'Permission denied',
  };
</script>

<span class="status-badge" data-status={status} title={LABEL[status]}>
  <span class="dot" aria-hidden="true"></span>
  <span class="label">{LABEL[status]}</span>
</span>

<style>
  .status-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .status-badge[data-status='connected'] .dot {
    background: var(--color-green, #22c55e);
  }
  .status-badge[data-status='unreachable'] .dot {
    background: var(--color-orange, #f97316);
  }
  .status-badge[data-status='permission-denied'] .dot {
    background: var(--text-error, #ef4444);
  }
  .status-badge[data-status='unknown'] .dot {
    background: var(--text-faint, #9ca3af);
  }
  .label {
    color: var(--text-faint);
  }
</style>
