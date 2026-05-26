# Bismuth Canvas MCP Protocol Specification

**Type**: Architecture  
**Created**: 2026-05-26  
**Status**: Design Proposal  
**Related**: Bismuth Canvas System, MCP Integration

---

## Overview

This document specifies the MCP (Model Context Protocol) implementation for Bismuth Canvas, enabling AI agents to read and write design data for code generation workflows.

---

## Protocol Architecture

### Communication Flow

```
┌─────────────────┐         HTTP/SSE          ┌──────────────────┐
│   AI Agent      │ ◄────────────────────────► │  Bismuth MCP     │
│  (Claude, etc)  │                            │     Server       │
└─────────────────┘                            └──────────────────┘
                                                        │
                                                        │ IPC
                                                        ▼
                                               ┌──────────────────┐
                                               │  Bismuth Tauri   │
                                               │   Application    │
                                               └──────────────────┘
                                                        │
                                                        │
                                                        ▼
                                               ┌──────────────────┐
                                               │   SQLite DB      │
                                               │  (Canvas Data)   │
                                               └──────────────────┘
```

### URL Scheme

**Format**: `bismuth://canvas/{document_id}/{frame_id}?{params}`

**Examples**:

- `bismuth://canvas/doc_abc123/frame_xyz789` - Specific frame
- `bismuth://canvas/doc_abc123` - Entire document
- `bismuth://canvas/doc_abc123/frame_xyz789?variant=mobile` - Frame variant

---

## MCP Tools

### 1. get_design_context

**Purpose**: Get structured representation of a canvas frame for code generation

**Input**:

```json
{
  "name": "get_design_context",
  "arguments": {
    "frame_url": "bismuth://canvas/doc_abc123/frame_xyz789",
    "include_children": true,
    "max_depth": 10
  }
}
```

**Output**:

```json
{
  "frame": {
    "id": "frame_xyz789",
    "name": "Button Component",
    "type": "FRAME",
    "width": 200,
    "height": 48,
    "x": 0,
    "y": 0,
    "layout": {
      "mode": "AUTO_LAYOUT",
      "direction": "HORIZONTAL",
      "gap": 8,
      "padding": {
        "top": 12,
        "right": 24,
        "bottom": 12,
        "left": 24
      },
      "alignItems": "CENTER",
      "justifyContent": "CENTER"
    },
    "fills": [
      {
        "type": "SOLID",
        "color": {
          "r": 0.231,
          "g": 0.51,
          "b": 0.965,
          "a": 1.0
        },
        "variable": "colors/primary"
      }
    ],
    "cornerRadius": 8,
    "children": [
      {
        "id": "text_abc456",
        "name": "Label",
        "type": "TEXT",
        "content": "Click me",
        "fontSize": 16,
        "fontWeight": 600,
        "fontFamily": "Inter",
        "color": {
          "r": 1.0,
          "g": 1.0,
          "b": 1.0,
          "a": 1.0
        },
        "variable": "colors/white"
      }
    ]
  },
  "jsx": "<div className=\"flex flex-row items-center justify-center gap-2 px-6 py-3 bg-primary rounded-lg\">\n  <span className=\"text-base font-semibold text-white\">Click me</span>\n</div>",
  "tailwind": {
    "container": [
      "flex",
      "flex-row",
      "items-center",
      "justify-center",
      "gap-2",
      "px-6",
      "py-3",
      "bg-primary",
      "rounded-lg"
    ],
    "text": ["text-base", "font-semibold", "text-white"]
  },
  "variables": [
    {
      "name": "colors/primary",
      "value": "#3b82f6",
      "type": "COLOR"
    },
    {
      "name": "colors/white",
      "value": "#ffffff",
      "type": "COLOR"
    }
  ],
  "assets": []
}
```

**Rate Limit**: 30 requests/minute (local, no external API)

---

### 2. get_variable_defs

**Purpose**: Get all design variables (tokens) used in a document

**Input**:

```json
{
  "name": "get_variable_defs",
  "arguments": {
    "document_url": "bismuth://canvas/doc_abc123",
    "scope": ["color", "spacing", "typography"]
  }
}
```

**Output**:

