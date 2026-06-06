# Quickstart: Canvas Component System

## Prerequisites

- Bismuth development environment set up (Tauri + Svelte)
- An existing vault with at least one canvas document

## Creating a Component

1. Open a canvas document
2. Draw or arrange elements (rectangles, text, frames, etc.)
3. Select multiple elements (Shift+click or drag-select)
4. Right-click → "Create Component" (or `Cmd+Shift+K`)
5. Enter a name and optional category
6. The selection becomes a component instance linked to the new definition

## Using the Component Library

1. Open the Components panel in the canvas sidebar (tab icon: puzzle piece)
2. Browse by category or search by name
3. Drag a component from the panel onto the canvas
4. The placed element is an instance — edit it to override exposed props

## Editing a Component Definition

1. Double-click any instance on the canvas
2. You enter "Component Edit Mode" (highlighted border, breadcrumb shows component name)
3. Make changes to the element tree
4. Press Escape or click "Done" to exit
5. All instances of that component update to reflect your changes

## Building a Flow

1. Create multiple frames on the canvas (each frame = one "screen")
2. Select the Flow Link tool (shortcut: `F`)
3. Click a hotspot element in Frame A, then click Frame B
4. A flow arrow appears connecting the frames
5. Repeat to build your navigation graph

## Previewing a Flow

1. Press `Cmd+Enter` or click the Play button in the toolbar
2. The first frame fills the viewport (preview mode)
3. Click on hotspot elements to navigate between frames
4. Press Escape to exit preview mode

## Per-Instance Overrides

- Select a component instance
- In the Properties panel, exposed props appear (e.g., "Button Label", "Icon Color")
- Change values — these are instance overrides that survive definition updates
- To reset an override: right-click the prop → "Reset to Default"

## Detaching an Instance

- Right-click an instance → "Detach Instance"
- The instance becomes a plain group of elements
- It no longer receives updates from the component definition
