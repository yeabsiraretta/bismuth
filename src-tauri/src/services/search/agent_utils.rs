//! Shared utilities for agent REST endpoint handlers.
//!
//! `check_bearer` — validates `Authorization: Bearer` header
//! `path_within_vault` — path traversal guard
//! `extract_frontmatter` — parses YAML frontmatter from markdown
//! `collect_md_paths` — recursive `.md` path lister

use std::path::Path;

/// Validates the Authorization: Bearer {token} header value.
pub(crate) fn check_bearer(auth_header: Option<&str>, expected: &str) -> bool {
    match auth_header {
        Some(val) => {
            if let Some(token) = val.strip_prefix("Bearer ") {
                token.trim() == expected
            } else {
                false
            }
        }
        None => false,
    }
}

/// Validates that `rel_path` stays within `vault_root`.
/// Returns the absolute path if safe, or `None` if the path escapes the vault.
pub(crate) fn path_within_vault(vault_root: &str, rel_path: &str) -> Option<std::path::PathBuf> {
    use std::path::Component;

    let canonical_vault = Path::new(vault_root).canonicalize().ok()?;
    let clean_rel = rel_path.trim_start_matches('/');

    // Normalize the relative path, rejecting any escaping `..` sequences.
    let mut normalized_rel = std::path::PathBuf::new();
    let mut depth: i64 = 0;
    for component in Path::new(clean_rel).components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                depth -= 1;
                if depth < 0 {
                    return None; // Would escape vault root
                }
                normalized_rel.pop();
            }
            Component::Normal(seg) => {
                depth += 1;
                normalized_rel.push(seg);
            }
            _ => {}
        }
    }

    Some(canonical_vault.join(normalized_rel))
}

/// Parses a YAML frontmatter block from markdown content.
pub(crate) fn extract_frontmatter(content: &str) -> serde_json::Value {
    let trimmed = content.trim_start();
    if !trimmed.starts_with("---") {
        return serde_json::Value::Object(serde_json::Map::new());
    }
    let after = &trimmed[3..];
    if let Some(end) = after.find("\n---") {
        let yaml = after[..end].trim();
        if let Ok(v) = serde_yaml::from_str::<serde_yaml::Value>(yaml) {
            if let Ok(j) = serde_json::to_value(v) {
                return j;
            }
        }
    }
    serde_json::Value::Object(serde_json::Map::new())
}

/// Recursively collects `.md` file paths relative to `base`.
pub(crate) fn collect_md_paths(base: &Path, dir: &Path, out: &mut Vec<String>) {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let p = entry.path();
        let name = p
            .file_name()
            .map(|n| n.to_string_lossy().into_owned())
            .unwrap_or_default();
        if name.starts_with('.') {
            continue;
        }
        if p.is_dir() {
            collect_md_paths(base, &p, out);
        } else if p.extension().map_or(false, |e| e == "md") {
            if let Ok(rel) = p.strip_prefix(base) {
                out.push(rel.to_string_lossy().into_owned());
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_check_bearer_valid() {
        assert!(check_bearer(Some("Bearer my-secret-token"), "my-secret-token"));
    }

    #[test]
    fn test_check_bearer_invalid() {
        assert!(!check_bearer(Some("Bearer wrong-token"), "my-secret-token"));
    }

    #[test]
    fn test_check_bearer_missing() {
        assert!(!check_bearer(None, "my-secret-token"));
    }

    #[test]
    fn test_check_bearer_no_prefix() {
        assert!(!check_bearer(Some("my-secret-token"), "my-secret-token"));
    }

    #[test]
    fn test_extract_frontmatter_present() {
        let content = "---\ntitle: Hello\n---\nBody text";
        let fm = extract_frontmatter(content);
        assert_eq!(fm["title"], "Hello");
    }

    #[test]
    fn test_extract_frontmatter_absent() {
        let content = "# Just a heading\n\nBody text";
        let fm = extract_frontmatter(content);
        assert!(fm.as_object().map_or(false, |o| o.is_empty()));
    }

    #[test]
    fn test_path_within_vault_valid() {
        let tmp = tempfile::TempDir::new().unwrap();
        let vault = tmp.path().to_str().unwrap();
        let result = path_within_vault(vault, "note.md");
        assert!(result.is_some());
    }

    #[test]
    fn test_path_within_vault_traversal() {
        let tmp = tempfile::TempDir::new().unwrap();
        let vault = tmp.path().to_str().unwrap();
        let result = path_within_vault(vault, "../../etc/passwd");
        assert!(result.is_none(), "Path traversal must be rejected");
    }

    #[test]
    fn test_path_within_vault_subdir() {
        let tmp = tempfile::TempDir::new().unwrap();
        let vault = tmp.path().to_str().unwrap();
        let result = path_within_vault(vault, "subdir/note.md");
        assert!(result.is_some());
        let p = result.unwrap();
        assert!(p.starts_with(tmp.path()));
    }
}
