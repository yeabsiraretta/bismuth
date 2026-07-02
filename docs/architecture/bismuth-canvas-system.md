# Bismuth Canvas: Design-to-Code System Architecture

**Type**: Architecture  
**Created**: 2026-05-26  
**Status**: Design Proposal  
**Related**: MCP Integration, Visual Design System

---

## Vision

**Bismuth Canvas** transforms Bismuth into a dual-purpose tool:

1. **PKM Editor** for knowledge management (existing)
2. **Visual Design Tool** for UI component design (new)

Users can design UI components on a canvas (Figma-like), and expose these designs via MCP for AI-powered code generation - all within the same tool they use for documentation.

---

## Core Concept

### The Problem

- Designers use Figma, developers use IDEs
- Context switching between design and code
- Design systems documented separately from implementation
- No single source of truth for component design + documentation

### The Solution

**Bismuth becomes the single source of truth**:

- Design components on canvas
- Document components in markdown
- Generate code via MCP
- Version control everything (Git-based)

---

## System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────┐
│                    Bismuth Application                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Markdown   │  │    Canvas    │  │     MCP      │ │
│  │    Editor    │  │    Editor    │  │    Server    │ │
│  │   (Existing) │  │     (New)    │  │     (New)    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                  │                  │         │
│         └──────────────────┴──────────────────┘         │
│                            │                            │
│                   ┌────────▼────────┐                   │
│                   │  Unified Store  │                   │
│                   │  (Svelte Store) │                   │
│                   └────────┬────────┘                   │
│                            │                            │
│         ┌──────────────────┴──────────────────┐         │
│         │                                     │         │
│  ┌──────▼──────┐                    ┌────────▼──────┐  │
│  │   Vault     │                    │   Canvas DB   │  │
│  │   Service   │                    │   (SQLite)    │  │
│  │  (Markdown) │                    │   (Designs)   │  │
│  └─────────────┘                    └───────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/SSE
                            │
                   ┌────────▼────────┐
                   │   MCP Clients   │
                   │  (Claude, etc.) │
                   └─────────────────┘
```

---

## Canvas Editor Design

### Technology Stack

**Rendering Engine**: Konva.js (Canvas-based, high performance)

- Same library we're using for graph view
- Supports layers, groups, transformations
- Event handling for interactions
- Export to SVG/PNG

**Alternative**: Fabric.js (more Figma-like)

- Rich object model
- Built-in controls (resize, rotate)
- SVG import/export
- Better for design tools

**Recommendation**: **Fabric.js** for Canvas Editor

### Canvas Data Model

```rust
// src-tauri/src/models/canvas.rs

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// A canvas design file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CanvasDocument {
    pub id: String,
    pub name: String,
    pub width: f64,
    pub height: f64,
    pub background: String,
    pub pages: Vec<Page>,
    pub variables: HashMap<String, Variable>,
    pub components: HashMap<String, Component>,
    pub created_at: DateTime<Utc>,
    pub modified_at: DateTime<Utc>,
}

/// A page within a canvas document
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Page {
    pub id: String,
    pub name: String,
    pub frames: Vec<Frame>,
}

/// A frame (artboard) on the canvas
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Frame {
    pub id: String,
    pub name: String,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub background: Option<String>,
    pub children: Vec<Node>,
}

