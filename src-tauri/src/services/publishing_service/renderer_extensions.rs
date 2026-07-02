//! Markdown extension pre/post-processors: highlights, wikilinks, math, and mermaid.
//!
//! These processors integrate into the renderer pipeline:
//!   - Highlights: pre-process `==text==` → `<mark>text</mark>`
//!   - Wikilinks:  pre-process `[[target]]` → anchor tags or plain text
//!   - Math:       pre-process `$$...$$` and `$...$` → KaTeX wrapper spans
//!   - Mermaid:    post-process fenced mermaid blocks → `<pre class="mermaid">`

/// Escape HTML special characters to prevent XSS in math/wikilink content.
fn html_escape(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

// ---------------------------------------------------------------------------
// Highlight processing
// ---------------------------------------------------------------------------

/// Pre-process Bismuth highlight syntax ==text== → <mark>text</mark>.
/// Must run before pulldown-cmark since it doesn't know about ==.
pub fn preprocess_highlights(markdown: &str) -> String {
    let mut result = markdown.to_string();
    while let Some(start) = result.find("==") {
        if let Some(end) = result[start + 2..].find("==") {
            let inner = result[start + 2..start + 2 + end].to_string();
            result = format!(
                "{}<mark>{}</mark>{}",
                &result[..start],
                inner,
                &result[start + 2 + end + 2..]
            );
        } else {
            break;
        }
    }
    result
}

// ---------------------------------------------------------------------------
// Wikilink processing
// ---------------------------------------------------------------------------

/// Resolve [[wikilinks]] to anchor tags if the target is published.
fn resolve_wikilinks(text: &str, published_slugs: &[String]) -> String {
    let mut result = text.to_string();
    while let Some(start) = result.find("[[") {
        if let Some(end) = result[start..].find("]]") {
            let link_text = result[start + 2..start + end].to_string();
            let slug = link_text.to_lowercase().replace(' ', "-");
            let replacement = if published_slugs.contains(&slug) {
                format!(
                    "<a href=\"/{}.html\">{}</a>",
                    slug,
                    html_escape(&link_text)
                )
            } else {
                html_escape(&link_text)
            };
            result = format!("{}{}{}", &result[..start], replacement, &result[start + end + 2..]);
        } else {
            break;
        }
    }
    result
}

/// Pre-process wikilinks [[target]] → resolved anchor HTML or escaped plain text.
pub fn preprocess_wikilinks(markdown: &str, published_slugs: &[String]) -> String {
    resolve_wikilinks(markdown, published_slugs)
}

// ---------------------------------------------------------------------------
// Math processing
// ---------------------------------------------------------------------------

/// Result of math detection: processed markdown and whether math was found.
pub struct MathResult {
    pub processed: String,
    pub has_math: bool,
}

/// Pre-process `$$...$$` block math and `$...$` inline math.
///
/// Replaces them with `<div class="math-block">` and `<span class="math-inline">`
/// so KaTeX auto-render can process them client-side.
pub fn preprocess_math(markdown: &str) -> MathResult {
    let mut has_math = false;

    // Block math first ($$...$$) — process before inline to avoid mis-matching delimiters
    let mut out = String::new();
    let mut remaining = markdown;
    while let Some(start) = remaining.find("$$") {
        out.push_str(&remaining[..start]);
        let after_open = &remaining[start + 2..];
        if let Some(end) = after_open.find("$$") {
            let escaped = html_escape(&after_open[..end]);
            out.push_str(&format!("<div class=\"math-block\">{}</div>", escaped));
            remaining = &after_open[end + 2..];
            has_math = true;
        } else {
            out.push_str("$$");
            remaining = after_open;
            break;
        }
    }
    out.push_str(remaining);
    let intermediate = out;

    // Inline math ($...$)
    let mut out = String::new();
    let mut remaining = intermediate.as_str();
    while let Some(start) = remaining.find('$') {
        if remaining[start..].starts_with("$$") {
            out.push_str(&remaining[..start + 2]);
            remaining = &remaining[start + 2..];
            continue;
        }
        out.push_str(&remaining[..start]);
        let after_open = &remaining[start + 1..];
        let search_end = after_open.find('\n').unwrap_or(after_open.len());
        if let Some(end) = after_open[..search_end].find('$') {
            if end > 0 {
                let escaped = html_escape(&after_open[..end]);
                out.push_str(&format!("<span class=\"math-inline\">{}</span>", escaped));
                remaining = &after_open[end + 1..];
                has_math = true;
            } else {
                out.push('$');
                remaining = after_open;
            }
        } else {
            out.push('$');
            remaining = after_open;
        }
    }
    out.push_str(remaining);

    MathResult { processed: out, has_math }
}

/// KaTeX CDN links to inject in `<head>` when math is detected.
pub fn katex_head_snippets() -> &'static str {
    r#"  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"
    onload="renderMathInElement(document.body, {delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}]})"></script>"#
}

