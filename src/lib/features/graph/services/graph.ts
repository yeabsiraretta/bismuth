/**
 * Graph Service
 *
 * IPC wrappers for knowledge graph operations: nodes, edges,
 * backlinks, outgoing links, and semantic similarity lookups.
 */

import { invoke } from '@tauri-apps/api/core';
import type { Link } from '@/types/data/vault';
import type { GraphNode, GraphEdge, GraphData } from '../types';

/** A node in the knowledge graph (represents a single note). */
export type { GraphNode, GraphEdge, GraphData };

/**
 * Fetches the full knowledge graph for the current vault.
 * @returns All nodes and edges for graph visualization.
 */
export async function getGraphData(): Promise<GraphData> {
  try {
    return await invoke<GraphData>('get_graph_data');
  } catch (error) {
    throw new Error(`Failed to get graph data: ${error}`);
  }
}

/**
 * Retrieves all inbound links (backlinks) pointing to a given note.
 * @param path - Absolute path of the target note.
 */
export async function getBacklinks(path: string): Promise<Link[]> {
  try {
    return await invoke<Link[]>('get_backlinks', { path });
  } catch (error) {
    throw new Error(`Failed to get backlinks: ${error}`);
  }
}

/** A mention occurrence within a note's content. */
export interface Mention {
  noteId: string;
  notePath: string;
  noteName: string;
  context: string;
  lineNumber: number;
}

/** Backlinks data with both linked and unlinked (potential) mentions. */
export interface BacklinksData {
  linkedMentions: Mention[];
  unlinkedMentions: Mention[];
}

/** Outgoing links from a note to other notes. */
export interface OutgoingLinksData {
  links: Array<{ target: string; targetPath: string; context: string }>;
}

/**
 * Retrieves structured backlink data including unlinked mentions.
 * @param noteId - ID of the note to find backlinks for.
 */
export async function getBacklinksData(noteId: string): Promise<BacklinksData> {
  try {
    return await invoke<BacklinksData>('get_backlinks', { noteId });
  } catch (error) {
    throw new Error(`Failed to get backlinks data: ${error}`);
  }
}

/**
 * Retrieves all outgoing links from a note.
 * @param noteId - ID of the source note.
 */
export async function getOutgoingLinks(noteId: string): Promise<OutgoingLinksData> {
  try {
    return await invoke<OutgoingLinksData>('get_outgoing_links', { noteId });
  } catch (error) {
    throw new Error(`Failed to get outgoing links: ${error}`);
  }
}

/**
 * Creates an explicit wikilink from an unlinked mention in a backlink.
 */
export async function createLinkFromMention(
  sourceNoteId: string,
  targetNoteId: string,
  lineNumber: number
): Promise<void> {
  try {
    await invoke('create_link_from_mention', { sourceNoteId, targetNoteId, lineNumber });
  } catch (error) {
    throw new Error(`Failed to create link from mention: ${error}`);
  }
}

/**
 * Creates an explicit wikilink from an unlinked mention in outgoing links.
 */
export async function createLinkFromUnlinkedMention(
  sourceNoteId: string,
  targetNoteId: string,
  lineNumber: number
): Promise<void> {
  try {
    await invoke('create_link_from_unlinked_mention', { sourceNoteId, targetNoteId, lineNumber });
  } catch (error) {
    throw new Error(`Failed to create link from unlinked mention: ${error}`);
  }
}

/**
 * Gets notes similar to the given note path using embeddings.
 */
export async function getSimilarNotes(
  path: string,
  topK: number = 8
): Promise<Array<{ path: string; score: number }>> {
  try {
    return await invoke('get_similar_notes', { path, topK });
  } catch (error) {
    throw new Error(`Failed to get similar notes: ${error}`);
  }
}

/**
 * Looks up notes by semantic text query using embeddings.
 */
export async function lookupByText(
  query: string,
  topK: number = 10
): Promise<Array<{ path: string; score: number }>> {
  try {
    return await invoke('lookup_by_text', { query, topK });
  } catch (error) {
    throw new Error(`Failed to lookup by text: ${error}`);
  }
}

/** Position output from the backend force-directed layout engine. */
export interface NodePosition {
  id: string;
  x: number;
  y: number;
}

/** Settings for the backend layout computation. */
export interface LayoutSettings {
  center_force: number;
  repel_force: number;
  link_force: number;
  link_distance: number;
  width: number;
  height: number;
  iterations: number;
}

/**
 * Computes force-directed layout positions using the Rust backend.
 * Uses Barnes-Hut O(n log n) algorithm for performance with large graphs.
 * @returns Positioned nodes with x/y coordinates.
 */
export async function computeGraphLayout(settings: LayoutSettings): Promise<NodePosition[]> {
  try {
    return await invoke<NodePosition[]>('compute_graph_layout', { settings });
  } catch (error) {
    throw new Error(`Failed to compute graph layout: ${error}`);
  }
}

/** A suggested concept link found by analyzing note content. */
export interface ConceptSuggestion {
  title: string;
  path: string;
  matched_text: string;
  offset: number;
  length: number;
}

/**
 * Gets concept suggestions for a note based on its content.
 */
export async function getConceptSuggestions(
  notePath: string,
  content: string
): Promise<ConceptSuggestion[]> {
  try {
    return await invoke<ConceptSuggestion[]>('get_concept_suggestions', { notePath, content });
  } catch (error) {
    throw new Error(`Failed to get concept suggestions: ${error}`);
  }
}