```json
{
  "variables": [
    {
      "id": "var_color_primary",
      "name": "colors/primary",
      "type": "COLOR",
      "value": "#3b82f6",
      "scope": ["color"],
      "description": "Primary brand color"
    },
    {
      "id": "var_spacing_md",
      "name": "spacing/md",
      "type": "NUMBER",
      "value": 16,
      "scope": ["spacing"],
      "description": "Medium spacing (1rem)"
    },
    {
      "id": "var_font_body",
      "name": "typography/body",
      "type": "STRING",
      "value": "Inter",
      "scope": ["typography"],
      "description": "Body font family"
    }
  ],
  "collections": [
    {
      "name": "Colors",
      "variables": ["var_color_primary", "var_color_secondary", "..."]
    },
    {
      "name": "Spacing",
      "variables": ["var_spacing_xs", "var_spacing_sm", "..."]
    }
  ]
}
```

**Rate Limit**: 30 requests/minute

---

### 3. get_component_defs

**Purpose**: Get component definitions with Code Connect mappings

**Input**:

```json
{
  "name": "get_component_defs",
  "arguments": {
    "document_url": "bismuth://canvas/doc_abc123",
    "include_variants": true
  }
}
```

**Output**:

```json
{
  "components": [
    {
      "id": "comp_button_123",
      "name": "Button",
      "description": "Primary button component",
      "variants": [
        {
          "name": "Primary",
          "properties": {
            "variant": "primary",
            "size": "medium"
          }
        },
        {
          "name": "Secondary",
          "properties": {
            "variant": "secondary",
            "size": "medium"
          }
        }
      ],
      "properties": [
        {
          "name": "variant",
          "type": "VARIANT",
          "values": ["primary", "secondary", "outline", "ghost"]
        },
        {
          "name": "size",
          "type": "VARIANT",
          "values": ["small", "medium", "large"]
        },
        {
          "name": "disabled",
          "type": "BOOLEAN",
          "default": false
        }
      ],
      "codeConnect": {
        "component": "Button",
        "path": "src/components/ui/button.tsx",
        "import": "import { Button } from '@/components/ui/button';",
        "propsMapping": {
          "variant": "variant",
          "size": "size",
          "disabled": "disabled"
        },
        "example": "<Button variant=\"primary\" size=\"medium\">Click me</Button>"
      }
    }
  ]
}
```

**Rate Limit**: 30 requests/minute

---

### 4. get_screenshot

**Purpose**: Get PNG screenshot of a canvas frame

**Input**:

```json
{
  "name": "get_screenshot",
  "arguments": {
    "frame_url": "bismuth://canvas/doc_abc123/frame_xyz789",
    "scale": 2.0,
    "format": "png"
  }
}
```

**Output**:

```json
{
  "url": "http://localhost:3456/assets/screenshot_xyz789.png",
  "width": 400,
  "height": 96,
  "format": "png",
  "size": 12345
}
```

**Rate Limit**: 30 requests/minute

---

### 5. get_metadata

**Purpose**: Get high-level node tree without full details (for large documents)

**Input**:

```json
{
  "name": "get_metadata",
  "arguments": {
    "frame_url": "bismuth://canvas/doc_abc123/frame_xyz789"
  }
}
```

**Output**:

```json
{
  "document": {
    "id": "doc_abc123",
    "name": "Design System",
    "pages": [
      {
        "id": "page_001",
        "name": "Components",
        "frames": [
          {
            "id": "frame_xyz789",
            "name": "Button Component",
            "width": 200,
            "height": 48,
            "childCount": 3
          }
        ]
      }
    ]
  },
  "nodeTree": [
    {
      "id": "frame_xyz789",
      "name": "Button Component",
      "type": "FRAME",
      "children": [
        {
          "id": "text_abc456",
          "name": "Label",
          "type": "TEXT"
        }
      ]
    }
  ]
}
```

**Rate Limit**: 60 requests/minute (lightweight)

---

### 6. create_frame (Write Operation)

**Purpose**: Create a new frame on the canvas

**Input**:

