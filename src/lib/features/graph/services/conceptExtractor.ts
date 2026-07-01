/**
 * Concept Extractor — NLP-lite extraction of concepts from markdown text,
 * builds a co-occurrence graph of concepts and wikilinks.
 */
import type { GraphNode, GraphEdge } from '../types';
import type { ConceptMode, LinkMode } from '../types/analytics';

// ─── Stopwords ───────────────────────────────────────────────────────────────

const DEFAULT_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'not', 'no', 'nor',
  'so', 'yet', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
  'such', 'than', 'too', 'very', 'just', 'about', 'above', 'after',
  'again', 'all', 'also', 'am', 'any', 'as', 'because', 'before',
  'between', 'during', 'here', 'how', 'if', 'into', 'it', 'its',
  'itself', 'let', 'like', 'made', 'make', 'many', 'me', 'much', 'my',
  'new', 'now', 'off', 'only', 'out', 'own', 'over', 'said', 'same',
  'she', 'he', 'her', 'his', 'that', 'their', 'them', 'then', 'there',
  'these', 'they', 'this', 'those', 'through', 'under', 'until', 'up',
  'us', 'use', 'used', 'using', 'we', 'what', 'when', 'where', 'which',
  'while', 'who', 'whom', 'why', 'you', 'your',
]);

// ─── Wikilink extraction ─────────────────────────────────────────────────────

const WIKILINK_RE = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

export function extractWikilinks(text: string): string[] {
  const links: string[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(WIKILINK_RE.source, 'g');
  while ((match = re.exec(text)) !== null) {
    links.push(match[1].trim());
  }
  return links;
}

// ─── Concept extraction ──────────────────────────────────────────────────────

/** Tokenize text into candidate concept words/phrases */
export function extractConcepts(
  text: string,
  stopwords: Set<string> = DEFAULT_STOPWORDS,
): string[] {
  // Strip markdown formatting, code blocks, and frontmatter
  let clean = text
    .replace(/^---[\s\S]*?---/m, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(WIKILINK_RE, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_~]/g, '')
    .replace(/%%[><].*?%%/g, '');

  // Split into words, filter, lowercase
  const words = clean
    .split(/[\s,;:!?()\[\]{}"'`\-–—/\\|]+/)
    .map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter(w => w.length >= 3 && !stopwords.has(w) && !/^\d+$/.test(w));

  return words;
}

/** Count concept frequencies */
export function conceptFrequencies(concepts: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const c of concepts) freq.set(c, (freq.get(c) ?? 0) + 1);
  return freq;
}

/** Get top N concepts by frequency */
export function topConcepts(freq: Map<string, number>, n: number = 50): string[] {
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([word]) => word);
}

// ─── Co-occurrence graph building ────────────────────────────────────────────

interface ParagraphData {
  wikilinks: string[];
  concepts: string[];
}

/** Split text into paragraphs and extract data from each */
export function splitParagraphs(
  text: string,
  mode: ConceptMode,
  stopwords: Set<string> = DEFAULT_STOPWORDS,
): ParagraphData[] {
  const paragraphs = text.split(/\n\s*\n/);
  return paragraphs.map(p => ({
    wikilinks: extractWikilinks(p),
    concepts: mode === 'wikilinks-and-concepts' ? extractConcepts(p, stopwords) : [],
  }));
}

/** Build a concept co-occurrence graph from content */
export function buildConceptGraph(
  content: string,
  mode: ConceptMode = 'wikilinks-and-concepts',
  linkMode: LinkMode = 'paragraph',
  stopwords: Set<string> = DEFAULT_STOPWORDS,
  maxConcepts: number = 80,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const paragraphs = splitParagraphs(content, mode, stopwords);

  // Collect all concepts and wikilinks
  const allWikilinks = new Set<string>();
  const conceptFreq = new Map<string, number>();

  for (const p of paragraphs) {
    for (const wl of p.wikilinks) allWikilinks.add(wl);
    for (const c of p.concepts) conceptFreq.set(c, (conceptFreq.get(c) ?? 0) + 1);
  }

  // Select top concepts
  const topConceptList = topConcepts(conceptFreq, maxConcepts);
  const conceptSet = new Set(topConceptList);

  // Build nodes
  const nodeMap = new Map<string, GraphNode>();
  for (const wl of allWikilinks) {
    nodeMap.set(wl, { id: wl, label: wl, node_type: 'note' });
  }
  for (const c of conceptSet) {
    if (!nodeMap.has(c)) {
      nodeMap.set(c, { id: `concept:${c}`, label: c, node_type: 'tag' });
    }
  }

  // Build edges from co-occurrence
  const edgeCounts = new Map<string, number>();
  const addEdge = (a: string, b: string) => {
    if (a === b) return;
    const key = [a, b].sort().join('||');
    edgeCounts.set(key, (edgeCounts.get(key) ?? 0) + 1);
  };

  if (linkMode === 'paragraph') {
    for (const p of paragraphs) {
      const items = [
        ...p.wikilinks,
        ...(mode === 'wikilinks-and-concepts' ? p.concepts.filter(c => conceptSet.has(c)) : []),
      ];
      // All pairs within paragraph
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const idA = allWikilinks.has(items[i]) ? items[i] : `concept:${items[i]}`;
          const idB = allWikilinks.has(items[j]) ? items[j] : `concept:${items[j]}`;
          addEdge(idA, idB);
        }
      }
    }
  } else {
    // page mode: all wikilinks connected to page
    const allItems = [
      ...allWikilinks,
      ...(mode === 'wikilinks-and-concepts' ? [...conceptSet].map(c => `concept:${c}`) : []),
    ];
    for (let i = 0; i < allItems.length; i++) {
      for (let j = i + 1; j < allItems.length; j++) {
        addEdge(allItems[i], allItems[j]);
      }
    }
  }

  const edges: GraphEdge[] = [];
  for (const key of edgeCounts.keys()) {
    const [from, to] = key.split('||');
    if (nodeMap.has(from) && nodeMap.has(to)) {
      edges.push({ from, to, edge_type: 'concept' });
    }
  }

  return { nodes: [...nodeMap.values()], edges };
}

// ─── Multi-source content aggregation ────────────────────────────────────────

export interface ContentSource {
  path: string;
  content: string;
}

/** Build a combined concept graph from multiple note sources */
export function buildMultiSourceGraph(
  sources: ContentSource[],
  mode: ConceptMode = 'wikilinks-and-concepts',
  linkMode: LinkMode = 'paragraph',
  stopwords: Set<string> = DEFAULT_STOPWORDS,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const allNodes = new Map<string, GraphNode>();
  const allEdgeCounts = new Map<string, number>();

  for (const source of sources) {
    const { nodes, edges } = buildConceptGraph(source.content, mode, linkMode, stopwords);
    for (const n of nodes) {
      if (!allNodes.has(n.id)) allNodes.set(n.id, n);
    }
    for (const e of edges) {
      const key = [e.from, e.to].sort().join('||');
      allEdgeCounts.set(key, (allEdgeCounts.get(key) ?? 0) + 1);
    }
  }

  const edges: GraphEdge[] = [];
  for (const key of allEdgeCounts.keys()) {
    const [from, to] = key.split('||');
    edges.push({ from, to, edge_type: 'concept' });
  }

  return { nodes: [...allNodes.values()], edges };
}
