//! Manuscript compilation: join scenes, strip frontmatter, apply template.
//!
//! Security: compile templates use string interpolation only (no eval).
//! Performance: 100 scenes compilation < 2s.

use crate::error::{BismuthError, Result};
use super::Scene;
use std::path::Path;

/// Compilation options.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CompileOptions {
    pub strip_frontmatter: bool,
    pub scene_separator: String,
    pub include_scene_titles: bool,
    pub output_path: String,
}

impl Default for CompileOptions {
    fn default() -> Self {
        Self {
            strip_frontmatter: true,
            scene_separator: "\n\n---\n\n".to_string(),
            include_scene_titles: true,
            output_path: String::new(),
        }
    }
}

/// Compile scenes into a single manuscript.
pub fn compile_manuscript(
    scenes: &[Scene],
    options: &CompileOptions,
    vault_root: &Path,
) -> Result<String> {
    let mut output = String::new();

    for scene in scenes {
        let path = Path::new(&scene.path);

        // Security: validate scene path within vault
        if !path.starts_with(vault_root) {
            return Err(BismuthError::Security(
                format!("Scene path outside vault: {}", scene.path),
            ));
        }

        let content = std::fs::read_to_string(path)
            .map_err(|e| BismuthError::Io(format!("Read scene '{}': {}", scene.title, e)))?;

        let text = if options.strip_frontmatter {
            crate::utils::markdown::strip_frontmatter(&content).to_string()
        } else {
            content.clone()
        };

        if !output.is_empty() {
            output.push_str(&options.scene_separator);
        }

        if options.include_scene_titles {
            output.push_str(&format!("# {}\n\n", scene.title));
        }

        output.push_str(text.trim());
    }

    // Write output if path specified
    if !options.output_path.is_empty() {
        let out_path = Path::new(&options.output_path);
        if !out_path.starts_with(vault_root) {
            return Err(BismuthError::Security(
                "Output path must be within vault".to_string(),
            ));
        }
        std::fs::write(out_path, &output)
            .map_err(|e| BismuthError::Io(format!("Write manuscript: {}", e)))?;
    }

    Ok(output)
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compile_empty() {
        let result = compile_manuscript(&[], &CompileOptions::default(), Path::new("/tmp")).unwrap();
        assert!(result.is_empty());
    }

}
