//! Template service for note creation from templates.
//!
//! Provides a Handlebars-like template language with built-in modules,
//! sandboxed execution, and configurable resource limits.

pub mod engine;
pub mod builtins;
pub mod pipe_helpers;
pub(crate) mod template_parser;

use crate::error::{BismuthError, Result};
use std::path::{Path, PathBuf};
use std::collections::HashMap;

/// A template definition stored on disk.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Template {
    pub name: String,
    pub template_type: TemplateType,
    pub content: String,
    pub description: String,
}

/// Template categories.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum TemplateType {
    Daily,
    Weekly,
    Monthly,
    Yearly,
    Custom,
}

/// Sandbox limits for template execution (security).
pub struct SandboxLimits {
    pub timeout_ms: u64,
    pub max_iterations: usize,
    pub max_output_bytes: usize,
}

impl Default for SandboxLimits {
    fn default() -> Self {
        Self {
            timeout_ms: 5000,
            max_iterations: 1000,
            max_output_bytes: 10 * 1024 * 1024, // 10MB
        }
    }
}

/// Template service bound to a vault root.
pub struct TemplateService {
    vault_root: PathBuf,
    limits: SandboxLimits,
}

impl TemplateService {
    pub fn new(vault_root: &Path) -> Self {
        Self {
            vault_root: vault_root.to_path_buf(),
            limits: SandboxLimits::default(),
        }
    }

    /// List all templates (defaults + user-defined).
    pub fn list_templates(&self) -> Result<Vec<Template>> {
        let mut templates = Vec::new();

        // User templates from .bismuth/templates/
        use crate::config::constants::filesystem::VAULT_DIR_NAME;
        let user_dir = self.vault_root.join(VAULT_DIR_NAME).join("templates");
        if user_dir.exists() {
            for entry in std::fs::read_dir(&user_dir)
                .map_err(|e| BismuthError::Io(format!("Read templates dir: {}", e)))?
            {
                let entry = entry.map_err(|e| BismuthError::Io(e.to_string()))?;
                let path = entry.path();
                if path.extension().map(|e| e == "md").unwrap_or(false) {
                    if let Ok(content) = std::fs::read_to_string(&path) {
                        let name = path.file_stem()
                            .map(|s| s.to_string_lossy().to_string())
                            .unwrap_or_default();
                        templates.push(Template {
                            name: name.clone(),
                            template_type: classify_template(&name),
                            content,
                            description: String::new(),
                        });
                    }
                }
            }
        }

        Ok(templates)
    }

    /// Seeds the `.bismuth/templates/` directory with default templates
    /// if the directory is empty. Called on vault open to ensure users
    /// have starter templates available.
    pub fn seed_defaults(&self) -> Result<()> {
        use crate::config::constants::filesystem::VAULT_DIR_NAME;
        let dir = self.vault_root.join(VAULT_DIR_NAME).join("templates");
        std::fs::create_dir_all(&dir)
            .map_err(|e| BismuthError::Io(format!("Create templates dir: {}", e)))?;

        // Only seed if no user templates exist yet
        let has_templates = std::fs::read_dir(&dir)
            .map(|entries| entries.filter_map(|e| e.ok())
                .any(|e| e.path().extension().map(|x| x == "md").unwrap_or(false)))
            .unwrap_or(false);
        if has_templates {
            return Ok(());
        }

        for (name, content) in default_templates() {
            let path = dir.join(format!("{}.md", name));
            std::fs::write(&path, content)
                .map_err(|e| BismuthError::Io(format!("Seed template {}: {}", name, e)))?;
        }
        Ok(())
    }

    /// Render a template with the given context variables.
    pub fn render_template(
        &self,
        content: &str,
        context: &HashMap<String, String>,
    ) -> Result<String> {
        engine::render(content, context, &self.vault_root, &self.limits)
    }

    /// Create a new note from a template.
    pub fn create_from_template(
        &self,
        template_name: &str,
        target_path: &Path,
        context: &HashMap<String, String>,
    ) -> Result<String> {
        // Security: validate target path is within vault
        if !target_path.starts_with(&self.vault_root) {
            return Err(BismuthError::Security(
                "Target path must be within vault".to_string(),
            ));
        }

        let templates = self.list_templates()?;
        let template = templates.iter()
            .find(|t| t.name == template_name)
            .ok_or_else(|| BismuthError::NotFound(format!("Template '{}' not found", template_name)))?;

        let rendered = self.render_template(&template.content, context)?;
        std::fs::write(target_path, &rendered)
            .map_err(|e| BismuthError::Io(format!("Write template output: {}", e)))?;

        Ok(rendered)
    }

    /// Save a template to vault .bismuth/templates/.
    pub fn save_template(&self, template: &Template) -> Result<()> {
        use crate::config::constants::filesystem::VAULT_DIR_NAME;
        let dir = self.vault_root.join(VAULT_DIR_NAME).join("templates");
        std::fs::create_dir_all(&dir)
            .map_err(|e| BismuthError::Io(format!("Create templates dir: {}", e)))?;

        // Security: sanitize name
        let safe_name: String = template.name.chars()
            .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_' || *c == ' ')
            .collect();
        if safe_name.is_empty() {
            return Err(BismuthError::Validation("Invalid template name".to_string()));
        }

        let path = dir.join(format!("{}.md", safe_name));
        std::fs::write(&path, &template.content)
            .map_err(|e| BismuthError::Io(format!("Write template: {}", e)))?;
        Ok(())
    }

    /// Delete a template.
    pub fn delete_template(&self, name: &str) -> Result<()> {
        let safe_name: String = name.chars()
            .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_' || *c == ' ')
            .collect();
        use crate::config::constants::filesystem::VAULT_DIR_NAME;
        let path = self.vault_root.join(VAULT_DIR_NAME).join("templates").join(format!("{}.md", safe_name));
        if path.exists() {
            std::fs::remove_file(&path)
                .map_err(|e| BismuthError::Io(format!("Delete template: {}", e)))?;
        }
        Ok(())
    }
}

fn classify_template(name: &str) -> TemplateType {
    let lower = name.to_lowercase();
    if lower.contains("daily") { TemplateType::Daily }
    else if lower.contains("weekly") { TemplateType::Weekly }
    else if lower.contains("monthly") { TemplateType::Monthly }
    else if lower.contains("yearly") { TemplateType::Yearly }
    else { TemplateType::Custom }
}

fn default_templates() -> Vec<(&'static str, &'static str)> {
    vec![
        ("daily-note", r#"---
title: "{{title}}"
date: "{{date.today}}"
tags: [daily]
---

# {{date.today}}

## Plan

- [ ] 

## Notes

{{system.cursor}}

## Review

"#),
        ("meeting-notes", r#"---
title: "{{title}}"
date: "{{date.today}}"
tags: [meeting]
---

# {{title}}

**Date**: {{date.today}}
**Attendees**: 

## Agenda

1. 

## Discussion

{{system.cursor}}

## Action Items

- [ ] 

"#),
        ("new-note", r#"---
title: "{{title}}"
date: "{{date.today}}"
tags: []
---

# {{title}}

{{system.cursor}}
"#),
    ]
}
