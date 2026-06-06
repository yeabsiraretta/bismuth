# Store API: Component Library

## Module: `stores/canvas/componentLibrary.ts`

### Stores

```typescript
/** All component definitions loaded from the vault library. */
export const componentLibrary: Writable<ComponentDefinition[]>;

/** Filtered view based on search/category. */
export const filteredComponents: Readable<ComponentDefinition[]>;

/** Current search query in the component browser. */
export const componentSearch: Writable<string>;

/** Active category filter (null = all). */
export const componentCategoryFilter: Writable<string | null>;
```

### Actions

```typescript
/** Load all components from vault into store. */
export async function loadLibrary(vaultPath: string): Promise<void>;

/** Create a component from selected canvas elements. */
export async function createComponentFromSelection(
  name: string,
  elementIds: string[]
): Promise<ComponentDefinition>;

/** Update a component definition (propagates to all instances). */
export async function updateComponentDefinition(
  component: ComponentDefinition
): Promise<void>;

/** Delete a component. Instances become detached groups. */
export async function deleteComponent(componentId: string): Promise<void>;

/** Instantiate a component on the canvas at the given position. */
export function placeComponentInstance(
  definitionId: string,
  x: number,
  y: number
): void;

/** Resolve a component instance to its rendered element tree. */
export function resolveInstance(
  instance: ComponentInstance,
  library: ComponentDefinition[]
): CanvasElement[];

/** Detach an instance (convert to plain group, break definition link). */
export function detachInstance(instanceId: string): void;
```

## Module: `utils/canvas/flowGraph.ts`

### Functions

```typescript
/** Build a directed graph of frames connected by flow links. */
export function buildFlowGraph(
  links: FlowLink[],
  frames: CanvasElement[]
): FlowGraph;

/** Get the next frame given a click on a hotspot element. */
export function resolveFlowTarget(
  currentFrameId: string,
  clickedElementId: string,
  links: FlowLink[]
): string | null;

/** Get all frames reachable from a starting frame. */
export function getReachableFrames(
  startFrameId: string,
  graph: FlowGraph
): string[];
```
