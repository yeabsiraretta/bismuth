//! Search index generation for the published site.
//!
//! Builds a JSON search index containing title, slug, excerpt, and tags
//! for client-side full-text search (e.g., via Fuse.js).

use super::PublishableNote;
use crate::error::Result;
use serde::Serialize;
use std::path::Path;

/// A single entry in the search index.
#[derive(Debug, Serialize)]
pub struct SearchEntry {
    pub title: String,
    pub slug: String,
    pub excerpt: String,
    pub tags: Vec<String>,
}

/// Builds the search index from all published notes.
pub fn build_search_index(notes: &[PublishableNote]) -> Vec<SearchEntry> {
    notes.iter().map(|note| {
        SearchEntry {
            title: note.title.clone(),
            slug: note.slug.clone(),
            excerpt: extract_excerpt(&note.content),
            tags: note.tags.clone(),
        }
    }).collect()
}

/// Writes the search index as JSON to the output directory.
pub fn write_search_index(notes: &[PublishableNote], output_dir: &Path) -> Result<()> {
    let index = build_search_index(notes);
    let json = serde_json::to_string(&index)
        .map_err(|e| crate::error::BismuthError::Generic(format!("JSON serialization failed: {}", e)))?;
    std::fs::write(output_dir.join("search-index.json"), json)
        .map_err(|e| crate::error::BismuthError::Generic(format!("Write search index failed: {}", e)))?;
    Ok(())
}

/// Extracts a plain-text excerpt from note content (first 200 chars of body).
fn extract_excerpt(content: &str) -> String {
    let body = crate::utils::markdown::strip_frontmatter(content);
    let plain: String = body.lines()
        .filter(|line| {
            !line.starts_with('#')
                && !line.starts_with("```")
                && !line.starts_with("> [!")
                && !line.trim().is_empty()
        })
        .take(5)
        .collect::<Vec<&str>>()
        .join(" ");

    // Strip inline markdown: bold, italic, links, code
    let stripped = plain
        .replace("**", "")
        .replace("__", "")
        .replace('*', "")
        .replace('`', "");

    if stripped.len() > 200 {
        format!("{}...", &stripped[..197])
    } else {
        stripped
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_excerpt_strips_markdown() {
        let content = "---\ntitle: Test\n---\n# Heading\n\nThis is **bold** and *italic* text.\n\nAnother paragraph here.";
        let excerpt = extract_excerpt(content);
        assert!(excerpt.contains("This is bold and italic text."));
        assert!(!excerpt.contains("**"));
    }

    #[test]
    fn test_excerpt_truncates_long_content() {
        let long_content = format!("---\ntitle: T\n---\n{}", "a".repeat(300));
        let excerpt = extract_excerpt(&long_content);
        assert!(excerpt.len() <= 200);
        assert!(excerpt.ends_with("..."));
    }

    #[test]
    fn test_search_index_structure() {
        let notes = vec![
            PublishableNote {
                path: "test.md".to_string(),
                title: "Test Note".to_string(),
                slug: "test-note".to_string(),
                content: "---\ntitle: Test\npublish: true\n---\nHello world".to_string(),
                is_home: false,
                pinned: false,
                order: None,
                tags: vec!["rust".to_string()],
                hide_nav: false,
                created: None,
                updated: None,
            },
        ];
        let index = build_search_index(&notes);
        assert_eq!(index.len(), 1);
        assert_eq!(index[0].title, "Test Note");
        assert_eq!(index[0].tags, vec!["rust"]);
    }
}
