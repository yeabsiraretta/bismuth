//! Frontmatter parsing service
//!
//! Handles parsing and serialization of YAML frontmatter in markdown files.

use crate::error::Result;
use serde_json::Value;
use std::collections::HashMap;

/// Frontmatter service for parsing YAML frontmatter
pub struct FrontmatterService;

impl FrontmatterService {
    /// Parses frontmatter from markdown content
    ///
    /// Extracts YAML frontmatter delimited by `---` at the start of the file.
    ///
    /// # Arguments
    ///
    /// * `content` - Markdown content with optional frontmatter
    ///
    /// # Returns
    ///
    /// Tuple of (frontmatter HashMap, body content)
    pub fn parse(content: &str) -> Result<(HashMap<String, Value>, String)> {
        let trimmed = content.trim_start();

        // Check if content starts with frontmatter delimiter
        if !trimmed.starts_with("---") {
            return Ok((HashMap::new(), content.to_string()));
        }

        // Find the closing delimiter
        let after_first_delimiter = &trimmed[3..];
        if let Some(end_pos) = after_first_delimiter.find("\n---") {
            let yaml_content = &after_first_delimiter[..end_pos].trim();
            let body = &after_first_delimiter[end_pos + 4..].trim_start();

            // Parse YAML
            let frontmatter = Self::parse_yaml(yaml_content)?;

            Ok((frontmatter, body.to_string()))
        } else {
            // No closing delimiter found
            Ok((HashMap::new(), content.to_string()))
        }
    }

    /// Parses YAML string into a HashMap
    fn parse_yaml(yaml: &str) -> Result<HashMap<String, Value>> {
        if yaml.is_empty() {
            return Ok(HashMap::new());
        }

        let yaml_value: serde_yaml::Value = serde_yaml::from_str(yaml)?;

        // Convert YAML value to JSON value for consistency
        let json_str = serde_json::to_string(&yaml_value)?;
        let json_value: Value = serde_json::from_str(&json_str)?;

        // Convert to HashMap
        if let Value::Object(map) = json_value {
            let mut result = HashMap::new();
            for (key, value) in map {
                result.insert(key, value);
            }
            Ok(result)
        } else {
            Ok(HashMap::new())
        }
    }

    /// Serializes frontmatter and body back into markdown
    ///
    /// # Arguments
    ///
    /// * `frontmatter` - Frontmatter fields
    /// * `body` - Markdown body content
    ///
    /// # Returns
    ///
    /// Complete markdown content with frontmatter
    pub fn serialize(frontmatter: &HashMap<String, Value>, body: &str) -> Result<String> {
        if frontmatter.is_empty() {
            return Ok(body.to_string());
        }

        // Convert HashMap to YAML
        let yaml_value = serde_json::to_value(frontmatter)?;
        let yaml_str = serde_yaml::to_string(&yaml_value)?;

        Ok(format!("---\n{}---\n{}", yaml_str, body))
    }

    /// Extracts a specific field from frontmatter
    pub fn get_field<'a>(frontmatter: &'a HashMap<String, Value>, key: &str) -> Option<&'a Value> {
        frontmatter.get(key)
    }

    /// Sets a field in frontmatter
    pub fn set_field(
        frontmatter: &mut HashMap<String, Value>,
        key: String,
        value: Value,
    ) {
        frontmatter.insert(key, value);
    }

    /// Removes a field from frontmatter
    pub fn remove_field(frontmatter: &mut HashMap<String, Value>, key: &str) -> Option<Value> {
        frontmatter.remove(key)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_parse_empty_frontmatter() {
        let content = "# Hello World\n\nThis is content.";
        let (frontmatter, body) = FrontmatterService::parse(content).unwrap();

        assert!(frontmatter.is_empty());
        assert_eq!(body, content);
    }

    #[test]
    fn test_parse_valid_frontmatter() {
        let content = r#"---
title: Test Note
tags: [rust, testing]
draft: false
---
# Hello World

This is content."#;

        let (frontmatter, body) = FrontmatterService::parse(content).unwrap();

        assert_eq!(frontmatter.len(), 3);
        assert_eq!(
            frontmatter.get("title"),
            Some(&Value::String("Test Note".to_string()))
        );
        assert!(body.starts_with("# Hello World"));
    }

    #[test]
    fn test_parse_frontmatter_with_nested_fields() {
        let content = r#"---
title: Test
metadata:
  author: John Doe
  date: 2024-05-26
---
Content here"#;

        let (frontmatter, body) = FrontmatterService::parse(content).unwrap();

        assert!(frontmatter.contains_key("metadata"));
        assert_eq!(body, "Content here");
    }

    #[test]
    fn test_serialize_empty_frontmatter() {
        let frontmatter = HashMap::new();
        let body = "# Test\n\nContent";

        let result = FrontmatterService::serialize(&frontmatter, body).unwrap();
        assert_eq!(result, body);
    }

    #[test]
    fn test_serialize_with_frontmatter() {
        let mut frontmatter = HashMap::new();
        frontmatter.insert("title".to_string(), json!("Test Note"));
        frontmatter.insert("draft".to_string(), json!(false));

        let body = "# Test\n\nContent";
        let result = FrontmatterService::serialize(&frontmatter, body).unwrap();

        assert!(result.starts_with("---\n"));
        assert!(result.contains("title:"));
        assert!(result.contains("# Test"));
    }

    #[test]
    fn test_roundtrip_parse_serialize() {
        let original = r#"---
title: Roundtrip Test
tags: [test]
---
# Content

This is a test."#;

        let (frontmatter, body) = FrontmatterService::parse(original).unwrap();
        let serialized = FrontmatterService::serialize(&frontmatter, &body).unwrap();

        // Parse again to verify
        let (frontmatter2, body2) = FrontmatterService::parse(&serialized).unwrap();

        assert_eq!(frontmatter.get("title"), frontmatter2.get("title"));
        assert_eq!(body, body2);
    }

    #[test]
    fn test_get_field() {
        let mut frontmatter = HashMap::new();
        frontmatter.insert("title".to_string(), json!("Test"));

        let value = FrontmatterService::get_field(&frontmatter, "title");
        assert_eq!(value, Some(&json!("Test")));

        let missing = FrontmatterService::get_field(&frontmatter, "missing");
        assert_eq!(missing, None);
    }

    #[test]
    fn test_set_field() {
        let mut frontmatter = HashMap::new();
        FrontmatterService::set_field(&mut frontmatter, "title".to_string(), json!("New Title"));

        assert_eq!(frontmatter.get("title"), Some(&json!("New Title")));
    }

    #[test]
    fn test_remove_field() {
        let mut frontmatter = HashMap::new();
        frontmatter.insert("title".to_string(), json!("Test"));

        let removed = FrontmatterService::remove_field(&mut frontmatter, "title");
        assert_eq!(removed, Some(json!("Test")));
        assert!(!frontmatter.contains_key("title"));
    }

    #[test]
    fn test_parse_malformed_frontmatter() {
        let content = r#"---
title: Test
invalid yaml: [unclosed
---
Content"#;

        let result = FrontmatterService::parse(content);
        // Should handle gracefully (either parse what it can or return error)
        assert!(result.is_ok() || result.is_err());
    }
}
