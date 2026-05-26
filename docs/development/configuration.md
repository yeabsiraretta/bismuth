---
summary: Configuration system architecture and usage guide
read_when: Modifying constants, adding settings, or configuring the application
---

# Configuration System

Bismuth uses a centralized configuration system with clear separation between compile-time constants and runtime user settings.

## Architecture

### Backend (Rust)

```
src-tauri/src/config/
├── mod.rs           # Module exports
├── constants.rs     # Compile-time constants
└── settings.rs      # Runtime user settings
```

### Frontend (TypeScript)

```
src/lib/config/
└── constants.ts     # Frontend constants
```

## Backend Configuration

### Constants (`constants.rs`)

**Purpose**: Compile-time configuration values that define system limits and defaults.

**Organization**: Constants are grouped by domain in nested modules:

```rust
use crate::config::constants::filesystem;
use crate::config::constants::editor;
use crate::config::constants::performance;

// Usage
if file_size > filesystem::MAX_FILE_SIZE_BYTES {
    // Handle large file
}

let delay = editor::AUTO_SAVE_DELAY_MS;
```

**Available Modules**:

- `filesystem` - File system constraints
- `recovery` - Recovery system paths
- `history` - History tracking configuration
- `layout` - UI layout constraints
- `editor` - Editor configuration
- `search` - Search configuration
- `performance` - Performance targets
- `database` - Database configuration
- `security` - Security settings
- `logging` - Logging configuration
- `network` - Network configuration
- `features` - Feature flags
- `validation` - Helper functions

**Example**:
```rust
use crate::config::constants::filesystem;

pub fn check_file_size(size: usize) {
    if size > filesystem::MAX_FILE_SIZE_BYTES {
        log::warn!("File exceeds {}MB", 
            filesystem::MAX_FILE_SIZE_BYTES / 1_000_000);
    }
}
```

### Settings (`settings.rs`)

**Purpose**: Runtime user-configurable settings persisted to disk.

**Structure**:
```rust
pub struct AppSettings {
    pub editor: EditorSettings,
    pub layout: LayoutSettings,
    pub performance: PerformanceSettings,
    pub advanced: AdvancedSettings,
}
```

**Usage**:
```rust
use crate::config::settings::AppSettings;

// Load settings
let settings = AppSettings::load(&path)?;

// Modify settings
settings.editor.auto_save_delay_ms = 1000;
settings.validate(); // Apply constraints

// Save settings
settings.save(&path)?;
```

**Settings Categories**:

1. **EditorSettings**: Auto-save, tab size, line wrap, spell check
2. **LayoutSettings**: Sidebar widths, theme, font
3. **PerformanceSettings**: Search limits, warnings, history
4. **AdvancedSettings**: Recovery, logging, database

**File Locations**:

- **Vault-specific**: `<vault_root>/.bismuth/settings.json`
- **Global**: `~/.config/bismuth/settings.json` (macOS/Linux) or `%APPDATA%\bismuth\settings.json` (Windows)

## Frontend Configuration

### Constants (`constants.ts`)

**Purpose**: Frontend-specific constants for UI, performance, and features.

**Organization**: Grouped by domain with TypeScript const assertions:

```typescript
import { EDITOR, LAYOUT, PERFORMANCE } from '$lib/config/constants';

// Usage
const delay = EDITOR.AUTO_SAVE_DELAY_MS;
const minWidth = LAYOUT.SIDEBAR_MIN_WIDTH;

// Validation helpers
import { validate } from '$lib/config/constants';

if (validate.isFileTooLarge(fileSize)) {
    // Handle large file
}

const width = validate.clampSidebarWidth(userInput);
```

**Available Constants**:

- `EDITOR` - Editor configuration
- `LAYOUT` - Layout and UI
- `PERFORMANCE` - Performance targets
- `ANIMATION` - Transition durations
- `ACCESSIBILITY` - A11y requirements
- `BREAKPOINTS` - Responsive breakpoints
- `Z_INDEX` - Layer ordering
- `TOAST` - Notification settings
- `FILE` - File validation
- `FEATURES` - Feature flags
- `validate` - Validation helpers

## Adding New Constants

### Backend

1. **Add to `constants.rs`**:
```rust
pub mod my_feature {
    /// Description of constant
    pub const MY_CONSTANT: usize = 100;
}
```

2. **Use in code**:
```rust
use crate::config::constants::my_feature;

if value > my_feature::MY_CONSTANT {
    // Handle
}
```

### Frontend

1. **Add to `constants.ts`**:
```typescript
export const MY_FEATURE = {
  /** Description */
  MY_CONSTANT: 100,
} as const;
```

