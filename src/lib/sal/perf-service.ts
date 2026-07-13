import { invokeCommand } from '@/ipc/invoke';
import { isTauriAvailable } from '@/utils/platform';

export interface BatchNoteContent {
  path: string;
  content: string;
}

interface NativeGraphNode {
  id: string;
  label: string;
}

interface NativeGraphEdge {
  source: string;
  target: string;
}

export interface NativeGraphData {
  nodes: NativeGraphNode[];
  edges: NativeGraphEdge[];
}

export interface NativeTagCount {
  tag: string;
  count: number;
}

export async function batchReadNotes(paths: string[]): Promise<BatchNoteContent[]> {
  if (!isTauriAvailable()) return [];
  return invokeCommand<BatchNoteContent[]>('batch_read_notes', { paths });
}

export async function buildGraphDataNative(): Promise<NativeGraphData> {
  if (!isTauriAvailable()) return { nodes: [], edges: [] };
  return invokeCommand<NativeGraphData>('build_graph_data');
}

export async function extractVaultTagsNative(): Promise<NativeTagCount[]> {
  if (!isTauriAvailable()) return [];
  return invokeCommand<NativeTagCount[]>('extract_vault_tags');
}
