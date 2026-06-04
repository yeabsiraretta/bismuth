use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

/// Represents a markdown note in the vault
///
/// A Note contains the file path, parsed frontmatter metadata,
/// and the main content body. It tracks creation and modification times.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    /// Absolute path to the note file
    pub path: PathBuf,

    /// Display title (from frontmatter or filename)
    pub title: String,

    /// Full markdown content including frontmatter
    pub content: String,

    /// Parsed YAML frontmatter as key-value pairs
    pub frontmatter: HashMap<String, serde_json::Value>,

    /// Creation timestamp
    pub created_at: DateTime<Utc>,

    /// Last modification timestamp
    pub modified_at: DateTime<Utc>,
}

impl Note {
    /// Creates a new Note from a file path and content
    ///
    /// Parses frontmatter and extracts metadata. If no title is found
    /// in frontmatter, uses the filename as the title.
    ///
    /// # Arguments
    ///
    /// * `path` - Absolute path to the note file
    /// * `content` - Full markdown content including frontmatter
    ///
    /// # Returns
    ///
    /// A new Note instance with parsed metadata
    pub fn new(path: PathBuf, content: String) -> Self {
        let (frontmatter, _body) = Self::parse_frontmatter(&content);

        // Extract title from frontmatter or filename
        let title = frontmatter
            .get("title")
            .and_then(|v| v.as_str())
            .map(String::from)
            .unwrap_or_else(|| {
                path.file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("Untitled")
                    .to_string()
            });

        let now = Utc::now();

        // Try to get timestamps from frontmatter
        let created_at = frontmatter
            .get("created")
            .and_then(|v| v.as_str())
            .and_then(|s| DateTime::parse_from_rfc3339(s).ok())
            .map(|dt| dt.with_timezone(&Utc))
            .unwrap_or(now);

        let modified_at = frontmatter
            .get("modified")
            .or_else(|| frontmatter.get("updated"))
            .and_then(|v| v.as_str())
            .and_then(|s| DateTime::parse_from_rfc3339(s).ok())
            .map(|dt| dt.with_timezone(&Utc))
            .unwrap_or(now);

        Self {
            path,
            title,
            content,
            frontmatter,
            created_at,
            modified_at,
        }
    }

    /// Parses YAML frontmatter from markdown content
    ///
    /// Frontmatter must be delimited by `---` at the start and end.
    ///
    /// # Arguments
    ///
    /// * `content` - Full markdown content
    ///
    /// # Returns
    ///
    /// A tuple of (frontmatter HashMap, body text)
    fn parse_frontmatter(content: &str) -> (HashMap<String, serde_json::Value>, String) {
        let mut frontmatter = HashMap::new();

        // Check if content starts with frontmatter delimiter
        if !content.starts_with("---\n") && !content.starts_with("---\r\n") {
            return (frontmatter, content.to_string());
        }

        // Find the closing delimiter
        let after_first = &content[4..]; // Skip first "---\n"
        if let Some(end_pos) = after_first
            .find("\n---\n")
            .or_else(|| after_first.find("\r\n---\r\n"))
        {
            let yaml_str = &after_first[..end_pos];
            let body = &after_first[end_pos + 5..]; // Skip "\n---\n"

            // Parse YAML to JSON
            if let Ok(yaml_value) = serde_yaml::from_str::<serde_yaml::Value>(yaml_str) {
                if let Ok(json_value) = serde_json::to_value(&yaml_value) {
                    if let Some(obj) = json_value.as_object() {
                        for (key, value) in obj {
                            frontmatter.insert(key.clone(), value.clone());
                        }
                    }
                }
            }

            return (frontmatter, body.to_string());
        }

        // No valid frontmatter found
        (frontmatter, content.to_string())
    }

    /// Gets the body content without frontmatter
    pub fn body(&self) -> String {
        let (_frontmatter, body) = Self::parse_frontmatter(&self.content);
        body
    }

    /// Updates the note's content and re-parses frontmatter
    pub fn update_content(&mut self, new_content: String) {
        self.content = new_content;
        let (frontmatter, _body) = Self::parse_frontmatter(&self.content);
        self.frontmatter = frontmatter;
        self.modified_at = Utc::now();
    }

    /// Gets a frontmatter field value
    pub fn get_field(&self, key: &str) -> Option<&serde_json::Value> {
        self.frontmatter.get(key)
    }

    /// Sets a frontmatter field value
    pub fn set_field(&mut self, key: String, value: serde_json::Value) {
        self.frontmatter.insert(key, value);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_note_without_frontmatter() {
        let path = PathBuf::from("/vault/test.md");
        let content = "# Hello World\n\nThis is a test note.".to_string();

        let note = Note::new(path.clone(), content.clone());

        assert_eq!(note.path, path);
        assert_eq!(note.title, "test");
        assert_eq!(note.content, content);
        assert!(note.frontmatter.is_empty());
    }

    #[test]
    fn test_new_note_with_frontmatter() {
        let path = PathBuf::from("/vault/test.md");
        let content = r#"---
title: My Test Note
tags: [test, example]
---

# Content

This is the body."#
            .to_string();

        let note = Note::new(path, content.clone());

        assert_eq!(note.title, "My Test Note");
        assert_eq!(note.content, content);
        assert_eq!(note.frontmatter.len(), 2);
        assert_eq!(
            note.get_field("title").and_then(|v| v.as_str()),
            Some("My Test Note")
        );
    }

    #[test]
    fn test_parse_frontmatter() {
        let content = r#"---
title: Test
count: 42
---

Body text"#;

        let (frontmatter, body) = Note::parse_frontmatter(content);

        assert_eq!(frontmatter.len(), 2);
        assert_eq!(body.trim(), "Body text");
    }

    #[test]
    fn test_body_extraction() {
        let path = PathBuf::from("/vault/test.md");
        let content = r#"---
title: Test
---

Body content here"#
            .to_string();

        let note = Note::new(path, content);
        let body = note.body();

        assert_eq!(body.trim(), "Body content here");
    }

    #[test]
    fn test_update_content() {
        let path = PathBuf::from("/vault/test.md");
        let content = "Initial content".to_string();

        let mut note = Note::new(path, content);
        let old_modified = note.modified_at;

        std::thread::sleep(std::time::Duration::from_millis(10));

        note.update_content("New content".to_string());

        assert_eq!(note.content, "New content");
        assert!(note.modified_at > old_modified);
    }
}
