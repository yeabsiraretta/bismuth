import { vi } from 'vitest';
import { readable } from 'svelte/store';

export const currentVault = readable({ root_path: '/mock-vault' });
export const openVault = vi.fn();
export const closeVault = vi.fn();
