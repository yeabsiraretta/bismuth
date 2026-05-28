export type NodeType = 'note' | 'attachment' | 'tag' | 'unresolved';

export interface GraphNode {
	id: string;
	label: string;
	node_type: NodeType | string;
	connection_count?: number;
}

export interface GraphEdge {
	from: string;
	to: string;
	edge_type: string;
}

export interface GraphData {
	nodes: GraphNode[];
	edges: GraphEdge[];
}

export interface GraphSettings {
	showTags: boolean;
	showAttachments: boolean;
	showOrphans: boolean;
	showArrows: boolean;
	showLabels: boolean;
	textFadeThreshold: number;
	nodeSize: number;
	linkThickness: number;
	centerForce: number;
	repelForce: number;
	linkForce: number;
	linkDistance: number;
	animate: boolean;
}

export interface NodeColors {
	note: string;
	attachment: string;
	tag: string;
	unresolved: string;
}
