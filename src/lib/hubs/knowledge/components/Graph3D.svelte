<script lang="ts">
  import { Canvas } from '@threlte/core';
  import Graph3DScene from '@/hubs/knowledge/components/Graph3DScene.svelte';
  import type { GraphNode, GraphEdge } from '@/hubs/knowledge/services/graph-builder';
  import type { GraphPhysics } from '@/hubs/knowledge/services/graph-simulation';

  interface Props {
    nodes: GraphNode[];
    edges: GraphEdge[];
    physics?: GraphPhysics;
    nodeColor?: string;
    edgeColor?: string;
    edgeOpacity?: number;
    nodeRadius?: number;
  }

  let { nodes, edges, physics, nodeColor, edgeColor, edgeOpacity, nodeRadius }: Props = $props();
</script>

<div class="graph3d-wrap">
  <Canvas>
    <Graph3DScene {nodes} {edges} {physics} {nodeColor} {edgeColor} {edgeOpacity} {nodeRadius} />
  </Canvas>
</div>

<style>
  .graph3d-wrap {
    width: 100%;
    height: 100%;
  }
</style>
