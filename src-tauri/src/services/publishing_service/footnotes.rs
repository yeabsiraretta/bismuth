//! Footnote pre-processing for published notes.
//!
//! Parses `[^id]: text` definition lines and `[^id]` inline references,
//! replacing them with numbered superscript anchors and an HTML definitions list.

use std::collections::HashMap;

/// Parsed footnote reference — position in the ordered reference list.
struct FootnoteRef {
    id: String,
    number: usize,
}

/// Pre-process footnotes before pulldown-cmark sees the markdown.
///
/// Steps:
///   1. Strip `[^id]: text` definition lines from the body and collect them.
///   2. Replace `[^id]` inline references with numbered superscript anchors.
///   3. Append a `<section class="footnotes">` with the definitions at the end.
pub fn process_footnotes(markdown: &str) -> String {
    let mut definitions: HashMap<String, String> = HashMap::new();
    let mut body_lines: Vec<&str> = Vec::new();

    for line in markdown.lines() {
        let trimmed = line.trim_start();
        if trimmed.starts_with("[^") {
            if let Some(bracket_end) = trimmed.find("]:") {
                let id = trimmed[2..bracket_end].to_string();
                let text = trimmed[bracket_end + 2..].trim().to_string();
                definitions.insert(id, text);
                continue;
            }
        }
        body_lines.push(line);
    }

    if definitions.is_empty() {
        return markdown.to_string();
    }

    let body = body_lines.join("\n");
    let mut refs: Vec<FootnoteRef> = Vec::new();
    let mut result = String::new();
    let mut remaining = body.as_str();

    while let Some(start) = remaining.find("[^") {
        result.push_str(&remaining[..start]);
        let after = &remaining[start + 2..];
        if let Some(end) = after.find(']') {
            let id = &after[..end];
            let trailing = &after[end + 1..];
            if definitions.contains_key(id) && !trailing.starts_with(':') {
                let number = if let Some(r) = refs.iter().find(|r| r.id == id) {
                    r.number
                } else {
                    let n = refs.len() + 1;
                    refs.push(FootnoteRef { id: id.to_string(), number: n });
                    n
                };
                result.push_str(&format!(
                    "<sup><a href=\"#fn-{}\" id=\"fnref-{}\">[{}]</a></sup>",
                    id, id, number
                ));
                remaining = &after[end + 1..];
            } else {
                result.push_str("[^");
                remaining = after;
            }
        } else {
            result.push_str("[^");
            remaining = after;
        }
    }
    result.push_str(remaining);

    if refs.is_empty() {
        return result;
    }

    result.push_str("\n\n<section class=\"footnotes\">\n<hr>\n<ol>\n");
    for r in &refs {
        let text = definitions.get(&r.id).map(String::as_str).unwrap_or("");
        result.push_str(&format!(
            "  <li id=\"fn-{}\"><p>{} <a href=\"#fnref-{}\" class=\"footnote-back\">&#8617;</a></p></li>\n",
            r.id, text, r.id
        ));
    }
    result.push_str("</ol>\n</section>\n");

    result
}

/// CSS for footnote section styling.
pub fn footnotes_css() -> &'static str {
    r#"
.footnotes { font-size: 0.875em; color: var(--muted); margin-top: 2rem; }
.footnotes ol { padding-left: 1.5em; }
.footnotes li { margin-bottom: 0.25rem; }
.footnote-back { font-size: 0.8em; margin-left: 0.25rem; }
sup a { font-size: 0.75em; text-decoration: none; color: var(--accent); }
"#
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_footnote_definition_stripped_from_body() {
        let md = "Hello[^1]\n\n[^1]: This is a note.";
        let out = process_footnotes(md);
        assert!(!out.contains("[^1]: This is a note."));
        assert!(out.contains("<section class=\"footnotes\">"));
    }

    #[test]
    fn test_footnote_inline_ref_replaced() {
        let md = "See[^ref] here.\n\n[^ref]: The referenced text.";
        let out = process_footnotes(md);
        assert!(out.contains("<sup><a href=\"#fn-ref\""));
        assert!(out.contains("[1]"));
    }

    #[test]
    fn test_footnote_definition_list_rendered() {
        let md = "A[^a] and B[^b].\n\n[^a]: First.\n[^b]: Second.";
        let out = process_footnotes(md);
        assert!(out.contains("<li id=\"fn-a\">"));
        assert!(out.contains("<li id=\"fn-b\">"));
        assert!(out.contains("First."));
        assert!(out.contains("Second."));
    }

    #[test]
    fn test_no_footnotes_unchanged() {
        let md = "No footnotes here.";
        let out = process_footnotes(md);
        assert_eq!(out, md);
    }

    #[test]
    fn test_footnote_back_link_present() {
        let md = "Text[^n].\n\n[^n]: Note text.";
        let out = process_footnotes(md);
        assert!(out.contains("href=\"#fnref-n\""));
        assert!(out.contains("footnote-back"));
    }
}