```json
{
  "name": "create_frame",
  "arguments": {
    "document_id": "doc_abc123",
    "page_id": "page_001",
    "frame": {
      "name": "New Component",
      "x": 100,
      "y": 100,
      "width": 375,
      "height": 812,
      "background": "#ffffff",
      "layout": {
        "mode": "AUTO_LAYOUT",
        "direction": "VERTICAL",
        "gap": 16,
        "padding": {
          "top": 24,
          "right": 24,
          "bottom": 24,
          "left": 24
        }
      }
    }
  }
}
```

**Output**:

```json
{
  "frame_id": "frame_new123",
  "url": "bismuth://canvas/doc_abc123/frame_new123",
  "created_at": "2026-05-26T10:30:00Z"
}
```

**Rate Limit**: No limit (local operation)

---

### 7. update_frame (Write Operation)

**Purpose**: Update an existing frame

**Input**:

```json
{
  "name": "update_frame",
  "arguments": {
    "frame_url": "bismuth://canvas/doc_abc123/frame_xyz789",
    "updates": {
      "name": "Button Component (Updated)",
      "layout": {
        "gap": 12
      },
      "fills": [
        {
          "type": "SOLID",
          "color": "#10b981"
        }
      ]
    }
  }
}
```

**Output**:

```json
{
  "success": true,
  "frame_id": "frame_xyz789",
  "modified_at": "2026-05-26T10:35:00Z"
}
```

**Rate Limit**: No limit

---

### 8. create_component (Write Operation)

**Purpose**: Create a reusable component

**Input**:

```json
{
  "name": "create_component",
  "arguments": {
    "document_id": "doc_abc123",
    "component": {
      "name": "Card",
      "description": "Card component with header and content",
      "source_frame_id": "frame_xyz789",
      "properties": [
        {
          "name": "variant",
          "type": "VARIANT",
          "values": ["default", "outlined", "elevated"]
        }
      ],
      "codeConnect": {
        "component": "Card",
        "path": "src/components/ui/card.tsx",
        "import": "import { Card } from '@/components/ui/card';"
      }
    }
  }
}
```

**Output**:

```json
{
  "component_id": "comp_card_456",
  "created_at": "2026-05-26T10:40:00Z"
}
```

**Rate Limit**: No limit

---

### 9. add_node (Write Operation)

**Purpose**: Add a node (rectangle, text, image) to a frame

**Input**:

```json
{
  "name": "add_node",
  "arguments": {
    "frame_url": "bismuth://canvas/doc_abc123/frame_xyz789",
    "node": {
      "type": "TEXT",
      "name": "Description",
      "content": "This is a description",
      "x": 0,
      "y": 60,
      "fontSize": 14,
      "fontFamily": "Inter",
      "color": "#6b7280"
    }
  }
}
```

**Output**:

```json
{
  "node_id": "text_desc789",
  "created_at": "2026-05-26T10:45:00Z"
}
```

**Rate Limit**: No limit

---

## MCP Resources

### Resource: Canvas Document

**URI Pattern**: `bismuth://canvas/{document_id}`

**Description**: Access to entire canvas document

**Example**:

```json
{
  "uri": "bismuth://canvas/doc_abc123",
  "name": "Design System",
  "description": "Complete design system with components and variables",
  "mimeType": "application/json"
}
```

**Content**:

```json
{
  "document": {
    "id": "doc_abc123",
    "name": "Design System",
    "pages": [...],
    "variables": [...],
    "components": [...]
  }
}
```

---

## HTTP Endpoints

### Base URL

`http://localhost:3456` (configurable port)

### Endpoints

#### 1. POST /mcp

**Purpose**: Main MCP endpoint for tool calls

**Request**:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_design_context",
    "arguments": {
      "frame_url": "bismuth://canvas/doc_abc123/frame_xyz789"
    }
  }
}
```

**Response**:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"frame\": {...}}"
      }
    ]
  }
}
```

#### 2. GET /assets/{asset_id}

**Purpose**: Serve image and SVG assets

**Response**: Binary data (image/png, image/svg+xml)

**Example**: `http://localhost:3456/assets/icon_search_123.svg`

#### 3. GET /screenshot/{document_id}/{frame_id}

**Purpose**: Serve frame screenshots

**Query Params**:

- `scale`: Render scale (default: 2.0)
- `format`: png or jpg (default: png)

**Response**: Binary image data

