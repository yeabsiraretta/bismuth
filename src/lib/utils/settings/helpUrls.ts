/**
 * Help URL validation utility.
 * Prevents arbitrary URLs from being opened via shell.open().
 */

export const HELP_BASE_URL = 'https://github.com/bismuth-pkm/bismuth/wiki';

/**
 * Throws if the URL does not start with HELP_BASE_URL.
 * Call this before any shell.open() invocation in SettingsHelp.
 */
export function assertHelpUrl(url: string): void {
  if (!url.startsWith(HELP_BASE_URL)) {
    throw new Error(`Help URL rejected: must start with ${HELP_BASE_URL}`);
  }
}
