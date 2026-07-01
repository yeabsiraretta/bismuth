//! Callout/admonition block parsing and rendering for published notes.
//!
//! Parses Obsidian-style callouts: `> [!type] Title` followed by quoted body lines.
//! Supports types: info, warning, danger, tip, note, question, success, abstract, bug, example, quote.

/// Parsed callout block.
pub struct Callout {
    pub callout_type: String,
    pub title: String,
    pub body_lines: Vec<String>,
}

/// Checks if a blockquote line starts a callout.
/// Returns (callout_type, title) if it matches `[!type] Optional Title`.
pub fn parse_callout_start(line: &str) -> Option<(String, String)> {
    let trimmed = line.trim();
    if !trimmed.starts_with("[!") {
        return None;
    }
    let end_bracket = trimmed.find(']')?;
    let callout_type = trimmed[2..end_bracket].to_lowercase();

    // Validate known types
    if !is_valid_callout_type(&callout_type) {
        return None;
    }

    let title = trimmed[end_bracket + 1..].trim().to_string();
    let title = if title.is_empty() {
        capitalize(&callout_type)
    } else {
        title
    };

    Some((callout_type, title))
}

/// Renders a callout block to HTML.
pub fn render_callout(callout: &Callout) -> String {
    let icon = callout_icon(&callout.callout_type);
    let mut html = format!(
        "<div class=\"callout callout-{}\">\n  <div class=\"callout-title\">{} {}</div>\n",
        callout.callout_type, icon, super::renderer::html_escape(&callout.title)
    );

    if !callout.body_lines.is_empty() {
        html.push_str("  <div class=\"callout-body\">\n");
        for line in &callout.body_lines {
            if line.is_empty() {
                html.push_str("    <br>\n");
            } else {
                html.push_str(&format!("    <p>{}</p>\n", line));
            }
        }
        html.push_str("  </div>\n");
    }

    html.push_str("</div>\n");
    html
}

/// Returns the SVG icon markup for a callout type.
fn callout_icon(callout_type: &str) -> &'static str {
    match callout_type {
        "info" => "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><line x1=\"12\" y1=\"16\" x2=\"12\" y2=\"12\"/><line x1=\"12\" y1=\"8\" x2=\"12.01\" y2=\"8\"/></svg>",
        "warning" | "caution" => "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z\"/><line x1=\"12\" y1=\"9\" x2=\"12\" y2=\"13\"/><line x1=\"12\" y1=\"17\" x2=\"12.01\" y2=\"17\"/></svg>",
        "danger" | "error" => "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><line x1=\"15\" y1=\"9\" x2=\"9\" y2=\"15\"/><line x1=\"9\" y1=\"9\" x2=\"15\" y2=\"15\"/></svg>",
        "tip" | "hint" => "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z\"/></svg>",
        "note" => "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><line x1=\"18\" y1=\"2\" x2=\"22\" y2=\"6\"/><path d=\"M7.5 20.5L19 9l-4-4L3.5 16.5 2 22z\"/></svg>",
        "question" | "faq" => "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3\"/><line x1=\"12\" y1=\"17\" x2=\"12.01\" y2=\"17\"/></svg>",
        "success" | "done" | "check" => "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M22 11.08V12a10 10 0 1 1-5.93-9.14\"/><polyline points=\"22 4 12 14.01 9 11.01\"/></svg>",
        "abstract" | "summary" | "tldr" => "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><line x1=\"17\" y1=\"10\" x2=\"3\" y2=\"10\"/><line x1=\"21\" y1=\"6\" x2=\"3\" y2=\"6\"/><line x1=\"21\" y1=\"14\" x2=\"3\" y2=\"14\"/><line x1=\"17\" y1=\"18\" x2=\"3\" y2=\"18\"/></svg>",
        "bug" => "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><rect x=\"8\" y=\"6\" width=\"8\" height=\"14\" rx=\"4\"/><path d=\"M19 10h2M3 10h2M19 14h2M3 14h2M16 6l2-2M8 6L6 4\"/></svg>",
        "example" => "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><line x1=\"8\" y1=\"6\" x2=\"21\" y2=\"6\"/><line x1=\"8\" y1=\"12\" x2=\"21\" y2=\"12\"/><line x1=\"8\" y1=\"18\" x2=\"21\" y2=\"18\"/><line x1=\"3\" y1=\"6\" x2=\"3.01\" y2=\"6\"/><line x1=\"3\" y1=\"12\" x2=\"3.01\" y2=\"12\"/><line x1=\"3\" y1=\"18\" x2=\"3.01\" y2=\"18\"/></svg>",
        "quote" | "cite" => "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z\"/><path d=\"M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z\"/></svg>",
        _ => "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><line x1=\"12\" y1=\"16\" x2=\"12\" y2=\"12\"/><line x1=\"12\" y1=\"8\" x2=\"12.01\" y2=\"8\"/></svg>",
    }
}

fn is_valid_callout_type(t: &str) -> bool {
    matches!(
        t,
        "info" | "warning" | "caution" | "danger" | "error" | "tip" | "hint"
            | "note" | "question" | "faq" | "success" | "done" | "check"
            | "abstract" | "summary" | "tldr" | "bug" | "example" | "quote" | "cite"
    )
}

fn capitalize(s: &str) -> String {
    let mut c = s.chars();
    match c.next() {
        None => String::new(),
        Some(f) => f.to_uppercase().collect::<String>() + c.as_str(),
    }
}

/// CSS for callouts.
pub fn callout_css() -> &'static str {
    r#"
.callout { border-left: 4px solid var(--accent); border-radius: 4px; padding: 0.75rem 1rem; margin: 1rem 0; background: var(--code-bg); }
.callout-title { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; margin-bottom: 0.5rem; }
.callout-body p { margin: 0.25rem 0; }
.callout-info { border-color: #3b82f6; }
.callout-warning, .callout-caution { border-color: #f59e0b; }
.callout-danger, .callout-error { border-color: #ef4444; }
.callout-tip, .callout-hint { border-color: #10b981; }
.callout-note { border-color: #6366f1; }
.callout-question, .callout-faq { border-color: #8b5cf6; }
.callout-success, .callout-done, .callout-check { border-color: #22c55e; }
.callout-abstract, .callout-summary, .callout-tldr { border-color: #06b6d4; }
.callout-bug { border-color: #f43f5e; }
.callout-example { border-color: #a855f7; }
.callout-quote, .callout-cite { border-color: var(--muted); }
"#
}