2. **Use in code**:
```typescript
import { MY_FEATURE } from '$lib/config/constants';

if (value > MY_FEATURE.MY_CONSTANT) {
    // Handle
}
```

## Adding New Settings

### Backend

1. **Add field to appropriate settings struct**:
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct EditorSettings {
    // ... existing fields
    
    /// New setting description
    pub my_new_setting: bool,
}
```

2. **Update default implementation**:
```rust
impl Default for EditorSettings {
    fn default() -> Self {
        Self {
            // ... existing defaults
            my_new_setting: true,
        }
    }
}
```

3. **Add validation if needed**:
```rust
impl AppSettings {
    pub fn validate(&mut self) {
        // ... existing validation
        
        // Validate new setting
        if self.editor.my_new_setting {
            // Apply constraints
        }
    }
}
```

### Frontend

Settings are loaded from backend via IPC. No frontend changes needed unless adding UI controls.

## Security Considerations

### Sensitive Values

**DO NOT** store sensitive values in constants or settings:
- API keys
- Passwords
- Tokens
- Private keys

Use environment variables or secure credential storage instead.

### Path Validation

Always validate paths before use:
```rust
use crate::config::constants::security;

if path.to_string_lossy().len() > security::MAX_PATH_LENGTH {
    return Err(BismuthError::InvalidPath);
}

if !security::ENFORCE_VAULT_BOUNDARY {
    // Skip validation (not recommended)
}
```

### File Extension Validation

```rust
use crate::config::constants::security;

let ext = path.extension()
    .and_then(|e| e.to_str())
    .unwrap_or("");

if !security::ALLOWED_NOTE_EXTENSIONS.contains(&ext) {
    return Err(BismuthError::InvalidFileType);
}
```

## Best Practices

### 1. Use Constants Over Magic Numbers

**Bad**:
```rust
if file_size > 10_000_000 {
    // What is 10_000_000?
}
```

**Good**:
```rust
use crate::config::constants::filesystem;

if file_size > filesystem::MAX_FILE_SIZE_BYTES {
    // Clear and maintainable
}
```

### 2. Document All Constants

```rust
/// Maximum file size before warning (10MB)
/// Can be adjusted based on system capabilities
pub const MAX_FILE_SIZE_BYTES: usize = 10_000_000;
```

### 3. Group Related Constants

```rust
pub mod editor {
    pub const AUTO_SAVE_DELAY_MS: u64 = 500;
    pub const MAX_INPUT_LATENCY_MS: u64 = 16;
    pub const DEFAULT_TAB_SIZE: u32 = 2;
}
```

### 4. Use Type-Safe Enums for Options

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LogLevel {
    Trace,
    Debug,
    Info,
    Warn,
    Error,
}
```

### 5. Provide Validation Helpers

```rust
pub mod validation {
    pub fn is_file_too_large(size: usize) -> bool {
        size > filesystem::MAX_FILE_SIZE_BYTES
    }
}
```

### 6. Use Const Assertions in TypeScript

```typescript
export const LAYOUT = {
  SIDEBAR_MIN_WIDTH: 200,
  SIDEBAR_MAX_WIDTH: 600,
} as const;

// Type is inferred as literal values, not just 'number'
```

## Testing

### Backend

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_file_size_validation() {
        assert!(!validation::is_file_too_large(1_000_000));
        assert!(validation::is_file_too_large(11_000_000));
    }
}
```

### Frontend

```typescript
import { describe, it, expect } from 'vitest';
import { validate } from '$lib/config/constants';

describe('Configuration validation', () => {
  it('validates file size', () => {
    expect(validate.isFileTooLarge(1_000_000)).toBe(false);
    expect(validate.isFileTooLarge(11_000_000)).toBe(true);
  });
});
```

## Migration

When changing constants that affect persisted data:

1. **Version settings schema**
2. **Provide migration path**
3. **Document breaking changes**
4. **Test with old settings files**

Example:
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    #[serde(default = "default_version")]
    pub version: u32,
    // ... fields
}

fn default_version() -> u32 { 1 }

impl AppSettings {
    pub fn migrate(&mut self) {
        if self.version < 2 {
            // Migrate from v1 to v2
            self.version = 2;
        }
    }
}
```

## Performance Impact

Constants have **zero runtime cost** - they're inlined at compile time.

Settings have **minimal cost** - loaded once at startup and cached in memory.

## Related Documentation

- [Architecture Overview](../architecture/overview.md)
- [Security Guidelines](../standards/security.md)
- [Testing Guide](../development/testing.md)
