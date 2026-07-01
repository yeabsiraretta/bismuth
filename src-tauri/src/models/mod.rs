//! Data models for Bismuth PKM Editor
//!
//! This module contains the core data structures used throughout the application.

pub mod canvas;
pub mod link;
pub mod note;
pub mod vault;

pub use canvas::{
    CanvasDocument, CanvasElement, ComponentDefinition, ElementType, Layer, Page, Viewport,
};
pub use link::Link;
pub use note::{Note, NoteMeta};
pub use vault::Vault;

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Represents a tag with usage count
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Tag {
    /// Tag name (without # prefix)
    pub name: String,

    /// Number of notes using this tag
    pub count: usize,
}

impl Tag {
    /// Creates a new Tag
    pub fn new(name: String, count: usize) -> Self {
        Self { name, count }
    }
}

/// Represents a search result with relevance score
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    /// Path to the note
    pub path: PathBuf,

    /// Note title
    pub title: String,

    /// Snippet of matching content
    pub snippet: String,

    /// Relevance score (0.0 to 1.0)
    pub score: f32,
}

impl SearchResult {
    /// Creates a new SearchResult
    pub fn new(path: PathBuf, title: String, snippet: String, score: f32) -> Self {
        Self {
            path,
            title,
            snippet,
            score,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tag_creation() {
        let tag = Tag::new("rust".to_string(), 5);
        assert_eq!(tag.name, "rust");
        assert_eq!(tag.count, 5);
    }

    #[test]
    fn test_search_result_creation() {
        let result = SearchResult::new(
            PathBuf::from("/vault/note.md"),
            "Test Note".to_string(),
            "This is a snippet...".to_string(),
            0.85,
        );

        assert_eq!(result.title, "Test Note");
        assert_eq!(result.score, 0.85);
    }
}
