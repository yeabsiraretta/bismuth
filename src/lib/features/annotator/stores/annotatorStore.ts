/**
 * Annotator store — manages annotation state, CRUD, and persistence.
 *
 * Annotations live as markdown files in the vault. This store loads them,
 * tracks the active viewer state, and provides mutation actions that
 * write back to the markdown file.
 */

import { writable, derived, get } from 'svelte/store';
import type {
  DocumentAnnotation,
  AnnotationFile,
  AnnotatorViewState,
  HighlightColor,
  AnnotationTargetType,
} from '../types';
import {
  serializeAnnotations,
  deserializeAnnotations,
  resolveTargetType,
} from '../services/annotationMarkdown';
import { log } from '@/utils/logger';
import { generatePrefixedId } from '@/utils/id';

// ─── State ──────────────────────────────────────────────────────────────────

export const annotatorView = writable<AnnotatorViewState>({
  isOpen: false,
  activeNotePath: null,
  currentPage: 1,
  totalPages: 0,
  zoom: 1.0,
  darkMode: false,
  sidebarVisible: true,
  activeColor: 'yellow',
  epubMode: 'paginated',
});

export const activeAnnotationFile = writable<AnnotationFile | null>(null);

export const annotations = derived(
  activeAnnotationFile,
  ($file: AnnotationFile | null) => $file?.annotations ?? [],
);

export const annotationCount = derived(
  annotations,
  ($anns: DocumentAnnotation[]) => $anns.length,
);

// ─── Actions ────────────────────────────────────────────────────────────────

/**
 * Opens an annotation note file, parsing its markdown content.
 */
export async function openAnnotationNote(notePath: string): Promise<void> {
  try {
    const { getNote } = await import('@/services/vault/vault');
    const note = await getNote(notePath);
    const { target, targetType, annotations: parsed } = deserializeAnnotations(note.content);

    activeAnnotationFile.set({
      notePath,
      target,
      targetType,
      annotations: parsed,
    });

    annotatorView.update((v) => ({
      ...v,
      isOpen: true,
      activeNotePath: notePath,
      currentPage: 1,
    }));

    log.info('Annotator: opened annotation note', { notePath, target, count: parsed.length });
  } catch (e) {
    log.error('Annotator: failed to open annotation note', e as Error);
  }
}

/**
 * Creates a new annotation note for a document.
 */
export async function createAnnotationNote(
  target: string,
  targetType?: AnnotationTargetType,
): Promise<string> {
  const resolved = resolveTargetType(target, targetType);
  const baseName = target.split('/').pop()?.replace(/\.[^.]+$/, '') ?? 'annotation';
  const notePath = `${baseName} — Annotations.md`;

  const content = serializeAnnotations(target, resolved, []);

  const { createNote } = await import('@/services/vault/vault');
  await createNote(notePath, content);

  activeAnnotationFile.set({
    notePath,
    target,
    targetType: resolved,
    annotations: [],
  });

  annotatorView.update((v) => ({
    ...v,
    isOpen: true,
    activeNotePath: notePath,
    currentPage: 1,
  }));

  log.info('Annotator: created annotation note', { notePath, target });
  return notePath;
}

/**
 * Adds a new annotation to the active file.
 */
export async function addAnnotation(
  quoteExact: string,
  quotePrefix: string,
  quoteSuffix: string,
  page?: number,
  chapter?: string,
): Promise<DocumentAnnotation | null> {
  const file = get(activeAnnotationFile);
  if (!file) return null;

  const view = get(annotatorView);
  const now = new Date().toISOString();

  const ann: DocumentAnnotation = {
    id: generatePrefixedId('ann'),
    target: file.target,
    targetType: file.targetType,
    page,
    chapter,
    quoteSelector: { exact: quoteExact, prefix: quotePrefix, suffix: quoteSuffix },
    color: view.activeColor,
    comment: '',
    tags: [],
    createdAt: now,
    updatedAt: now,
  };

  const updated = [...file.annotations, ann];
  activeAnnotationFile.set({ ...file, annotations: updated });
  await persistAnnotations();

  log.debug('Annotator: added annotation', { id: ann.id, page });
  return ann;
}

/**
 * Updates an existing annotation (comment, tags, color).
 */
export async function updateAnnotation(
  id: string,
  changes: Partial<Pick<DocumentAnnotation, 'comment' | 'tags' | 'color'>>,
): Promise<void> {
  const file = get(activeAnnotationFile);
  if (!file) return;

  const updated = file.annotations.map((a) =>
    a.id === id ? { ...a, ...changes, updatedAt: new Date().toISOString() } : a,
  );
  activeAnnotationFile.set({ ...file, annotations: updated });
  await persistAnnotations();
}

/**
 * Deletes an annotation by ID.
 */
export async function deleteAnnotation(id: string): Promise<void> {
  const file = get(activeAnnotationFile);
  if (!file) return;

  const updated = file.annotations.filter((a) => a.id !== id);
  activeAnnotationFile.set({ ...file, annotations: updated });
  await persistAnnotations();

  log.debug('Annotator: deleted annotation', { id });
}

/**
 * Closes the annotator viewer.
 */
export function closeAnnotator(): void {
  annotatorView.update((v) => ({ ...v, isOpen: false, activeNotePath: null }));
  activeAnnotationFile.set(null);
}

/**
 * Sets the current page (PDF navigation).
 */
export function setPage(page: number): void {
  annotatorView.update((v) => ({ ...v, currentPage: Math.max(1, Math.min(page, v.totalPages || page)) }));
}

/**
 * Sets the zoom level.
 */
export function setZoom(zoom: number): void {
  annotatorView.update((v) => ({ ...v, zoom: Math.max(0.25, Math.min(5.0, zoom)) }));
}

/**
 * Toggles dark mode for the reader.
 */
export function toggleDarkMode(): void {
  annotatorView.update((v) => ({ ...v, darkMode: !v.darkMode }));
}

/**
 * Toggles the annotation sidebar visibility.
 */
export function toggleSidebar(): void {
  annotatorView.update((v) => ({ ...v, sidebarVisible: !v.sidebarVisible }));
}

/**
 * Sets the active highlight color for new annotations.
 */
export function setActiveColor(color: HighlightColor): void {
  annotatorView.update((v) => ({ ...v, activeColor: color }));
}

// ─── Persistence ────────────────────────────────────────────────────────────

/**
 * Writes the current annotations back to the markdown file.
 */
async function persistAnnotations(): Promise<void> {
  const file = get(activeAnnotationFile);
  if (!file) return;

  const content = serializeAnnotations(file.target, file.targetType, file.annotations);
  const { writeNote } = await import('@/services/vault/vault');
  await writeNote(file.notePath, content);
}
