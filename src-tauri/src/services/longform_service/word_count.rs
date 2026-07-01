//! Word counting utility for longform writing.

/// Count words in markdown content (strips frontmatter first).
pub fn count_words(content: &str) -> usize {
    let text = crate::utils::markdown::strip_frontmatter(content);
    text.split_whitespace().count()
}

/// Count words in a file.
pub fn count_words_in_file(path: &std::path::Path) -> usize {
    std::fs::read_to_string(path)
        .map(|c| count_words(&c))
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_count_words_simple() {
        assert_eq!(count_words("Hello world"), 2);
    }

    #[test]
    fn test_count_words_with_frontmatter() {
        let content = "---\ntitle: Test\n---\nHello world foo bar";
        assert_eq!(count_words(content), 4);
    }

    #[test]
    fn test_count_words_empty() {
        assert_eq!(count_words(""), 0);
    }

}
