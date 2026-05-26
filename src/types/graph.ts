/**
 * Graph-related type definitions
 * @module types/graph
 */

/**
 * Graph node representing a note
 * @interface GraphNode
 */
export interface GraphNode {
  /** Unique node ID (note path) */
  id: string;
  /** Display label (note title) */
  label: string;
  /** Node type */
  type: 'note' | 'tag' | 'folder';
  /** Number of connections */
  degree: number;
  /** Node metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Graph edge representing a link
 * @interface GraphEdge
 */
export interface GraphEdge {
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Edge type */
  type: 'link' | 'backlink' | 'tag';
  /** Edge weight/strength */
  weight: number;
}

/**
 * Complete graph data structure
 * @interface Graph
 */
export interface Graph {
  /** All nodes in the graph */
  nodes: GraphNode[];
  /** All edges in the graph */
  edges: GraphEdge[];
  /** Graph metadata */
  metadata?: {
    /** Total number of notes */
    noteCount: number;
    /** Total number of links */
    linkCount: number;
    /** Last updated timestamp */
    lastUpdated: Date;
  };
}
