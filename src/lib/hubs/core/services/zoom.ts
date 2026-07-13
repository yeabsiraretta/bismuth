import { ZOOM_MAX, ZOOM_MIN } from '@/constants/layout';
import { ZOOM_KEY } from '@/constants/storage-keys';

const BASE_FONT_SIZE = 16;

function clampScale(factor: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, factor));
}

export function setUIScale(factor: number) {
  const clamped = clampScale(factor);
  const root = document.documentElement;
  root.style.setProperty('--ui-scale', String(clamped));
  root.style.fontSize = `${BASE_FONT_SIZE * clamped}px`;
  localStorage.setItem(ZOOM_KEY, String(clamped));
}

export function getStoredScale(): number {
  const stored = localStorage.getItem(ZOOM_KEY);
  if (stored) {
    const parsed = parseFloat(stored);
    if (!isNaN(parsed)) return clampScale(parsed);
  }
  return 1.0;
}

function restoreUIScale() {
  setUIScale(getStoredScale());
}
