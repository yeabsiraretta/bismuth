/**
 * Graph export utilities
 * Export graph visualizations as images
 */

export async function exportGraphAsPNG(canvas: HTMLCanvasElement, filename = 'graph.png') {
	try {
		const blob = await new Promise<Blob | null>((resolve) => {
			canvas.toBlob(resolve, 'image/png');
		});

		if (!blob) {
			throw new Error('Failed to create image blob');
		}

		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		link.click();
		URL.revokeObjectURL(url);
	} catch (error) {
		console.error('Failed to export graph as PNG:', error);
		throw error;
	}
}

export async function exportGraphAsSVG(
	nodes: Array<{ id: string; label: string; x: number; y: number }>,
	edges: Array<{ from: string; to: string }>,
	width: number,
	height: number,
	filename = 'graph.svg'
) {
	const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .node { fill: #888; stroke: #fff; stroke-width: 2; }
    .node:hover { fill: #6bb6ff; }
    .edge { stroke: #666; stroke-width: 1; }
    .label { fill: #fff; font-family: system-ui; font-size: 12px; text-anchor: middle; }
  </style>
  
  <!-- Edges -->
  <g class="edges">
${edges
	.map((edge) => {
		const source = nodes.find((n) => n.id === edge.from);
		const target = nodes.find((n) => n.id === edge.to);
		if (!source || !target) return '';
		return `    <line class="edge" x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" />`;
	})
	.join('\n')}
  </g>
  
  <!-- Nodes -->
  <g class="nodes">
${nodes
	.map(
		(node) => `    <circle class="node" cx="${node.x}" cy="${node.y}" r="5" />
    <text class="label" x="${node.x}" y="${node.y - 10}">${escapeXml(node.label)}</text>`
	)
	.join('\n')}
  </g>
</svg>`;

	const blob = new Blob([svg], { type: 'image/svg+xml' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}

function escapeXml(unsafe: string): string {
	return unsafe
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export function exportGraphAsJSON(
	nodes: Array<{ id: string; label: string; node_type: string }>,
	edges: Array<{ from: string; to: string; edge_type: string }>,
	filename = 'graph.json'
) {
	const data = {
		nodes,
		edges,
		metadata: {
			exportedAt: new Date().toISOString(),
			nodeCount: nodes.length,
			edgeCount: edges.length
		}
	};

	const json = JSON.stringify(data, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}
