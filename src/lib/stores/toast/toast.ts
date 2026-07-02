/**
 * Toast store — manages toast notifications.
 * Phase 13: T107 (Toast System)
 */
import { writable, derived } from 'svelte/store';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  createdAt: number;
}

const toastMap = writable<Map<string, Toast>>(new Map());

/** Active toasts as array, newest first */
export const toasts = derived(toastMap, ($map) =>
  Array.from($map.values()).sort((a, b) => b.createdAt - a.createdAt)
);

let nextId = 0;

/** Show a toast notification */
export function showToast(
  message: string,
  type: ToastType = 'info',
  duration: number = 4000
): string {
  const id = `toast-${++nextId}`;
  const toast: Toast = {
    id,
    message,
    type,
    duration,
    createdAt: Date.now(),
  };

  toastMap.update((map) => {
    map.set(id, toast);
    return new Map(map);
  });

  // Auto-dismiss
  if (duration > 0) {
    setTimeout(() => dismissToast(id), duration);
  }

  return id;
}

/** Dismiss a toast by ID */
export function dismissToast(id: string) {
  toastMap.update((map) => {
    map.delete(id);
    return new Map(map);
  });
}

/** Clear all toasts */
export function clearToasts() {
  toastMap.set(new Map());
}

/** Convenience wrappers */
export const toast = {
  info: (msg: string, duration?: number) => showToast(msg, 'info', duration),
  success: (msg: string, duration?: number) => showToast(msg, 'success', duration),
  warning: (msg: string, duration?: number) => showToast(msg, 'warning', duration),
  error: (msg: string, duration?: number) => showToast(msg, 'error', duration),
};
