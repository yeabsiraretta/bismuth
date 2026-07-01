import { writable } from 'svelte/store';

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export const confirmDialog = writable<ConfirmConfig | null>(null);

export function openConfirm(config: ConfirmConfig): void {
  confirmDialog.set(config);
}

export function closeConfirm(): void {
  confirmDialog.set(null);
}
