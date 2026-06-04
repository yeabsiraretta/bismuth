//! Vault template scaffolding.
//!
//! Creates pre-populated directory structures and starter notes
//! based on popular organizational methodologies (PARA, Zettelkasten, Johnny.Decimal).

use crate::error::Result;
use std::fs;
use std::path::Path;

/// Applies a named template to the given vault directory.
///
/// Supported templates: `"PARA"`, `"JohnnyDecimal"`, `"Zettelkasten"`, or blank.
pub fn apply_template(path: &Path, template: &str) -> Result<()> {
    match template {
        "PARA" => create_para_template(path),
        "JohnnyDecimal" => create_johnny_decimal_template(path),
        "Zettelkasten" => create_zettelkasten_template(path),
        _ => create_blank_template(path),
    }
}

fn create_para_template(path: &Path) -> Result<()> {
    fs::create_dir_all(path.join("Projects"))?;
    fs::create_dir_all(path.join("Areas"))?;
    fs::create_dir_all(path.join("Resources"))?;
    fs::create_dir_all(path.join("Archive"))?;

    let readme = r#"# PARA Method

This vault uses the PARA organizational system:

## Projects
Short-term efforts with a specific goal and deadline.

## Areas
Long-term responsibilities you want to manage over time.

## Resources
Topics or interests that may be useful in the future.

## Archive
Inactive items from the other three categories.

---

**Tip**: Move items between folders as their status changes. Projects become archived when complete, areas evolve over time.
"#;
    fs::write(path.join("README.md"), readme)?;
    Ok(())
}

fn create_johnny_decimal_template(path: &Path) -> Result<()> {
    fs::create_dir_all(path.join("10-19 Personal"))?;
    fs::create_dir_all(path.join("20-29 Work"))?;

    let readme = r#"# Johnny.Decimal System

This vault uses the Johnny.Decimal organizational system.

## Structure

- **Areas** (10-19, 20-29, etc.): Broad areas of life or work
- **Categories** (11, 12, 13, etc.): Specific topics within an area
- **IDs** (11.01, 11.02, etc.): Individual items

## Examples

- `10-19 Personal/`
  - `11 Health/`
    - `11.01 Medical records`
    - `11.02 Exercise log`
  - `12 Finance/`
    - `12.01 Budget 2026`
    - `12.02 Tax documents`

## Rules

1. Max 10 categories per area
2. Max 99 items per category
3. Numbers never change once assigned

---

**Tip**: Use the format `AC.ID Name` where AC is the category number and ID is the item number.
"#;
    fs::write(path.join("README.md"), readme)?;
    Ok(())
}

fn create_zettelkasten_template(path: &Path) -> Result<()> {
    fs::create_dir_all(path.join("inbox"))?;
    fs::create_dir_all(path.join("permanent"))?;
    fs::create_dir_all(path.join("templates"))?;

    let readme = r#"# Zettelkasten Method

This vault uses the Zettelkasten note-taking method.

## Folders

### inbox/
Quick capture notes that haven't been processed yet.

### permanent/
Atomic, evergreen notes that form your knowledge base.

### templates/
Note templates for consistent formatting.

## Principles

1. **Atomicity**: One idea per note
2. **Connectivity**: Link notes together with `[[wikilinks]]`
3. **Own words**: Always write in your own words
4. **Citations**: Reference sources at the bottom

## Workflow

1. Capture ideas quickly in `inbox/`
2. Process inbox notes into atomic permanent notes
3. Link new notes to existing ones
4. Build structure notes to organize topics

---

**Tip**: Use time-based IDs (YYYYMMDDHHmm) for permanent notes to ensure uniqueness.
"#;
    fs::write(path.join("README.md"), readme)?;

    let template_content = r#"---
created: {{date}}
tags: []
---

# {{title}}

## Content

[Write your note here]

## References

- 
"#;
    fs::write(path.join("templates/note-template.md"), template_content)?;
    Ok(())
}

fn create_blank_template(path: &Path) -> Result<()> {
    let readme = r#"# Welcome to Bismuth

This is your new vault. Start creating notes and organizing your knowledge!

## Getting Started

1. Create your first note
2. Use `[[wikilinks]]` to connect notes
3. Add tags with `#tag` in frontmatter
4. Search with Cmd/Ctrl+P

Happy note-taking!
"#;
    fs::write(path.join("README.md"), readme)?;
    Ok(())
}
