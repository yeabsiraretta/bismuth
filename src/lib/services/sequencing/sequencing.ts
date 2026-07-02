import { invoke } from '@tauri-apps/api/core';
import { setFrontmatterField, getFrontmatter } from '@/services/vault/frontmatter';

export interface SequenceInfo {
  prev?: string;
  next?: string;
  series?: string;
}

/** Reads the sequence metadata from a note's frontmatter. */
export async function getSequence(path: string): Promise<SequenceInfo> {
  const fm = await getFrontmatter(path);
  const seq = fm['sequence'] as Record<string, string> | undefined;
  if (!seq) return {};
  return {
    prev: seq['prev'],
    next: seq['next'],
    series: seq['series'],
  };
}

/** Sets sequence prev/next links on a note. */
export async function setSequence(path: string, info: SequenceInfo): Promise<void> {
  await setFrontmatterField(path, 'sequence', info);
}

/** Sets the next note in sequence (also updates the target's prev). */
export async function setNext(currentPath: string, nextPath: string): Promise<void> {
  const currentSeq = await getSequence(currentPath);
  const nextSeq = await getSequence(nextPath);
  await setSequence(currentPath, { ...currentSeq, next: nextPath });
  await setSequence(nextPath, { ...nextSeq, prev: currentPath });
}

/** Sets the previous note in sequence (also updates the target's next). */
export async function setPrev(currentPath: string, prevPath: string): Promise<void> {
  const currentSeq = await getSequence(currentPath);
  const prevSeq = await getSequence(prevPath);
  await setSequence(currentPath, { ...currentSeq, prev: prevPath });
  await setSequence(prevPath, { ...prevSeq, next: currentPath });
}

/** Navigates to next/prev note in sequence. Returns the target path or null. */
export async function getNavigationTarget(
  path: string,
  direction: 'next' | 'prev'
): Promise<string | null> {
  const seq = await getSequence(path);
  return seq[direction] ?? null;
}

/**
 * Auto-sequences notes in a folder by alphabetical order.
 * Creates a linked chain: note1 → note2 → note3 → ...
 */
export async function sequenceFromFolder(folderPath: string, series?: string): Promise<number> {
  const notes = await invoke<{ path: string }[]>('list_notes', {
    vaultPath: folderPath,
    folderPath,
  });

  if (notes.length < 2) return 0;

  const sorted = notes.map((n) => n.path).sort((a, b) => a.localeCompare(b));

  for (let i = 0; i < sorted.length; i++) {
    const seq: SequenceInfo = { series };
    if (i > 0) seq.prev = sorted[i - 1];
    if (i < sorted.length - 1) seq.next = sorted[i + 1];
    await setSequence(sorted[i], seq);
  }

  return sorted.length;
}