**Example**: `http://localhost:3456/screenshot/doc_abc123/frame_xyz789?scale=2.0`

---

## Authentication

### Local-First Security

**No external authentication required** - MCP server runs locally and only accepts connections from localhost.

**Security Measures**:

1. **CORS**: Restricted to localhost origins
2. **Port binding**: Only bind to 127.0.0.1
3. **Token validation**: Optional API token for additional security
4. **Rate limiting**: Prevent abuse even from local processes

### Optional API Token

**Configuration** (`.bismuth/mcp-config.json`):

```json
{
  "mcp": {
    "enabled": true,
    "port": 3456,
    "require_token": false,
    "api_token": "bismuth_local_abc123xyz"
  }
}
```

**Usage**:

```bash
curl -H "Authorization: Bearer bismuth_local_abc123xyz" \
  http://localhost:3456/mcp
```

---

## Error Handling

### Error Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32600,
    "message": "Invalid frame URL",
    "data": {
      "url": "bismuth://canvas/invalid",
      "reason": "Document not found"
    }
  }
}
```

### Error Codes

| Code   | Message             | Description                   |
| ------ | ------------------- | ----------------------------- |
| -32600 | Invalid Request     | Malformed request             |
| -32601 | Method Not Found    | Unknown tool name             |
| -32602 | Invalid Params      | Missing or invalid arguments  |
| -32603 | Internal Error      | Server error                  |
| -32000 | Document Not Found  | Canvas document doesn't exist |
| -32001 | Frame Not Found     | Frame doesn't exist           |
| -32002 | Permission Denied   | No access to resource         |
| -32003 | Rate Limit Exceeded | Too many requests             |

---

## Rate Limiting

### Local Rate Limits

**Purpose**: Prevent accidental infinite loops or abuse

**Limits**:

- Read operations: 30 requests/minute per tool
- Write operations: No limit (local, safe)
- Metadata operations: 60 requests/minute (lightweight)

**Response Headers**:

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1716724800
```

**Rate Limit Error**:

```json
{
  "error": {
    "code": -32003,
    "message": "Rate limit exceeded",
    "data": {
      "limit": 30,
      "reset_at": "2026-05-26T10:50:00Z"
    }
  }
}
```

---

## Best Practices for AI Agents

### 1. Always Start with get_metadata

For large documents, get the node tree first to understand structure:

```
1. get_metadata(frame_url) → Get high-level structure
2. Identify relevant frames/nodes
3. get_design_context(specific_frame) → Get detailed data
```

### 2. Use get_screenshot for Visual Reference

Always fetch screenshot alongside design context:

```
1. get_design_context(frame_url) → Structure
2. get_screenshot(frame_url) → Visual reference
3. Compare both for accurate implementation
```

### 3. Fetch Variables Once

Variables don't change often, cache them:

```
1. get_variable_defs(document_url) → Cache for session
2. Use cached variables for all frames in document
```

### 4. Respect Component Code Connect

When components have Code Connect, use existing components:

```
1. get_component_defs(document_url)
2. Check if frame uses components
3. Use component imports instead of generating from scratch
```

### 5. Break Down Large Selections

Don't fetch entire pages at once:

```
❌ get_design_context(page_url) → Too large
✅ get_design_context(frame_url) → Manageable
```

---

## Example Workflows

### Workflow 1: Implement a Button Component

```
User: "Implement this button: bismuth://canvas/doc_abc123/frame_button"

Agent:
1. get_design_context("bismuth://canvas/doc_abc123/frame_button")
   → Returns JSX structure, Tailwind classes, variables

2. get_screenshot("bismuth://canvas/doc_abc123/frame_button")
   → Returns visual reference

3. get_component_defs("bismuth://canvas/doc_abc123")
   → Check if Button has Code Connect

4. If Code Connect exists:
   - Use existing Button component
   - Map properties from design

5. If no Code Connect:
   - Generate new component from JSX
   - Use design tokens from variables

6. Write to src/components/ui/button.tsx
```

### Workflow 2: Create a New Component from Scratch

```
User: "Create a card component with header and content"

Agent:
1. create_frame(document_id, page_id, frame_data)
   → Creates new frame on canvas

2. add_node(frame_url, header_node)
   → Adds header section

3. add_node(frame_url, content_node)
   → Adds content section

4. create_component(document_id, component_data)
   → Converts frame to reusable component

5. get_design_context(frame_url)
   → Get generated structure

6. Generate code and write to project
```

