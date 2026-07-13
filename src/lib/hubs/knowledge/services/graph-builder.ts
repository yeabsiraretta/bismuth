import type { NoteMeta } from '@/hubs/core/stores/vault-store.svelte';
import { getCachedContent } from '@/hubs/editor/services/file-ops';
import { readNote } from '@/sal/note-service';
import { buildGraphDataNative } from '@/sal/perf-service';
import { log } from '@/utils/log/logger';
import { isTauriAvailable } from '@/utils/platform';
import { resolveWikilink } from '@/utils/wikilink';

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const WIKILINK_RE = /\[\[([^\]|#]+)/g;

function randomPos(): GraphNode {
  return {
    id: '',
    label: '',
    x: (Math.random() - 0.5) * 600,
    y: (Math.random() - 0.5) * 400,
    z: (Math.random() - 0.5) * 400,
    vx: 0,
    vy: 0,
    vz: 0,
  };
}

export async function buildGraphData(notes: NoteMeta[]): Promise<GraphData> {
  const start = performance.now();

  if (isTauriAvailable()) {
    try {
      const native = await buildGraphDataNative();
      const nodes: GraphNode[] = native.nodes.map((n) => ({
        ...randomPos(),
        id: n.id,
        label: n.label,
      }));
      const elapsed = Math.round(performance.now() - start);
      log.debug('Graph built (Rust)', {
        nodes: nodes.length,
        edges: native.edges.length,
        durationMs: elapsed,
      });
      return { nodes, edges: native.edges };
    } catch {
      log.warn('Rust graph build failed, falling back to JS');
    }
  }

  const allPaths = notes.map((n) => n.path);
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seen: Record<string, boolean> = {};

  for (const note of notes) {
    if (!seen[note.path]) {
      seen[note.path] = true;
      nodes.push({
        ...randomPos(),
        id: note.path,
        label: note.title,
      });
    }
  }

  for (const note of notes) {
    let content = getCachedContent(note.path);
    if (!content) {
      try {
        const resp = await readNote(note.path);
        content = resp.content;
      } catch {
        continue;
      }
    }
    let match: RegExpExecArray | null;
    WIKILINK_RE.lastIndex = 0;
    while ((match = WIKILINK_RE.exec(content)) !== null) {
      const target = match[1].trim();
      const resolved = resolveWikilink(target, allPaths);
      if (resolved && resolved !== note.path) {
        edges.push({ source: note.path, target: resolved });
      }
    }
  }

  const elapsed = Math.round(performance.now() - start);
  log.debug('Graph built (JS)', { nodes: nodes.length, edges: edges.length, durationMs: elapsed });
  return { nodes, edges };
}