/// A node in the design tree
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Node {
    Frame(FrameNode),
    Rectangle(RectangleNode),
    Text(TextNode),
    Image(ImageNode),
    Component(ComponentInstance),
    Group(GroupNode),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameNode {
    pub id: String,
    pub name: String,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub layout: Layout,
    pub fills: Vec<Fill>,
    pub strokes: Vec<Stroke>,
    pub effects: Vec<Effect>,
    pub children: Vec<Node>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Layout {
    pub mode: LayoutMode,
    pub direction: Direction,
    pub gap: f64,
    pub padding: Padding,
    pub align_items: Alignment,
    pub justify_content: Justification,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LayoutMode {
    None,
    AutoLayout,
    Grid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextNode {
    pub id: String,
    pub name: String,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub content: String,
    pub font_family: String,
    pub font_size: f64,
    pub font_weight: u16,
    pub line_height: f64,
    pub letter_spacing: f64,
    pub color: String,
    pub text_align: TextAlign,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Variable {
    pub id: String,
    pub name: String,
    pub value_type: VariableType,
    pub value: String,
    pub scope: Vec<String>, // color, spacing, typography, etc.
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VariableType {
    Color,
    Number,
    String,
    Boolean,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentDefinition {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub elements: Vec<serde_json::Value>,
    pub exposed_props: Vec<ComponentProp>,
    pub width: f64,
    pub height: f64,
    pub thumbnail: Option<String>,
    pub tags: Option<Vec<String>>,
    pub created_at: i64,
    pub modified_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentProp {
    pub key: String,
    pub label: String,
    pub prop_type: String,
    pub default_value: serde_json::Value,
}
```

### Database Schema

```sql
-- Canvas documents
CREATE TABLE canvas_documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  width REAL NOT NULL,
  height REAL NOT NULL,
  background TEXT,
  created_at TIMESTAMP NOT NULL,
  modified_at TIMESTAMP NOT NULL
);

-- Pages
CREATE TABLE canvas_pages (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  FOREIGN KEY (document_id) REFERENCES canvas_documents(id) ON DELETE CASCADE
);

-- Frames (artboards)
CREATE TABLE canvas_frames (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,
  name TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  width REAL NOT NULL,
  height REAL NOT NULL,
  background TEXT,
  FOREIGN KEY (page_id) REFERENCES canvas_pages(id) ON DELETE CASCADE
);

-- Nodes (design tree)
CREATE TABLE canvas_nodes (
  id TEXT PRIMARY KEY,
  parent_id TEXT,
  frame_id TEXT NOT NULL,
  node_type TEXT NOT NULL, -- 'frame', 'rectangle', 'text', 'image', 'component', 'group'
  name TEXT NOT NULL,
  properties JSON NOT NULL, -- All node-specific properties
  order_index INTEGER NOT NULL,
  FOREIGN KEY (frame_id) REFERENCES canvas_frames(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES canvas_nodes(id) ON DELETE CASCADE
);

-- Design variables
CREATE TABLE canvas_variables (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  name TEXT NOT NULL,
  value_type TEXT NOT NULL, -- 'color', 'number', 'string', 'boolean'
  value TEXT NOT NULL,
  scope TEXT, -- JSON array of scopes
  FOREIGN KEY (document_id) REFERENCES canvas_documents(id) ON DELETE CASCADE
);

-- Components
CREATE TABLE canvas_components (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  definition JSON NOT NULL, -- Component structure
  code_connect JSON, -- Code Connect configuration
  FOREIGN KEY (document_id) REFERENCES canvas_documents(id) ON DELETE CASCADE
);

-- Component instances (references)
CREATE TABLE canvas_component_instances (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL,
  component_id TEXT NOT NULL,
  overrides JSON, -- Property overrides
  FOREIGN KEY (node_id) REFERENCES canvas_nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (component_id) REFERENCES canvas_components(id)
);

-- Assets (images, icons)
CREATE TABLE canvas_assets (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL, -- 'image', 'svg', 'icon'
  data BLOB NOT NULL, -- Binary data or SVG string
  mime_type TEXT NOT NULL,
  FOREIGN KEY (document_id) REFERENCES canvas_documents(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_canvas_pages_document ON canvas_pages(document_id);
CREATE INDEX idx_canvas_frames_page ON canvas_frames(page_id);
CREATE INDEX idx_canvas_nodes_frame ON canvas_nodes(frame_id);
CREATE INDEX idx_canvas_nodes_parent ON canvas_nodes(parent_id);
CREATE INDEX idx_canvas_variables_document ON canvas_variables(document_id);
CREATE INDEX idx_canvas_components_document ON canvas_components(document_id);
```

---

## MCP Server Implementation

### MCP Tools

```rust
// src-tauri/src/mcp/canvas_tools.rs

/// MCP tool: Get design context from a canvas frame
pub async fn get_design_context(frame_url: String) -> Result<DesignContext, Error> {
    // Parse URL to extract document_id and frame_id
    let (doc_id, frame_id) = parse_canvas_url(&frame_url)?;

    // Fetch frame from database
    let frame = db.get_frame(&doc_id, &frame_id).await?;

    // Convert to React + Tailwind representation
    let design_context = DesignContext {
        frame_name: frame.name,
        width: frame.width,
        height: frame.height,
        jsx: generate_jsx(&frame)?,
        tailwind_classes: extract_tailwind_classes(&frame)?,
        variables: get_frame_variables(&frame)?,
        components: get_frame_components(&frame)?,
        assets: get_frame_assets(&frame)?,
    };

    Ok(design_context)
}

/// MCP tool: Get variable definitions
pub async fn get_variable_defs(frame_url: String) -> Result<Vec<Variable>, Error> {
    let (doc_id, _) = parse_canvas_url(&frame_url)?;
    let variables = db.get_document_variables(&doc_id).await?;
    Ok(variables)
}

/// MCP tool: Get component definitions
pub async fn get_component_defs(frame_url: String) -> Result<Vec<Component>, Error> {
    let (doc_id, _) = parse_canvas_url(&frame_url)?;
    let components = db.get_document_components(&doc_id).await?;
    Ok(components)
}

/// MCP tool: Get screenshot
pub async fn get_screenshot(frame_url: String) -> Result<Vec<u8>, Error> {
    let (doc_id, frame_id) = parse_canvas_url(&frame_url)?;

    // Render frame to PNG using headless browser or canvas rendering
    let screenshot = render_frame_to_png(&doc_id, &frame_id).await?;

    Ok(screenshot)
}

/// MCP tool: Get metadata (node tree)
pub async fn get_metadata(frame_url: String) -> Result<NodeTree, Error> {
    let (doc_id, frame_id) = parse_canvas_url(&frame_url)?;
    let tree = db.get_node_tree(&doc_id, &frame_id).await?;
    Ok(tree)
}

/// MCP tool: Create frame (write to canvas)
pub async fn create_frame(
    document_id: String,
    page_id: String,
    frame_data: FrameData,
) -> Result<String, Error> {
    let frame_id = db.create_frame(&document_id, &page_id, frame_data).await?;
    Ok(frame_id)
}

/// MCP tool: Update frame
pub async fn update_frame(
    frame_url: String,
    updates: FrameUpdates,
) -> Result<(), Error> {
    let (doc_id, frame_id) = parse_canvas_url(&frame_url)?;
    db.update_frame(&doc_id, &frame_id, updates).await?;
    Ok(())
}

/// MCP tool: Create component
pub async fn create_component(
    document_id: String,
    component_data: ComponentData,
) -> Result<String, Error> {
    let component_id = db.create_component(&document_id, component_data).await?;
    Ok(component_id)
}
```

### MCP Server Configuration

```json
// .bismuth/mcp-server.json
{
  "name": "bismuth-canvas",
  "version": "1.0.0",
  "description": "Bismuth Canvas MCP Server for design-to-code workflows",
  "tools": [
    {
      "name": "get_design_context",
      "description": "Get structured React + Tailwind representation of a canvas frame",
      "inputSchema": {
        "type": "object",
        "properties": {
          "frame_url": {
            "type": "string",
            "description": "URL to the canvas frame (bismuth://canvas/{doc_id}/{frame_id})"
          }
        },
        "required": ["frame_url"]
      }
    },
    {
      "name": "get_variable_defs",
      "description": "Get design variables (colors, spacing, typography) used in the document",
      "inputSchema": {
        "type": "object",
        "properties": {
          "frame_url": {
            "type": "string",
            "description": "URL to any frame in the document"
          }
        },
        "required": ["frame_url"]
      }
    },
    {
      "name": "get_component_defs",
      "description": "Get component definitions with Code Connect mappings",
      "inputSchema": {
        "type": "object",
        "properties": {
          "frame_url": {
            "type": "string",
            "description": "URL to any frame in the document"
          }
        },
        "required": ["frame_url"]
      }
    },
    {
      "name": "get_screenshot",
      "description": "Get PNG screenshot of a canvas frame",
      "inputSchema": {
        "type": "object",
        "properties": {
          "frame_url": {
            "type": "string",
            "description": "URL to the canvas frame"
          }
        },
        "required": ["frame_url"]
      }
    },
    {
      "name": "create_frame",
      "description": "Create a new frame on the canvas",
      "inputSchema": {
        "type": "object",
        "properties": {
          "document_id": { "type": "string" },
          "page_id": { "type": "string" },
          "frame_data": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "width": { "type": "number" },
              "height": { "type": "number" },
              "x": { "type": "number" },
              "y": { "type": "number" }
            }
          }
        },
        "required": ["document_id", "page_id", "frame_data"]
      }
    }
  ],
  "resources": [
    {
      "uri": "bismuth://canvas/{doc_id}",
      "name": "Canvas Document",
      "description": "Access to a canvas document and all its pages/frames"
    }
  ]
}
```

### HTTP Server for MCP

```rust
// src-tauri/src/mcp/server.rs

use axum::{
    Router,
    routing::{get, post},
    Json,
    extract::{Path, State},
};
use tower_http::cors::CorsLayer;

pub struct McpServer {
    db: Arc<Database>,
    port: u16,
}

impl McpServer {
    pub async fn start(db: Arc<Database>, port: u16) -> Result<(), Error> {
        let app = Router::new()
            .route("/mcp", post(handle_mcp_request))
            .route("/assets/:asset_id", get(serve_asset))
            .route("/screenshot/:doc_id/:frame_id", get(serve_screenshot))
            .layer(CorsLayer::permissive())
            .with_state(db);

        let addr = SocketAddr::from(([127, 0, 0, 1], port));
        axum::Server::bind(&addr)
            .serve(app.into_make_service())
            .await?;

        Ok(())
    }
}

async fn handle_mcp_request(
    State(db): State<Arc<Database>>,
    Json(request): Json<McpRequest>,
) -> Json<McpResponse> {
    match request.method.as_str() {
        "tools/list" => list_tools().await,
        "tools/call" => call_tool(db, request.params).await,
        "resources/list" => list_resources().await,
        "resources/read" => read_resource(db, request.params).await,
        _ => error_response("Unknown method"),
    }
}

async fn serve_asset(
    State(db): State<Arc<Database>>,
    Path(asset_id): Path<String>,
) -> Result<Vec<u8>, StatusCode> {
    db.get_asset(&asset_id)
        .await
        .map_err(|_| StatusCode::NOT_FOUND)
}
```

---

## Canvas UI Components

### Main Canvas View

```svelte
<!-- src/lib/components/canvas/CanvasView.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { fabric } from 'fabric';
  import Toolbar from './Toolbar.svelte';
  import LayersPanel from './LayersPanel.svelte';
  import PropertiesPanel from './PropertiesPanel.svelte';
  import { canvasStore } from '$lib/stores/canvas';

  let canvasElement: HTMLCanvasElement;
  let fabricCanvas: fabric.Canvas;

  onMount(() => {
    fabricCanvas = new fabric.Canvas(canvasElement, {
      width: 1920,
      height: 1080,
      backgroundColor: '#f5f5f5',
    });

    // Load document from store
    canvasStore.loadDocument($canvasStore.activeDocumentId);

    // Render frames
    renderFrames(fabricCanvas, $canvasStore.activeDocument);

    // Event listeners
    fabricCanvas.on('selection:created', handleSelection);
    fabricCanvas.on('object:modified', handleModification);
  });
</script>

<div class="canvas-container">
  <Toolbar {fabricCanvas} />

  <div class="canvas-workspace">
    <LayersPanel />

    <div class="canvas-viewport">
      <canvas bind:this={canvasElement}></canvas>
    </div>

    <PropertiesPanel />
  </div>
</div>

<style>
  .canvas-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .canvas-workspace {
    display: grid;
    grid-template-columns: 250px 1fr 300px;
    flex: 1;
    overflow: hidden;
  }

  .canvas-viewport {
    position: relative;
    overflow: auto;
    background: #2a2a2a;
  }
</style>
```

### Toolbar Component

```svelte
<!-- src/lib/components/canvas/Toolbar.svelte -->
<script lang="ts">
  import { canvasStore } from '$lib/stores/canvas';

  export let fabricCanvas: fabric.Canvas;

  function addFrame() {
    const frame = new fabric.Rect({
      left: 100,
      top: 100,
      width: 375,
      height: 812,
      fill: 'white',
      stroke: '#e0e0e0',
      strokeWidth: 1,
    });

    fabricCanvas.add(frame);
    canvasStore.addFrame(frame);
  }

  function addText() {
    const text = new fabric.IText('Text', {
      left: 200,
      top: 200,
      fontFamily: 'Inter',
      fontSize: 16,
    });

    fabricCanvas.add(text);
  }

  function addRectangle() {
    const rect = new fabric.Rect({
      left: 200,
      top: 200,
      width: 100,
      height: 100,
      fill: '#3b82f6',
    });

    fabricCanvas.add(rect);
  }
</script>

<div class="toolbar">
  <button on:click={addFrame} title="Add Frame">
    <svg><!-- Frame icon --></svg>
  </button>

  <button on:click={addRectangle} title="Add Rectangle">
    <svg><!-- Rectangle icon --></svg>
  </button>

  <button on:click={addText} title="Add Text">
    <svg><!-- Text icon --></svg>
  </button>

  <div class="divider"></div>

  <button title="Auto Layout">
    <svg><!-- Auto layout icon --></svg>
  </button>

  <button title="Variables">
    <svg><!-- Variables icon --></svg>
  </button>

  <button title="Components">
    <svg><!-- Components icon --></svg>
  </button>
</div>
```

---

## Code Generation Pipeline

### Design → Code Flow

```
1. User designs component in Canvas
   ↓
2. User copies canvas frame URL
   ↓
3. User prompts AI: "Implement this design: bismuth://canvas/doc123/frame456"
   ↓
4. AI calls get_design_context(frame_url)
   ↓
5. Bismuth MCP returns:
   - JSX structure
   - Tailwind classes
   - Variables used
   - Components referenced
   - Assets (images, icons)
   ↓
6. AI generates code using:
   - Project's component library (via Code Connect)
   - Design tokens from variables
   - Assets from localhost URLs
   ↓
7. AI writes code to project files
```

### JSX Generation Example

```rust
// src-tauri/src/canvas/codegen.rs

pub fn generate_jsx(frame: &Frame) -> Result<String, Error> {
    let mut jsx = String::new();

    jsx.push_str(&format!("<div className=\"{}\">\n", generate_frame_classes(frame)));

    for child in &frame.children {
        jsx.push_str(&generate_node_jsx(child, 1)?);
    }

    jsx.push_str("</div>");

    Ok(jsx)
}

fn generate_node_jsx(node: &Node, indent: usize) -> Result<String, Error> {
    let indent_str = "  ".repeat(indent);

    match node {
        Node::Text(text) => {
            Ok(format!(
                "{}<span className=\"{}\">{}</span>\n",
                indent_str,
                generate_text_classes(text),
                text.content
            ))
        }
        Node::Rectangle(rect) => {
            Ok(format!(
                "{}<div className=\"{}\"></div>\n",
                indent_str,
                generate_rect_classes(rect)
            ))
        }
        Node::Component(component) => {
            Ok(format!(
                "{}<{} {} />\n",
                indent_str,
                component.component_name,
                generate_props(component)
            ))
        }
        Node::Frame(frame) => {
            let mut jsx = format!("{}<div className=\"{}\">\n", indent_str, generate_frame_classes(frame));
            for child in &frame.children {
                jsx.push_str(&generate_node_jsx(child, indent + 1)?);
            }
            jsx.push_str(&format!("{}</div>\n", indent_str));
            Ok(jsx)
        }
        _ => Ok(String::new()),
    }
}

fn generate_frame_classes(frame: &FrameNode) -> String {
    let mut classes = vec![];

    // Layout
    if frame.layout.mode == LayoutMode::AutoLayout {
        classes.push("flex");

        match frame.layout.direction {
            Direction::Horizontal => classes.push("flex-row"),
            Direction::Vertical => classes.push("flex-col"),
        }

        // Gap
        if frame.layout.gap > 0.0 {
            classes.push(&format!("gap-{}", px_to_tailwind(frame.layout.gap)));
        }

        // Padding
        if frame.layout.padding.top > 0.0 {
            classes.push(&format!("pt-{}", px_to_tailwind(frame.layout.padding.top)));
        }
        // ... other padding sides
    }

    // Background
    if let Some(fill) = frame.fills.first() {
        if let Fill::Solid(color) = fill {
            if let Some(var_name) = get_variable_for_color(color) {
                classes.push(&format!("bg-{}", var_name));
            } else {
                classes.push(&format!("bg-[{}]", color));
            }
        }
    }

    // Border radius
    if frame.corner_radius > 0.0 {
        classes.push(&format!("rounded-{}", px_to_tailwind(frame.corner_radius)));
    }

    classes.join(" ")
}
```

---

## Integration with Existing Bismuth

### Unified Note + Canvas Files

```markdown
## <!-- example.canvas.md -->

type: canvas
canvas_id: doc123
frame_id: frame456

---

# Button Component

This is our primary button component used throughout the app.

## Design

[View in Canvas](bismuth://canvas/doc123/frame456)

## Variants

- Primary (default)
- Secondary
- Outline
- Ghost

## Usage

\`\`\`tsx
import { Button } from '@/components/ui/button';

<Button variant="primary">Click me</Button>
\`\`\`

## Code Connect

\`\`\`json
{
"component": "Button",
"path": "src/components/ui/button.tsx",
"props": {
"variant": "variant",
"size": "size",
"disabled": "disabled"
}
}
\`\`\`
```

### Canvas Link in Markdown

```markdown
<!-- Regular note with embedded canvas -->

# Dashboard Design

Here's the dashboard layout:

![Dashboard](bismuth://canvas/doc123/frame789)

The layout uses a 12-column grid with...
```

### Bidirectional Linking

- Canvas frames can reference markdown notes (documentation)
- Markdown notes can embed canvas frames (designs)
- Both stored in same vault, version controlled together

---

## Shell Script Access (Dev Mode)

### CLI Tool for Canvas Access

```bash
#!/bin/bash
# bismuth-canvas-cli

# Get design context
bismuth canvas get-context "bismuth://canvas/doc123/frame456" > design.json

# Get variables
bismuth canvas get-variables "bismuth://canvas/doc123" > variables.json

# Get screenshot
bismuth canvas screenshot "bismuth://canvas/doc123/frame456" > frame.png

# Export to Figma format
bismuth canvas export-figma "bismuth://canvas/doc123" > design.fig

# Generate code
bismuth canvas generate-code "bismuth://canvas/doc123/frame456" --framework react --output ./components
```

### Rust CLI Implementation

```rust
// src-tauri/src/cli/canvas.rs

use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "bismuth-canvas")]
#[command(about = "Bismuth Canvas CLI for design access")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Get design context as JSON
    GetContext {
        /// Canvas frame URL
        url: String,
    },
    /// Get design variables
    GetVariables {
        /// Canvas document URL
        url: String,
    },
    /// Get screenshot
    Screenshot {
        /// Canvas frame URL
        url: String,
        /// Output file path
        #[arg(short, long)]
        output: Option<String>,
    },
    /// Generate code
    GenerateCode {
        /// Canvas frame URL
        url: String,
        /// Framework (react, vue, svelte)
        #[arg(short, long, default_value = "react")]
        framework: String,
        /// Output directory
        #[arg(short, long)]
        output: String,
    },
}

pub async fn run_cli() -> Result<(), Error> {
    let cli = Cli::parse();

    match cli.command {
        Commands::GetContext { url } => {
            let context = get_design_context(url).await?;
            println!("{}", serde_json::to_string_pretty(&context)?);
        }
        Commands::GetVariables { url } => {
            let variables = get_variable_defs(url).await?;
            println!("{}", serde_json::to_string_pretty(&variables)?);
        }
        Commands::Screenshot { url, output } => {
            let screenshot = get_screenshot(url).await?;
            if let Some(path) = output {
                std::fs::write(path, screenshot)?;
            } else {
                std::io::stdout().write_all(&screenshot)?;
            }
        }
        Commands::GenerateCode { url, framework, output } => {
            let context = get_design_context(url).await?;
            let code = generate_code_for_framework(&context, &framework)?;
            std::fs::create_dir_all(&output)?;
            std::fs::write(format!("{}/component.tsx", output), code)?;
        }
    }

    Ok(())
}
```

---

## Implementation Phases

### Phase 1: Canvas Foundation (4-6 weeks)

- ✅ Canvas data models (Rust)
- ✅ SQLite schema for canvas storage
- ✅ Basic Fabric.js canvas editor
- ✅ Frame creation and manipulation
- ✅ Rectangle, text, image nodes
- ✅ Layer panel
- ✅ Properties panel

### Phase 2: Design System (3-4 weeks)

- ✅ Variables system (colors, spacing, typography)
- ✅ Component creation and instances
- ✅ Auto layout (flexbox-like)
- ✅ Constraints and responsive behavior
- ✅ Asset management (images, icons)

### Phase 3: MCP Integration (2-3 weeks)

- ✅ MCP server implementation
- ✅ `get_design_context` tool
- ✅ `get_variable_defs` tool
- ✅ `get_screenshot` tool
- ✅ Asset serving endpoint
- ✅ HTTP server with CORS

### Phase 4: Code Generation (3-4 weeks)

- ✅ JSX generation from canvas
- ✅ Tailwind class generation
- ✅ Variable mapping
- ✅ Component Code Connect
- ✅ Framework adapters (React, Vue, Svelte)

### Phase 5: Advanced Features (4-6 weeks)

- ✅ Write to canvas (create/update frames)
- ✅ Component variants
- ✅ Interactive prototyping
- ✅ Design tokens export
- ✅ Figma import/export
- ✅ CLI tool for shell script access

### Phase 6: Integration & Polish (2-3 weeks)

- ✅ Unified note + canvas files
- ✅ Bidirectional linking
- ✅ Version control (Git integration)
- ✅ Collaboration features
- ✅ Performance optimization

**Total**: 18-26 weeks (4.5-6.5 months)

---

## Benefits

### For Designers

- Design and document in one tool
- Version control for designs (Git)
- No context switching
- Design system lives with code

### For Developers

- AI-powered code generation from designs
- Design tokens automatically synced
- Component library integration
- Shell script access for automation

### For Teams

- Single source of truth
- Design + docs + code in one repo
- Better collaboration
- Faster iteration

---

## Technical Challenges

### 1. Canvas Rendering Performance

**Challenge**: Large documents with many nodes
**Solution**:

- Virtual rendering (only visible nodes)
- Canvas chunking
- Web Workers for heavy operations

### 2. MCP Rate Limiting

**Challenge**: Figma-style rate limits
**Solution**:

- Caching layer
- Request batching
- Local-first (no external API calls)

### 3. Code Generation Quality

**Challenge**: Generated code must match project conventions
**Solution**:

- Code Connect for component mapping
- Project-specific rules
- AI learns from existing codebase

### 4. Design System Sync

**Challenge**: Keeping variables in sync with code
**Solution**:

- Bidirectional sync
- Design tokens export
- Git hooks for validation

---

## References

- Figma MCP Server: https://github.com/figma/mcp-server-guide
- Fabric.js: http://fabricjs.com/
- MCP Protocol: https://modelcontextprotocol.io/
- Code Connect: https://help.figma.com/hc/en-us/articles/32132100833559

---

**Next Steps**:

1. Prototype canvas editor with Fabric.js
2. Implement basic data models
3. Build MCP server skeleton
4. Test with Claude/Cursor integration

---

**Last Updated**: 2026-05-26