### Workflow 3: Update Existing Design

```
User: "Change the button color to green"

Agent:
1. get_design_context("bismuth://canvas/doc_abc123/frame_button")
   → Get current state

2. update_frame(frame_url, { fills: [{ color: "#10b981" }] })
   → Update design

3. get_screenshot(frame_url)
   → Get updated visual

4. Update code to match new design
```

---

## Shell Script Examples

### Example 1: Export All Components

```bash
#!/bin/bash
# export-components.sh

DOCUMENT_URL="bismuth://canvas/doc_abc123"

# Get all components
bismuth canvas get-components "$DOCUMENT_URL" > components.json

# For each component, export code
jq -r '.components[].id' components.json | while read comp_id; do
  FRAME_URL="$DOCUMENT_URL/$comp_id"

  # Get design context
  bismuth canvas get-context "$FRAME_URL" > "output/${comp_id}_context.json"

  # Get screenshot
  bismuth canvas screenshot "$FRAME_URL" > "output/${comp_id}.png"

  # Generate code
  bismuth canvas generate-code "$FRAME_URL" --framework react --output "output/${comp_id}"
done
```

### Example 2: Sync Design Tokens

```bash
#!/bin/bash
# sync-tokens.sh

DOCUMENT_URL="bismuth://canvas/doc_abc123"

# Get variables
bismuth canvas get-variables "$DOCUMENT_URL" > variables.json

# Convert to CSS custom properties
jq -r '.variables[] | "--\(.name): \(.value);"' variables.json > tokens.css

# Convert to Tailwind config
cat > tailwind.config.js <<EOF
module.exports = {
  theme: {
    extend: {
      colors: $(jq '.variables | map(select(.type == "COLOR")) | from_entries' variables.json)
    }
  }
}
EOF
```

### Example 3: Automated Screenshot Testing

```bash
#!/bin/bash
# visual-regression.sh

DOCUMENT_URL="bismuth://canvas/doc_abc123"

# Get all frames
bismuth canvas get-metadata "$DOCUMENT_URL" | \
  jq -r '.nodeTree[].children[].id' | \
  while read frame_id; do
    FRAME_URL="$DOCUMENT_URL/$frame_id"

    # Take screenshot
    bismuth canvas screenshot "$FRAME_URL" > "screenshots/${frame_id}.png"

    # Compare with baseline
    compare "screenshots/${frame_id}.png" "baseline/${frame_id}.png" "diff/${frame_id}.png"
  done
```

---

## Implementation Checklist

### Phase 1: Core MCP Server

- [ ] HTTP server with axum
- [ ] JSON-RPC 2.0 handler
- [ ] Tool registration system
- [ ] Error handling
- [ ] CORS configuration

### Phase 2: Read Tools

- [ ] `get_design_context` implementation
- [ ] `get_variable_defs` implementation
- [ ] `get_component_defs` implementation
- [ ] `get_screenshot` implementation
- [ ] `get_metadata` implementation

### Phase 3: Write Tools

- [ ] `create_frame` implementation
- [ ] `update_frame` implementation
- [ ] `create_component` implementation
- [ ] `add_node` implementation

### Phase 4: Asset Serving

- [ ] `/assets/{asset_id}` endpoint
- [ ] `/screenshot/{doc}/{frame}` endpoint
- [ ] Image caching
- [ ] SVG optimization

### Phase 5: CLI Tool

- [ ] `bismuth canvas` command
- [ ] Subcommands for all tools
- [ ] JSON output formatting
- [ ] Shell script examples

### Phase 6: Testing & Documentation

- [ ] Unit tests for all tools
- [ ] Integration tests with AI agents
- [ ] API documentation
- [ ] Example workflows

---

## References

- MCP Specification: https://modelcontextprotocol.io/
- Figma MCP Server: https://github.com/figma/mcp-server-guide
- JSON-RPC 2.0: https://www.jsonrpc.org/specification
- Axum HTTP Framework: https://docs.rs/axum/

---

**Last Updated**: 2026-05-26
