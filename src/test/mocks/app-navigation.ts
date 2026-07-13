/** Vitest mock for $app/navigation */
export async function goto(_url: string, _opts?: unknown): Promise<void> {}
export async function invalidate(_url?: string | URL): Promise<void> {}
export async function invalidateAll(): Promise<void> {}
export function beforeNavigate(_fn: unknown): void {}
export function afterNavigate(_fn: unknown): void {}
export function onNavigate(_fn: unknown): void {}
