<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import { OrbitControls } from '@threlte/extras';
  import type { GraphEdge, GraphNode } from '@/hubs/knowledge/services/graph-builder';
  import {
    type GraphPhysics,
    DEFAULT_PHYSICS,
    simulateStep3D,
  } from '@/hubs/knowledge/services/graph-simulation';
  import * as THREE from 'three';
  import { GRAPH_COLORS } from '@/constants/colors';
  import { openNote } from '@/ui/panel-actions';

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

  let hoveredNodeId: string | null = $state(null);

  let effectivePhysics = $derived(physics ?? DEFAULT_PHYSICS);
  let effectiveNodeColor = $derived(nodeColor || GRAPH_COLORS.node);
  let effectiveEdgeColor = $derived(edgeColor || GRAPH_COLORS.edge);
  let effectiveEdgeOpacity = $derived(edgeOpacity ?? 0.4);
  let effectiveNodeRadius = $derived(nodeRadius ?? 2);

  let nodeGeometry = $derived(new THREE.SphereGeometry(effectiveNodeRadius * 0.4, 16, 16));
  let nodeMaterial = $derived(new THREE.MeshStandardMaterial({ color: effectiveNodeColor }));
  let hoverMaterial = $derived(
    new THREE.MeshStandardMaterial({
      color: GRAPH_COLORS.nodeHover,
      emissive: GRAPH_COLORS.nodeHover,
      emissiveIntensity: 0.3,
    })
  );

  function buildEdgeGeometry(n: GraphNode[], e: GraphEdge[]): THREE.BufferGeometry {
    const positions: number[] = [];
    for (const edge of e) {
      const a = n.find((nd) => nd.id === edge.source);
      const b = n.find((nd) => nd.id === edge.target);
      if (!a || !b) continue;
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }

  let edgeGeometry = $state(new THREE.BufferGeometry());

  useTask(() => {
    simulateStep3D(nodes, edges, null, effectivePhysics);
    const next = buildEdgeGeometry(nodes, edges);
    edgeGeometry.dispose();
    edgeGeometry = next;
  });

  function handleNodeClick(nodeId: string) {
    openNote(nodeId);
  }
</script>

<T.PerspectiveCamera makeDefault position={[0, 0, 300]} fov={60} />
<OrbitControls enableDamping dampingFactor={0.1} />

<T.AmbientLight intensity={0.6} />
<T.DirectionalLight position={[100, 200, 150]} intensity={0.8} />
<T.DirectionalLight position={[-100, -50, -100]} intensity={0.3} />

{#each nodes as node (node.id)}
  <T.Mesh
    position={[node.x, node.y, node.z]}
    geometry={nodeGeometry}
    material={hoveredNodeId === node.id ? hoverMaterial : nodeMaterial}
    scale={hoveredNodeId === node.id ? [1.5, 1.5, 1.5] : [1, 1, 1]}
    onpointerenter={() => {
      hoveredNodeId = node.id;
    }}
    onpointerleave={() => {
      if (hoveredNodeId === node.id) hoveredNodeId = null;
    }}
    onclick={() => handleNodeClick(node.id)}
  />
{/each}

<T.LineSegments geometry={edgeGeometry}>
  <T.LineBasicMaterial color={effectiveEdgeColor} transparent opacity={effectiveEdgeOpacity} />
</T.LineSegments>
