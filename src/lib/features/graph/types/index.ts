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
	/** Relationship type (e.g., 'wikilink', 'tag', 'smart'). */
	edge_type: string;
	/** Relevance/similarity score (0–1). Used by Smart Connections. */
	relevance?: number;
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
	/** Velocity damping factor per tick (0–1, higher = more momentum). */
	damping: number;
	/** Minimum collision radius between nodes (px). */
	collisionRadius: number;
}

/** Color palette for each node type in the graph. */
export interface NodeColors {
	note: string;
	attachment: string;
	tag: string;
	unresolved: string;
}

/** A single smart connection result from semantic similarity. */
export interface SmartConnection {
	/** Path or block ID of the connected content. */
	path: string;
	/** Relevance score 0–1 (higher = more similar). */
	score: number;
	/** Whether this is a block-level connection vs note-level. */
	isBlock: boolean;
	/** Display label. */
	label: string;
	/** Optional excerpt from the connected content. */
	excerpt?: string;
}

/** Connection granularity for Smart Connections visualizer. */
export type ConnectionMode = 'note' | 'block';

/** Settings specific to the Smart Connections Visualizer. */
export interface SmartGraphSettings {
	/** Minimum relevance threshold (0–1) for displaying connections. */
	minRelevance: number;
	/** Whether to show note-level or block-level connections. */
	connectionMode: ConnectionMode;
	/** Minimum link thickness (for least relevant connections). */
	minLinkThickness: number;
	/** Maximum link thickness (for most relevant connections). */
	maxLinkThickness: number;
	/** Font size for node labels (px). */
	nodeLabelSize: number;
	/** Font size for link labels showing relevance score (px). */
	linkLabelSize: number;
	/** Maximum label characters before truncation. */
	maxLabelChars: number;
	/** Whether to show relevance scores on links. */
	showLinkLabels: boolean;
	/** Whether to show note previews on hover (with Cmd/Ctrl). */
	showPreviewOnHover: boolean;
	/** Node size multiplier for the center (active) note. */
	centerNodeScale: number;
}
