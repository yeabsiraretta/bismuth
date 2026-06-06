# Data Model: Canvas Component System

## Entities

### ComponentDefinition (evolved)

Represents a reusable composite of canvas elements saved to the vault library.

| Field | Type | Description |
|-------|------|-------------|
| id | string | UUID |
| name | string | User-assigned name |
| description | string? | Optional description |
| category | string? | Library category (e.g., "Buttons", "Cards") |
| tags | string[] | Searchable tags |
| elements | CanvasElement[] | The master element tree |
| exposedProps | ComponentProp[] | Props instances can override |
| width | number | Bounding width |
| height | number | Bounding height |
| thumbnail | string? | Base64 PNG preview (small) |
| created_at | number | Unix epoch |
| modified_at | number | Unix epoch |

**Removed fields** (from legacy):
- `codeConnect` — MCP artifact
- `variantProperties` — variant system artifact

### ComponentInstance

An element on the canvas that references a definition. Stored as a `CanvasElement` with `element_type: 'component_instance'`.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Element UUID |
| element_type | 'component_instance' | Discriminator |
| definitionId | string | Reference to ComponentDefinition.id |
| overrides | Record<string, unknown> | Per-instance prop overrides keyed by ComponentProp.key |
| x, y | number | Position on canvas |
| width, height | number | Size (may differ from definition if resized) |
| rotation | number | Instance rotation |
| locked | boolean | Lock state |
| visible | boolean | Visibility |

### ComponentManifest

Index file for fast library browsing without loading all definitions.

| Field | Type | Description |
|-------|------|-------------|
| version | number | Schema version |
| components | ManifestEntry[] | Indexed entries |

**ManifestEntry**:

| Field | Type | Description |
|-------|------|-------------|
| id | string | Definition ID |
| name | string | Display name |
| category | string? | Category |
| tags | string[] | Tags |
| thumbnail | string? | Base64 preview |
| modified_at | number | Last modified |

### FlowLink

A navigational connection between frames in the canvas document.

| Field | Type | Description |
|-------|------|-------------|
| id | string | UUID |
| fromFrameId | string | Source frame element ID |
| toFrameId | string | Target frame element ID |
| hotspotElementId | string? | Click target within source frame |
| transition | FlowTransition | Animation/transition type |
| label | string? | Optional edge label |

### FlowTransition

| Field | Type | Description |
|-------|------|-------------|
| type | 'instant' \| 'dissolve' \| 'slide-left' \| 'slide-right' \| 'slide-up' \| 'slide-down' | Transition style |
| duration | number | Duration in ms (0 = instant) |

## Relationships

```text
ComponentDefinition 1──────∞ ComponentInstance (via definitionId)
CanvasDocument 1──────∞ FlowLink (document-level edges)
FlowLink ──────→ Frame element (fromFrameId)
FlowLink ──────→ Frame element (toFrameId)
FlowLink ──────→ Element (hotspotElementId, optional)
```

## State Transitions

### Component Lifecycle

```text
[Elements Selected] → "Create Component" → [Definition Created + Instance Placed]
[Definition] → "Edit Component" → [Editing Mode] → "Done" → [Instances Updated]
[Definition] → "Delete Component" → [Instances Detached (become plain groups)]
```

### Instance State

```text
[Linked] ─── override prop ───→ [Linked + Overrides]
[Linked] ─── definition deleted ───→ [Detached (plain group)]
[Linked] ─── "Detach Instance" ───→ [Detached (plain group)]
```

### Preview Mode

```text
[Edit Mode] → Enter Preview → [Preview: show first frame]
[Preview: Frame N] → Click hotspot → [Preview: Frame M] (via FlowLink)
[Preview] → Escape → [Edit Mode]
```

## Validation Rules

- `ComponentDefinition.elements` must contain at least 1 element
- `ComponentDefinition.name` must be non-empty and unique within vault
- `ComponentInstance.definitionId` must reference an existing definition (or instance becomes detached)
- `FlowLink.fromFrameId` and `toFrameId` must reference elements with `element_type: 'frame'`
- `FlowLink.hotspotElementId` (if set) must be a child element within the source frame
- `FlowTransition.duration` must be >= 0
- `ComponentManifest.version` must be 1 (current schema)

## Storage Layout

```text
.bismuth/
└── components/
    ├── manifest.json           # ComponentManifest
    ├── {uuid-1}.json           # ComponentDefinition
    ├── {uuid-2}.json           # ComponentDefinition
    └── ...
```

Canvas documents store `FlowLink[]` at the document level (new field on `CanvasDocument`).
