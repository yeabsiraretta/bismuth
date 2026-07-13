type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  createdAt: number;
}

let toastMap = $state<Map<string, ToastItem>>(new Map());
let nextId = 0;

export function getToasts(): ToastItem[] {
  return Array.from(toastMap.values()).sort((a, b) => b.createdAt - a.createdAt);
}

function showToast(
  message: string,
  type: ToastType = 'info',
  duration: number = 4000
): string {
  const id = `toast-${++nextId}`;
  const item: ToastItem = { id, message, type, duration, createdAt: Date.now() };
  toastMap = new Map(toastMap).set(id, item);

  if (duration > 0) {
    setTimeout(() => dismissToast(id), duration);
  }
  return id;
}

export function dismissToast(id: string) {
  const next = new Map(toastMap);
  next.delete(id);
  toastMap = next;
}

function clearToasts() {
  toastMap = new Map();
}

const toast = {
  info: (msg: string, duration?: number) => showToast(msg, 'info', duration),
  success: (msg: string, duration?: number) => showToast(msg, 'success', duration),
  warning: (msg: string, duration?: number) => showToast(msg, 'warning', duration),
  error: (msg: string, duration?: number) => showToast(msg, 'error', duration),
};
