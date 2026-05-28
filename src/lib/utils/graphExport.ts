/**
 * Graph export utilities
 * Export graph data to various formats
 */

export interface GraphNode {
  id: string;
  label: string;
  type?: string;
  tags?: string[];
}

export interface GraphEdge {
  from: string;
  to: string;
  type?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Export graph to JSON format
 */
export function exportToJSON(data: GraphData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Export graph to CSV format
 */
export function exportToCSV(data: GraphData): { nodes: string; edges: string } {
  const nodesCsv = [
    'id,label,type,tags',
    ...data.nodes.map(n =>
      `"${n.id}","${n.label}","${n.type || ''}","${(n.tags || []).join(';')}"`
    )
  ].join('\n');

  const edgesCsv = [
    'from,to,type',
    ...data.edges.map(e =>
      `"${e.from}","${e.to}","${e.type || ''}"`
    )
  ].join('\n');

  return { nodes: nodesCsv, edges: edgesCsv };
}

/**
 * Export graph to Graphviz DOT format
 */
export function exportToDOT(data: GraphData): string {
  const lines = ['digraph G {'];

  data.nodes.forEach(node => {
    lines.push(`  "${node.id}" [label="${node.label}"];`);
  });

  data.edges.forEach(edge => {
    lines.push(`  "${edge.from}" -> "${edge.to}";`);
  });

  lines.push('}');
  return lines.join('\n');
}

/**
 * Export graph as PNG (requires canvas element)
 */
export async function exportGraphAsPNG(canvas: HTMLCanvasElement, filename = 'graph.png'): Promise<void> {
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/**
 * Export graph as SVG
 */
export function exportGraphAsSVG(data: GraphData, filename = 'graph.svg'): void {
  // Simple SVG generation
  const width = 800;
  const height = 600;

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

  // Draw edges
  data.edges.forEach(_edge => {
    svg += `<line x1="100" y1="100" x2="200" y2="200" stroke="#666" />`;
  });

  // Draw nodes
  data.nodes.forEach((node, i) => {
    const x = 100 + (i * 50);
    const y = 100;
    svg += `<circle cx="${x}" cy="${y}" r="20" fill="#4a9eff" />`;
    svg += `<text x="${x}" y="${y + 30}" text-anchor="middle">${node.label}</text>`;
  });

  svg += '</svg>';

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export graph as JSON file
 */
export function exportGraphAsJSON(data: GraphData, filename = 'graph.json'): void {
  const json = exportToJSON(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
