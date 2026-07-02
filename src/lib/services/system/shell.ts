/**
 * Shell service — wraps @tauri-apps/plugin-shell for external URL operations.
 * Components MUST NOT import @tauri-apps/plugin-shell directly.
 */

/** Opens a URL in the system's default browser. */
export async function openExternalUrl(url: string): Promise<void> {
  const { open } = await import('@tauri-apps/plugin-shell');
  await open(url);
}
