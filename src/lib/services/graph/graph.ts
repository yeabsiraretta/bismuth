import { invoke } from '@tauri-apps/api/core';
import type { Link } from '@/types/vault';

export interface GraphNode {
  id: string;
  title: string;
  path: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export async function getGraphData(): Promise<GraphData> {
  try {
    return await invoke<GraphData>('get_graph_data');
  } catch (error) {
    throw new Error(`Failed to get graph data: ${error}`);
  }
}

export async function getBacklinks(path: string): Promise<Link[]> {
  try {
    return await invoke<Link[]>('get_backlinks', { path });
  } catch (error) {
    throw new Error(`Failed to get backlinks: ${error}`);
  }
}

export interface Mention {
  noteId: string;
  notePath: string;
  noteName: string;
  context: string;
  lineNumber: number;
}

export interface BacklinksData {
  linkedMentions: Mention[];
  unlinkedMentions: Mention[];
}

export interface OutgoingLinksData {
  links: Array<{ target: string; targetPath: string; context: string }>;
}

export async function getBacklinksData(noteId: string): Promise<BacklinksData> {
  try {
    return await invoke<BacklinksData>('get_backlinks', { noteId });
  } catch (error) {
    throw new Error(`Failed to get backlinks data: ${error}`);
  }
}

export async function getOutgoingLinks(noteId: string): Promise<OutgoingLinksData> {
  try {
    return await invoke<OutgoingLinksData>('get_outgoing_links', { noteId });
  } catch (error) {
    throw new Error(`Failed to get outgoing links: ${error}`);
  }
}
