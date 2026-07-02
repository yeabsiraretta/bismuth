<script lang="ts">
  import type { CanvasElement } from '@/features/canvas/types/elements';
  import type { FeatureCardData } from '@/features/canvas/types/elements';
  import { log } from '@/utils/logger';

  export let elements: CanvasElement[] = [];
  export let canvasWidth: number = 1200;
  export let canvasHeight: number = 800;
  export let onStatusDrop:
    ((detail: { id: string; status: FeatureCardData['status'] }) => void) | undefined = undefined;

  type Status = FeatureCardData['status'];

  const COLUMNS: Status[] = ['idea', 'planned', 'in-progress', 'done', 'deferred'];

  const COLUMN_LABELS: Record<Status, string> = {
    idea: 'Idea',
    planned: 'Planned',
    'in-progress': 'In Progress',
    done: 'Done',
    deferred: 'Deferred',
  };

  const COLUMN_COLORS: Record<Status, string> = {
    idea: 'rgba(113, 113, 122, 0.04)',
    planned: 'rgba(59, 130, 246, 0.04)',
    'in-progress': 'rgba(220, 38, 38, 0.04)',
    done: 'rgba(22, 163, 74, 0.04)',
    deferred: 'rgba(217, 119, 6, 0.04)',
  };

  const COLUMN_HEADER_COLORS: Record<Status, string> = {
    idea: 'var(--text-muted, #71717a)',
    planned: 'var(--color-info, #3b82f6)',
    'in-progress': 'var(--interactive-accent, #dc2626)',
    done: 'var(--color-success, #16a34a)',
    deferred: 'var(--color-warning, #d97706)',
  };

  $: colWidth = canvasWidth / COLUMNS.length;

  $: featureCards = elements.filter(
    (el) => el.element_type === 'feature_card' && el.properties.featureCardData
  );

  $: cardsByStatus = COLUMNS.reduce<Record<Status, CanvasElement[]>>(
    (acc, col) => {
      acc[col] = featureCards
        .filter((el) => (el.properties.featureCardData as FeatureCardData).status === col)
        .sort((a, b) => {
          const ap = (a.properties.featureCardData as FeatureCardData).priority;
          const bp = (b.properties.featureCardData as FeatureCardData).priority;
          return ap - bp;
        });
      return acc;
    },
    {} as Record<Status, CanvasElement[]>
  );

  let dragCardId: string | null = null;
  let dragOverColumn: Status | null = null;

  function handleDragStart(e: DragEvent, cardId: string) {
    dragCardId = cardId;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
    log.debug('RoadmapKanban: drag start', { cardId });
  }

  function handleDragOver(e: DragEvent, col: Status) {
    e.preventDefault();
    dragOverColumn = col;
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  }

  function handleDrop(e: DragEvent, col: Status) {
    e.preventDefault();
    if (dragCardId && dragOverColumn) {
      log.info('RoadmapKanban: status drop', { id: dragCardId, status: col });
      onStatusDrop?.({ id: dragCardId, status: col });
    }
    dragCardId = null;
    dragOverColumn = null;
  }

  function handleDragEnd() {
    dragCardId = null;
    dragOverColumn = null;
  }
</script>

<div
  class="roadmap-kanban"
  style="width: {canvasWidth}px; height: {canvasHeight}px;"
  role="region"
  aria-label="Roadmap kanban board"
>
  {#each COLUMNS as col, i (col)}
    <div
      class="kanban-column {dragOverColumn === col ? 'kanban-column--over' : ''}"
      style="
        left: {i * colWidth}px;
        width: {colWidth}px;
        height: {canvasHeight}px;
        background: {COLUMN_COLORS[col]};
      "
      role="group"
      aria-label="{COLUMN_LABELS[col]} column"
      on:dragover={(e) => handleDragOver(e, col)}
      on:drop={(e) => handleDrop(e, col)}
    >
      <div class="column-header" style="color: {COLUMN_HEADER_COLORS[col]};">
        {COLUMN_LABELS[col]}
        <span class="column-count">{cardsByStatus[col]?.length ?? 0}</span>
      </div>

      <div class="column-cards">
        {#each cardsByStatus[col] ?? [] as card (card.id)}
          <div
            class="kanban-card-wrapper"
            draggable="true"
            on:dragstart={(e) => handleDragStart(e, card.id)}
            on:dragend={handleDragEnd}
            role="listitem"
          >
            <div class="card-title">
              {(card.properties.featureCardData as FeatureCardData).title}
            </div>
            <div class="card-priority">
              {#each Array.from({ length: 5 }, (_, idx) => idx) as idx (idx)}
                <span
                  class="pip {idx < (card.properties.featureCardData as FeatureCardData).priority
                    ? 'pip--filled'
                    : ''}"
                ></span>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .roadmap-kanban {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }

  .kanban-column {
    position: absolute;
    top: 0;
    border-right: 1px solid var(--border-color, #e4e4e7);
    pointer-events: all;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    transition: background 0.1s ease;
  }

  .kanban-column:last-child {
    border-right: none;
  }

  .kanban-column--over {
    background: rgba(220, 38, 38, 0.07) !important;
  }

  .column-header {
    padding: 10px 12px 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 6px;
    border-bottom: 1px solid var(--border-color, #e4e4e7);
    background: var(--background-primary, #fff);
    pointer-events: none;
    user-select: none;
  }

  .column-count {
    font-size: 10px;
    font-weight: 400;
    color: var(--text-muted, #71717a);
  }

  .column-cards {
    flex: 1;
    overflow: visible;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .kanban-card-wrapper {
    background: var(--background-primary, #fff);
    border: 1px solid var(--border-color, #e4e4e7);
    border-radius: 6px;
    padding: 8px 10px;
    cursor: grab;
    font-size: 11px;
    user-select: none;
  }

  .kanban-card-wrapper:active {
    cursor: grabbing;
  }

  .card-title {
    font-weight: 600;
    color: var(--text-primary, #18181b);
    margin-bottom: 4px;
  }

  .card-priority {
    display: flex;
    gap: 3px;
  }

  .pip {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--background-secondary, #f4f4f5);
    border: 1px solid var(--border-color, #e4e4e7);
  }

  .pip--filled {
    background: var(--interactive-accent, #dc2626);
    border-color: var(--interactive-accent, #dc2626);
  }
</style>
