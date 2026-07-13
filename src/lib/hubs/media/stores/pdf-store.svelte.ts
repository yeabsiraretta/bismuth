/**
 * PDF Store — manages active PDF viewer state and annotations.
 */

import type {
  AnnotationTargetMeta,
  PdfAnnotation,
  PdfOutlineItem,
  PdfViewerState,
} from '@/hubs/media/types/pdf-types';

// ── State ────────────────────────────────────────────────────────────────────

let viewerState = $state<PdfViewerState | null>(null);
let annotations = $state<PdfAnnotation[]>([]);
let outline = $state<PdfOutlineItem[]>([]);
let activeAnnotationId = $state<string | null>(null);
let annotationTarget = $state<AnnotationTargetMeta | null>(null);
let annotationSidebarOpen = $state(false);

// ── Getters ──────────────────────────────────────────────────────────────────

export function getPdfViewerState(): PdfViewerState | null {
  return viewerState;
}

function getPdfAnnotations(): PdfAnnotation[] {
  return annotations;
}

export function getPdfOutline(): PdfOutlineItem[] {
  return outline;
}

function getActiveAnnotationId(): string | null {
  return activeAnnotationId;
}

function getAnnotationsByPage(page: number): PdfAnnotation[] {
  return annotations.filter((a) => a.page === page);
}

function getAnnotationTarget(): AnnotationTargetMeta | null {
  return annotationTarget;
}

function isAnnotationSidebarOpen(): boolean {
  return annotationSidebarOpen;
}

function getAnnotationById(id: string): PdfAnnotation | undefined {
  return annotations.find((a) => a.id === id);
}

function getAnnotationByBlockId(blockId: string): PdfAnnotation | undefined {
  return annotations.find((a) => a.blockId === blockId);
}

// ── Setters ──────────────────────────────────────────────────────────────────

function setPdfViewerState(state: PdfViewerState): void {
  viewerState = state;
}

function updatePdfPage(page: number): void {
  if (viewerState) viewerState = { ...viewerState, currentPage: page };
}

function updatePdfZoom(zoom: number): void {
  if (viewerState) viewerState = { ...viewerState, zoom };
}

function setPdfOutline(items: PdfOutlineItem[]): void {
  outline = items;
}

function setPdfAnnotations(items: PdfAnnotation[]): void {
  annotations = items;
}

function addPdfAnnotation(annotation: PdfAnnotation): void {
  annotations = [...annotations, annotation];
}

function removePdfAnnotation(id: string): void {
  annotations = annotations.filter((a) => a.id !== id);
}

function updatePdfAnnotation(id: string, updates: Partial<PdfAnnotation>): void {
  annotations = annotations.map((a) =>
    a.id === id ? { ...a, ...updates, updatedAt: Date.now() } : a
  );
}

function setActiveAnnotation(id: string | null): void {
  activeAnnotationId = id;
}

function setAnnotationTarget(target: AnnotationTargetMeta | null): void {
  annotationTarget = target;
}

function toggleAnnotationSidebar(): void {
  annotationSidebarOpen = !annotationSidebarOpen;
}

function setAnnotationSidebarOpen(open: boolean): void {
  annotationSidebarOpen = open;
}

function clearPdfState(): void {
  viewerState = null;
  annotations = [];
  outline = [];
  activeAnnotationId = null;
  annotationTarget = null;
  annotationSidebarOpen = false;
}

// ── Persistence key ──────────────────────────────────────────────────────────

function getAnnotationStorageKey(filePath: string): string {
  return `bismuth:pdf-annotations:${filePath}`;
}

function loadAnnotations(filePath: string): PdfAnnotation[] {
  try {
    const raw = localStorage.getItem(getAnnotationStorageKey(filePath));
    if (!raw) return [];
    return JSON.parse(raw) as PdfAnnotation[];
  } catch {
    return [];
  }
}

function saveAnnotations(filePath: string, items: PdfAnnotation[]): void {
  try {
    localStorage.setItem(getAnnotationStorageKey(filePath), JSON.stringify(items));
  } catch {
    /* quota exceeded */
  }
}
