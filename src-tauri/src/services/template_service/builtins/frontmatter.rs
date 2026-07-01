//! Frontmatter builtin module for templates.
//!
//! Provides: get (read frontmatter key), yaml_header, tags, aliases, title.
//! Context-driven: reads from the file.frontmatter.* context entries.

use std::collections::HashMap;

/// Dispatch a frontmatter.* function call.
pub fn call(func: &str, context: &HashMap<String, String>) -> Option<String> {
    match func {
        "yaml_header" | "header" => {
            // Generate a YAML frontmatter header from context entries prefixed with "frontmatter."
            let mut entries: Vec<(&str, &str)> = context.iter()
                .filter_map(|(k, v)| k.strip_prefix("frontmatter.").map(|key| (key, v.as_str())))
                .collect();
            entries.sort_by_key(|(k, _)| *k);
            if entries.is_empty() {
                Some("---\n---".to_string())
            } else {
                let body: String = entries.iter()
                    .map(|(k, v)| format!("{}: {}", k, v))
                    .collect::<Vec<_>>()
                    .join("\n");
                Some(format!("---\n{}\n---", body))
            }
        }
        "tags" => context.get("frontmatter.tags").cloned().or(Some(String::new())),
        "aliases" => context.get("frontmatter.aliases").cloned().or(Some(String::new())),
        "title" => context.get("frontmatter.title")
            .or_else(|| context.get("title"))
            .cloned()
            .or(Some(String::new())),
        "created" => context.get("frontmatter.created")
            .cloned()
            .or_else(|| Some(chrono::Local::now().format("%Y-%m-%d").to_string())),
        _ => {
            // Generic frontmatter key lookup
            context.get(&format!("frontmatter.{}", func)).cloned()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_yaml_header_empty() {
        let ctx = HashMap::new();
        assert_eq!(call("header", &ctx).unwrap(), "---\n---");
    }

    #[test]
    fn test_yaml_header_with_entries() {
        let mut ctx = HashMap::new();
        ctx.insert("frontmatter.title".to_string(), "My Note".to_string());
        ctx.insert("frontmatter.tags".to_string(), "[journal, daily]".to_string());
        let result = call("header", &ctx).unwrap();
        assert!(result.starts_with("---\n"));
        assert!(result.ends_with("\n---"));
        assert!(result.contains("tags: [journal, daily]"));
        assert!(result.contains("title: My Note"));
    }

    #[test]
    fn test_title_fallback() {
        let mut ctx = HashMap::new();
        ctx.insert("title".to_string(), "Fallback Title".to_string());
        assert_eq!(call("title", &ctx).unwrap(), "Fallback Title");
    }

    #[test]
    fn test_generic_key() {
        let mut ctx = HashMap::new();
        ctx.insert("frontmatter.status".to_string(), "draft".to_string());
        assert_eq!(call("status", &ctx).unwrap(), "draft");
    }
}
