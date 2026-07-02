//! Markdown utility functions shared across services.

/// Strips YAML frontmatter delimited by `---` from markdown content.
///
/// Returns the body content after the closing `---` delimiter, with leading
/// whitespace trimmed. If no valid frontmatter is found, returns the original
/// content unchanged.
///
/// # Examples
///
/// ```
/// use bismuth::utils::markdown::strip_frontmatter;
///
/// let content = "---\ntitle: Hello\n---\nBody text";
/// assert_eq!(strip_frontmatter(content), "Body text");
///
/// let no_fm = "Just plain text";
/// assert_eq!(strip_frontmatter(no_fm), "Just plain text");
/// ```
pub fn strip_frontmatter(content: &str) -> &str {
    if !content.starts_with("---") {
        return content;
    }
    // Skip the opening `---` and the newline after it
    let after_open = &content[3..];
    let after_open = after_open.strip_prefix('\n')
        .or_else(|| after_open.strip_prefix("\r\n"))
        .unwrap_or(after_open);

    // Find closing `---` at the start of a line
    match after_open.find("\n---") {
        Some(idx) => {
            let after_close = &after_open[idx + 4..];
            // Skip the newline after closing ---
            let after_close = after_close.strip_prefix('\n')
                .or_else(|| after_close.strip_prefix("\r\n"))
                .unwrap_or(after_close);
            after_close.trim_start()
        }
        None => content,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn no_frontmatter() {
        assert_eq!(strip_frontmatter("Hello world"), "Hello world");
    }

    #[test]
    fn standard_frontmatter() {
        let input = "---\ntitle: Test\ntags: [a, b]\n---\nBody content here";
        assert_eq!(strip_frontmatter(input), "Body content here");
    }

    #[test]
    fn frontmatter_with_crlf() {
        let input = "---\r\ntitle: Test\r\n---\r\nBody";
        assert_eq!(strip_frontmatter(input), "Body");
    }

    #[test]
    fn unclosed_frontmatter() {
        let input = "---\ntitle: Test\nno closing";
        assert_eq!(strip_frontmatter(input), input);
    }

    #[test]
    fn empty_body() {
        let input = "---\ntitle: Test\n---\n";
        assert_eq!(strip_frontmatter(input), "");
    }

    #[test]
    fn empty_string() {
        assert_eq!(strip_frontmatter(""), "");
    }
}
