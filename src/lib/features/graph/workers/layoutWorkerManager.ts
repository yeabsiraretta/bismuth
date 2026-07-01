import type { GraphEdge, GraphSettings } from '../types';
import type { SimNode } from '../utils/simulation';
import { tickForces } from '../utils/simulation';
import { log } from '@/utils/logger';

type WorkerResult = { type: 'tick-result' | 'warmup-result'; nodes: SimNode[] };

/** Manages the graph layout Web Worker with automatic fallback to main thread. */
export class GraphLayoutWorker {
  private worker: Worker | null = null;
  private pending: ((nodes: SimNode[]) => void) | null = null;
  private ready = false;

  constructor() {
    try {
      this.worker = new Worker(new URL('./layout.worker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = (e: MessageEvent<WorkerResult>) => {
        const cb = this.pending;
        this.pending = null;
        cb?.(e.data.nodes);
      };
      this.worker.onerror = (err) => {
        log.warn('Graph layout worker error — falling back to main thread', { error: String(err) });
        this.worker = null;
      };
      this.ready = true;
    } catch {
      log.warn('Graph layout worker unavailable — using main thread');
      this.ready = false;
    }
  }

  /** Run one simulation tick. Returns updated nodes via callback. Falls back sync if worker unavailable. */
  tick(
    nodes: SimNode[],
    edges: GraphEdge[],
    settings: GraphSettings,
    width: number,
    height: number,
    onDone: (nodes: SimNode[]) => void
  ): void {
    if (!this.worker || !this.ready) {
      tickForces(nodes, edges, settings, width, height);
      onDone(nodes);
      return;
    }
    this.pending = onDone;
    this.worker.postMessage({ type: 'tick', nodes, edges, settings, width, height });
  }

  /** Run warmup ticks synchronously on worker. Falls back to main thread. */
  warmup(
    nodes: SimNode[],
    edges: GraphEdge[],
    settings: GraphSettings,
    width: number,
    height: number,
    ticks: number,
    onDone: (nodes: SimNode[]) => void
  ): void {
    if (!this.worker || !this.ready) {
      for (let i = 0; i < ticks; i++) tickForces(nodes, edges, settings, width, height);
      onDone(nodes);
      return;
    }
    this.pending = onDone;
    this.worker.postMessage({ type: 'warmup', nodes, edges, settings, width, height, ticks });
  }

  terminate(): void {
    this.worker?.terminate();
    this.worker = null;
  }
}