// ---------------------------------------------------------------------------
// Mermaid diagram processing
// ---------------------------------------------------------------------------

/// Result of mermaid block detection.
pub struct MermaidResult {
    pub processed: String,
    pub has_mermaid: bool,
}

/// Post-process HTML: replace `<code class="language-mermaid">...</code>` blocks
/// (produced by pulldown-cmark for ```mermaid fences) with `<pre class="mermaid">`.
pub fn postprocess_mermaid(html: &str) -> MermaidResult {
    let target_open = "<code class=\"language-mermaid\">";
    let target_close = "</code>";
    let pre_open = "<pre>";

    let mut result = String::new();
    let mut remaining = html;
    let mut has_mermaid = false;

    while let Some(code_pos) = remaining.find(target_open) {
        let before = &remaining[..code_pos];
        if let Some(pre_pos) = before.rfind(pre_open) {
            result.push_str(&remaining[..pre_pos]);
            let after_code = &remaining[code_pos + target_open.len()..];
            if let Some(end) = after_code.find(target_close) {
                let diagram = &after_code[..end];
                let after_close = &after_code[end + target_close.len()..];
                let pre_end_len = if after_close.starts_with("</pre>") { 6 } else { 0 };
                result.push_str(&format!("<pre class=\"mermaid\">{}</pre>", diagram));
                remaining = &after_close[pre_end_len..];
                has_mermaid = true;
            } else {
                result.push_str(&remaining[..code_pos + target_open.len()]);
                remaining = &remaining[code_pos + target_open.len()..];
            }
        } else {
            result.push_str(&remaining[..code_pos + target_open.len()]);
            remaining = &remaining[code_pos + target_open.len()..];
        }
    }
    result.push_str(remaining);

    MermaidResult { processed: result, has_mermaid }
}

/// Mermaid.js ESM script tag to inject near `</body>` when diagrams are detected.
pub fn mermaid_script_tag() -> &'static str {
    r#"  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true });
  </script>"#
}

// ---------------------------------------------------------------------------
// CSS helpers
// ---------------------------------------------------------------------------

/// CSS for math display and mermaid diagram containers.
pub fn extensions_css() -> &'static str {
    r#"
.math-block { overflow-x: auto; padding: 0.5rem 0; text-align: center; }
.math-inline { font-style: italic; }
pre.mermaid { background: transparent; text-align: center; padding: 1rem 0; }
"#
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_block_math_detected() {
        let r = preprocess_math("$$E = mc^2$$");
        assert!(r.has_math);
        assert!(r.processed.contains("<div class=\"math-block\">"));
        assert!(r.processed.contains("E = mc^2"));
    }

    #[test]
    fn test_inline_math_detected() {
        let r = preprocess_math("The formula $x^2 + y^2 = r^2$ is a circle.");
        assert!(r.has_math);
        assert!(r.processed.contains("<span class=\"math-inline\">"));
    }

    #[test]
    fn test_no_math_unchanged() {
        let r = preprocess_math("Plain text without math.");
        assert!(!r.has_math);
        assert_eq!(r.processed, "Plain text without math.");
    }

    #[test]
    fn test_block_math_not_double_processed() {
        let r = preprocess_math("$$a + b$$");
        assert!(r.processed.contains("<div class=\"math-block\">"));
        assert!(!r.processed.contains("<span class=\"math-inline\">"));
    }

    #[test]
    fn test_math_html_escaping() {
        let r = preprocess_math("$$a < b$$");
        assert!(r.processed.contains("&lt;"));
    }

    #[test]
    fn test_mermaid_block_rendered() {
        let html = "<pre><code class=\"language-mermaid\">graph TD\nA --> B</code></pre>";
        let r = postprocess_mermaid(html);
        assert!(r.has_mermaid);
        assert!(r.processed.contains("<pre class=\"mermaid\">"));
        assert!(r.processed.contains("graph TD"));
        assert!(!r.processed.contains("<code class=\"language-mermaid\">"));
    }

    #[test]
    fn test_non_mermaid_code_unchanged() {
        let html = "<pre><code class=\"language-rust\">fn main() {}</code></pre>";
        let r = postprocess_mermaid(html);
        assert!(!r.has_mermaid);
        assert_eq!(r.processed, html);
    }

    #[test]
    fn test_mermaid_no_flag_for_plain_text() {
        let r = postprocess_mermaid("<p>No diagrams here</p>");
        assert!(!r.has_mermaid);
    }
}
