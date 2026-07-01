/** Home tab search — filters vault notes/files by query and file type. */

import type { Note } from '@/types/data/vault';
import type { FileTypeFilter } from '../types';
import { FILE_TYPE_FILTERS } from '../types';

export interface HomeSearchResult {
  path: string;
  title: string;
  extension: string;
  matchScore: number;
}

/** Parse a filter prefix from search input (e.g. "markdown:" activates filter). */
export function detectFilter(query: string): { filter: FileTypeFilter | null; cleanQuery: string } {
  const lower = query.toLowerCase().trim();
  for (const f of FILE_TYPE_FILTERS) {
    if (lower.startsWith(f.key + ':')) {
      return { filter: f, cleanQuery: query.slice(f.key.length + 1).trim() };
    }
  }
  return { filter: null, cleanQuery: query };
}

/** Search notes with optional file type filter. */
export function searchFiles(
  allNotes: Note[],
  query: string,
  activeFilter: FileTypeFilter | null,
  maxResults = 20,
): HomeSearchResult[] {
  const lower = query.toLowerCase();

  let pool = allNotes;
  if (activeFilter) {
    pool = pool.filter(n => {
      const ext = getExtension(n.path);
      return activeFilter.extensions.includes(ext);
    });
  }

  if (!lower) {
    return pool.slice(0, maxResults).map(n => ({
      path: n.path,
      title: n.title,
      extension: getExtension(n.path),
      matchScore: 0,
    }));
  }

  const scored = pool
    .map(n => {
      const titleLower = n.title.toLowerCase();
      const pathLower = n.path.toLowerCase();
      let score = 0;
      if (titleLower === lower) score = 100;
      else if (titleLower.startsWith(lower)) score = 80;
      else if (titleLower.includes(lower)) score = 60;
      else if (pathLower.includes(lower)) score = 40;
      else return null;
      return {
        path: n.path,
        title: n.title,
        extension: getExtension(n.path),
        matchScore: score,
      };
    })
    .filter((r): r is HomeSearchResult => r !== null);

  scored.sort((a, b) => b.matchScore - a.matchScore);
  return scored.slice(0, maxResults);
}

function getExtension(path: string): string {
  const dot = path.lastIndexOf('.');
  return dot >= 0 ? path.slice(dot + 1).toLowerCase() : '';
}

/** Get the icon name for a file extension. */
export function getFileIcon(ext: string): string {
  switch (ext) {
    case 'md': return 'file-text';
    case 'canvas': return 'layout';
    case 'pdf': return 'file';
    case 'png': case 'jpg': case 'jpeg': case 'gif': case 'svg': case 'bmp': case 'webp':
      return 'image';
    case 'mp4': case 'webm': case 'mov': case 'mkv': case 'ogv':
      return 'video';
    case 'mp3': case 'wav': case 'm4a': case 'ogg': case 'flac':
      return 'music';
    default: return 'file';
  }
}
