# Tauri IPC Commands: Component System

## `list_components`

List all component definitions in the vault library.

**Args**: `{ vault_path: string }`

**Returns**: `ComponentManifest`

**Errors**: `VaultNotFound`, `ManifestCorrupted`

---

## `read_component`

Load a full component definition by ID.

**Args**: `{ vault_path: string, component_id: string }`

**Returns**: `ComponentDefinition`

**Errors**: `ComponentNotFound`, `ParseError`

---

## `save_component`

Create or update a component definition. Updates manifest automatically.

**Args**: `{ vault_path: string, component: ComponentDefinition }`

**Returns**: `{ id: string, modified_at: number }`

**Errors**: `WriteError`, `ValidationError`

---

## `delete_component`

Remove a component definition and its manifest entry.

**Args**: `{ vault_path: string, component_id: string }`

**Returns**: `{ deleted: true }`

**Errors**: `ComponentNotFound`, `WriteError`

---

## `generate_thumbnail`

Render a component's element tree to a small PNG thumbnail (128x128).

**Args**: `{ vault_path: string, component_id: string, width?: number, height?: number }`

**Returns**: `{ thumbnail: string }` (base64 PNG)

**Errors**: `ComponentNotFound`, `RenderError`

---

## File System Layout

Commands operate on:

```text
{vault_path}/.bismuth/components/
├── manifest.json
├── {component_id}.json
└── ...
```

The `.bismuth/components/` directory is created automatically on first `save_component` call.
