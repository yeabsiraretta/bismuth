// ── Canvas Tool Mode ─────────────────────────────────────────────

export type CanvasToolMode =
  'select' | 'rect' | 'ellipse' | 'line' | 'text' | 'note' | 'connect' | 'pan';

let activeMode = $state<CanvasToolMode>('select');

export function getToolMode(): CanvasToolMode {
  return activeMode;
}

export function setToolMode(mode: CanvasToolMode) {
  activeMode = mode;
}

export function resetToSelect() {
  activeMode = 'select';
}

export function isDrawingMode(): boolean {
  return activeMode !== 'select' && activeMode !== 'pan' && activeMode !== 'connect';
}

export function isConnectMode(): boolean {
  return activeMode === 'connect';
}
