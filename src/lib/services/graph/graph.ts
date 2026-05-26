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
