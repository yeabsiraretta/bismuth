/**
 * Shared panel helper functions used across multiple sidebar panels.
 */

/** Options for the `openNote` helper. */
export interface OpenNoteOptions {
  content?: string;
  append?: boolean;
}

/** Dispatch an `open-note` CustomEvent to open a note by path. */
export function openNote(path: string, opts?: OpenNoteOptions | string): void {
  const detail: { path: string; content?: string; append?: boolean } = { path };
  if (typeof opts === 'string') {
    detail.content = opts;
  } else if (opts) {
    if (opts.content !== undefined) detail.content = opts.content;
    if (opts.append !== undefined) detail.append = opts.append;
  }
  window.dispatchEvent(new CustomEvent('open-note', { detail }));
}

/** Extract the file name from a path, optionally stripping the `.md` extension. */
export function fileName(path: string, stripExt = false): string {
  const name = path.split('/').pop() ?? path;
  return stripExt ? name.replace(/\.(md|canvas)$/, '') : name;
}
