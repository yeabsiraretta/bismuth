// Graph layout Web Worker — runs force simulation off the main thread.
// Receives: { type: 'tick', nodes, edges, settings, width, height }
// Sends:    { type: 'tick-result', nodes }
// Receives: { type: 'warmup', nodes, edges, settings, width, height, ticks }
// Sends:    { type: 'warmup-result', nodes }

import type { GraphEdge, GraphSettings } from '../types';
import type { SimNode } from '../utils/simulation';
import { tickForces } from '../utils/simulation';

type IncomingMessage =
  | {
      type: 'tick';
      nodes: SimNode[];
      edges: GraphEdge[];
      settings: GraphSettings;
      width: number;
      height: number;
    }
  | {
      type: 'warmup';
      nodes: SimNode[];
      edges: GraphEdge[];
      settings: GraphSettings;
      width: number;
      height: number;
      ticks: number;
    };

self.onmessage = (e: MessageEvent<IncomingMessage>) => {
  const { type } = e.data;

  if (type === 'tick') {
    const { nodes, edges, settings, width, height } = e.data;
    tickForces(nodes, edges, settings, width, height);
    self.postMessage({ type: 'tick-result', nodes });
    return;
  }

  if (type === 'warmup') {
    const { nodes, edges, settings, width, height, ticks } = e.data;
    for (let i = 0; i < ticks; i++) {
      tickForces(nodes, edges, settings, width, height);
    }
    self.postMessage({ type: 'warmup-result', nodes });
  }
};
