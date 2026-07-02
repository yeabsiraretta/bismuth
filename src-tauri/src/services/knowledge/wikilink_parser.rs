//! Wikilink text matching and replacement helpers.
//!
//! Contains the pure text operations: link extraction, title-in-text matching,
//! and inside-wikilink position checks. Used by `WikilinkService`.

use regex::Regex;
use std::sync::LazyLock;

pub(super) static WIKILINK_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"\[\[([^\]]+)\]\]").unwrap()
});

/// A specific text span that matches a note title but is not yet linked.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct LinkMatch {
    pub text: String,
    pub start: usize,
    pub end: usize,
    pub context: String,
}

/// Replaces all `[[old_title]]` and `[[old_title|alias]]` with new title in content.
pub(crate) fn replace_wikilinks(content: &str, old_title: &str, new_title: &str) -> String {
    let pattern = format!(
        r"\[\[{}\]\]|\[\[{}(\|[^\]]+)\]\]",
        regex::escape(old_title),
        regex::escape(old_title)
    );
    let re = Regex::new(&pattern).unwrap();
    re.replace_all(content, |caps: &regex::Captures| {
        if let Some(alias) = caps.get(1) {
            format!("[[{}{}]]", new_title, alias.as_str())
        } else {
            format!("[[{}]]", new_title)
        }
    })
    .to_string()
}

/// Extracts all `[[target]]` link targets from content (ignoring aliases).
pub(crate) fn extract_wikilinks(content: &str) -> Vec<String> {
    let re = Regex::new(r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]").unwrap();
    re.captures_iter(content)
        .filter_map(|cap| cap.get(1).map(|m| m.as_str().to_string()))
        .collect()
}

/// Finds all unlinked matches of a search term in text (excluding spans inside wikilinks).
pub(crate) fn find_text_matches(
    content: &str,
    search: &str,
    case_sensitive: bool,
) -> Vec<LinkMatch> {
    let mut matches = Vec::new();
    let search_lower = search.to_lowercase();
    let content_lower = content.to_lowercase();

    let mut start = 0;
    while let Some(pos) = if case_sensitive {
        content[start..].find(search)
    } else {
        content_lower[start..].find(&search_lower)
    } {
        let absolute_pos = start + pos;

        if !is_inside_wikilink(content, absolute_pos) {
            let context_start = absolute_pos.saturating_sub(50);
            let context_end = (absolute_pos + search.len() + 50).min(content.len());
            let context = content[context_start..context_end].to_string();
            matches.push(LinkMatch {
                text: content[absolute_pos..absolute_pos + search.len()].to_string(),
                start: absolute_pos,
                end: absolute_pos + search.len(),
                context,
            });
        }

        start = absolute_pos + search.len();
    }
    matches
}

/// Checks if a byte position in the text is inside a `[[...]]` span.
pub(crate) fn is_inside_wikilink(content: &str, pos: usize) -> bool {
    for cap in WIKILINK_RE.captures_iter(content) {
        if let Some(m) = cap.get(0) {
            if pos >= m.start() && pos < m.end() {
                return true;
            }
        }
    }
    false
}
