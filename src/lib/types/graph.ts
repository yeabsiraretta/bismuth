/** Classification of nodes in the knowledge graph. */
export type NodeType = 'note' | 'attachment' | 'tag' | 'unresolved';

/** A single node in the vault's knowledge graph. */
export interface GraphNode {
	/** Unique node identifier (typically the note path or tag name). */
	id: string;
	/** Display label shown in the graph visualization. */
	label: string;
	/** Node classification for coloring and filtering. */
	node_type: NodeType | string;
	/** Total inbound + outbound edges (for sizing). */
	connection_count?: number;
}

/** A directed edge between two graph nodes. */
export interface GraphEdge {
	/** Source node ID. */
	from: string;
	/** Target node ID. */
	to: string;
	/** Relationship type (e.g., 'wikilink', 'tag'). */
	edge_type: string;
}

/** Complete graph dataset returned from the backend. */
export interface GraphData {
	nodes: GraphNode[];
	edges: GraphEdge[];
}

/** User-configurable settings for the graph visualization. */
export interface GraphSettings {
	showTags: boolean;
	showAttachments: boolean;
	showOrphans: boolean;
	showArrows: boolean;
	showLabels: boolean;
	/** Zoom level below which text labels fade out. */
	textFadeThreshold: number;
	/** Base radius multiplier for node circles. */
	nodeSize: number;
	/** Stroke width for edge lines. */
	linkThickness: number;
	/** Force-directed simulation: pull toward center. */
	centerForce: number;
	/** Force-directed simulation: node repulsion strength. */
	repelForce: number;
	/** Force-directed simulation: edge spring strength. */
	linkForce: number;
	/** Force-directed simulation: ideal edge length (px). */
	linkDistance: number;
	/** Whether the simulation continues running after initial layout. */
	animate: boolean;
}

/** Color palette for each node type in the graph. */
export interface NodeColors {
	note: string;
	attachment: string;
	tag: string;
	unresolved: string;
}
