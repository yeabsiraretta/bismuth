import type { SidebarTab } from '@/types/layout';

// ─── Keyboard Navigation ─────────────────────────────────────────────────────

/** Computes the next tab index given a keydown event on a vertical tab list. Returns -1 if the key is not a navigation key. */
export function getNextTabIndex(e: KeyboardEvent, currentIndex: number, total: number): number {
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    e.preventDefault();
    return (currentIndex + 1) % total;
  }
  if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    e.preventDefault();
    return (currentIndex - 1 + total) % total;
  }
  if (e.key === 'Home') {
    e.preventDefault();
    return 0;
  }
  if (e.key === 'End') {
    e.preventDefault();
    return total - 1;
  }
  return -1;
}

// ─── Drag State ───────────────────────────────────────────────────────────────

export interface DragState {
  draggedTabId: string | null;
  dragSource: 'upper' | 'lower' | null;
  dropTargetId: string | null;
  dropZoneActive: boolean;
  upperDropZoneActive: boolean;
  draggableId: string | null;
  holdTimer: ReturnType<typeof setTimeout> | null;
}

export function createDragState(): DragState {
  return {
    draggedTabId: null,
    dragSource: null,
    dropTargetId: null,
    dropZoneActive: false,
    upperDropZoneActive: false,
    draggableId: null,
    holdTimer: null,
  };
}

export function resetDragState(state: DragState): DragState {
  return {
    ...state,
    draggedTabId: null,
    dragSource: null,
    dropTargetId: null,
    dropZoneActive: false,
    upperDropZoneActive: false,
  };
}

export function startHoldTimer(state: DragState, tabId: string): DragState {
  const holdTimer = setTimeout(() => {
    state.draggableId = tabId;
  }, 200);
  return { ...state, holdTimer };
}

export function clearHoldTimer(state: DragState): DragState {
  if (state.holdTimer) clearTimeout(state.holdTimer);
  return { ...state, holdTimer: null, draggableId: null };
}

export interface DragStartResult {
  draggedTabId: string;
  dragSource: 'upper' | 'lower';
}

export function handleDragStartLogic(
  e: DragEvent,
  tabId: string,
  source: 'upper' | 'lower',
  tabs: SidebarTab[],
  lowerTabs: SidebarTab[]
): DragStartResult | null {
  if (!e.dataTransfer) return null;
  const tab = (source === 'upper' ? tabs : lowerTabs).find((t) => t.id === tabId);
  if (tab?.pinned) {
    e.preventDefault();
    return null;
  }
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', tabId);
  return { draggedTabId: tabId, dragSource: source };
}

export interface DropResult {
  type: 'reorder' | 'section-change';
  reordered?: SidebarTab[];
  targetSection: 'upper' | 'lower';
  tabId?: string;
}

export function handleDropLogic(
  draggedTabId: string | null,
  dragSource: 'upper' | 'lower' | null,
  targetTabId: string,
  targetSection: 'upper' | 'lower',
  tabs: SidebarTab[],
  lowerTabs: SidebarTab[]
): DropResult | null {
  if (!draggedTabId) return null;

  if (dragSource !== targetSection) {
    return { type: 'section-change', targetSection, tabId: draggedTabId };
  }

  const list = targetSection === 'upper' ? tabs : lowerTabs;
  const fromIdx = list.findIndex((t) => t.id === draggedTabId);
  const toIdx = list.findIndex((t) => t.id === targetTabId);

  if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
    const reordered = [...list];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    return { type: 'reorder', reordered, targetSection };
  }

  return null;
}
