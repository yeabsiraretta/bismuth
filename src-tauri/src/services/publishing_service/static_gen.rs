//! Static site generation — writes rendered HTML files to the output directory.

use super::callouts;
use super::canvas_renderer;
use super::footnotes;
use super::navigation::{self, build_navigation};
use super::renderer::render_to_html;
use super::renderer_extensions;
use super::search_index;
use super::toc;
use super::{PublishConfig, PublishableNote};
use crate::error::{BismuthError, Result};
use crate::models::canvas::CanvasDocument;
use std::fs;
use std::path::Path;

/// Generates the full static site from publishable notes and canvases.
pub fn generate_site(
    notes: &[PublishableNote],
    config: &PublishConfig,
    canvases: &[CanvasDocument],
    note_canvas_map: &[(String, String)],
) -> Result<u32> {
    let output = &config.output_dir;

    // Ensure output directory exists
    fs::create_dir_all(output)
        .map_err(|e| BismuthError::Generic(format!("Cannot create output dir: {}", e)))?;

    // Build navigation data
    let nav_data = build_navigation(notes);
    let slugs: Vec<String> = notes.iter().map(|n| n.slug.clone()).collect();

    let mut count = 0u32;

    for note in notes {
        let mut body_html = render_to_html(note, &slugs);

        // Embed linked canvases into the note body
        let linked_canvas_ids: Vec<&str> = note_canvas_map
            .iter()
            .filter(|(note_path, _)| note_path == &note.path)
            .map(|(_, canvas_id)| canvas_id.as_str())
            .collect();
        for canvas_id in &linked_canvas_ids {
            if let Some(canvas) = canvases.iter().find(|c| c.id == *canvas_id) {
                body_html.push_str(&canvas_renderer::render_canvas_html(canvas));
            }
        }

        let backlinks = nav_data.backlinks.get(&note.slug);
        let breadcrumbs = navigation::breadcrumb_for(note);
        let page_html = wrap_page(note, &body_html, backlinks, &breadcrumbs, config);

        let filename = if note.is_home {
            "index.html".to_string()
        } else {
            format!("{}.html", note.slug)
        };

        let dest = output.join(&filename);
        fs::write(&dest, page_html)
            .map_err(|e| BismuthError::Generic(format!("Write failed: {}", e)))?;
        count += 1;
    }

    // Generate standalone canvas pages
    for canvas in canvases {
        let canvas_html = render_standalone_canvas(canvas, config);
        let slug = canvas.name.to_lowercase().replace(' ', "-");
        let dest = output.join(format!("canvas-{}.html", slug));
        fs::write(&dest, canvas_html)
            .map_err(|e| BismuthError::Generic(format!("Canvas write failed: {}", e)))?;
        count += 1;
    }

    // Write assets
    write_default_css(output)?;
    write_nav_index(notes, output)?;
    search_index::write_search_index(notes, output)?;
    write_graph_data(&nav_data.graph, output)?;
    write_search_js(output)?;

    Ok(count)
}

/// Renders a canvas document as a standalone published HTML page.
fn render_standalone_canvas(canvas: &CanvasDocument, config: &PublishConfig) -> String {
    let title = super::renderer::html_escape(&canvas.name);
    let body = canvas_renderer::render_canvas_html(canvas);
    format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <meta property="og:title" content="{title}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="{base}/canvas-{slug}.html">
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div class="canvas-standalone">
    <h1>{title}</h1>
    {body}
  </div>
  <script src="/search.js"></script>
</body>
</html>"#,
        title = title,
        base = config.base_url.trim_end_matches('/'),
        slug = canvas.name.to_lowercase().replace(' ', "-"),
        body = body,
    )
}

/// Wraps rendered body HTML in a full page template with nav, backlinks, meta.
fn wrap_page(
    note: &PublishableNote,
    body: &str,
    backlinks: Option<&Vec<navigation::BacklinkEntry>>,
    breadcrumbs: &[(String, String)],
    config: &PublishConfig,
) -> String {
    let mut html = String::new();

    // Head
    html.push_str(&format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <meta property="og:title" content="{title}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="{base}/{slug}.html">
  <link rel="stylesheet" href="/style.css">
  <script src="https://cdn.jsdelivr.net/npm/fuse.js@7.0.0"></script>
</head>
<body>
"#,
        title = super::renderer::html_escape(&note.title),
        base = config.base_url.trim_end_matches('/'),
        slug = note.slug,
    ));

    // Breadcrumbs
    if breadcrumbs.len() > 1 {
        html.push_str("<nav class=\"breadcrumbs\">");
        for (i, (name, slug)) in breadcrumbs.iter().enumerate() {
            if i > 0 {
                html.push_str(" / ");
            }
            if slug.is_empty() {
                html.push_str(name);
            } else {
                html.push_str(&format!("<a href=\"/{}.html\">{}</a>", slug, name));
            }
        }
        html.push_str("</nav>\n");
    }

    // Timestamps
    if note.created.is_some() || note.updated.is_some() {
        html.push_str("<div class=\"timestamps\">");
        if let Some(ref c) = note.created {
            html.push_str(&format!("Created: {} ", c));
        }
        if let Some(ref u) = note.updated {
            html.push_str(&format!("Updated: {}", u));
        }
        html.push_str("</div>\n");
    }

    // Main content
    html.push_str(&format!(
        "<article class=\"note-content\">\n{}\n</article>\n",
        body
    ));

    // Backlinks section
    if let Some(links) = backlinks {
        if !links.is_empty() {
            html.push_str("<section class=\"backlinks\">\n<h3>Backlinks</h3>\n<ul>\n");
            for link in links {
                html.push_str(&format!(
                    "  <li><a href=\"/{}.html\">{}</a></li>\n",
                    link.slug, link.title
                ));
            }
            html.push_str("</ul>\n</section>\n");
        }
    }

    // Tags
    if !note.tags.is_empty() {
        html.push_str("<div class=\"tags\">");
        for tag in &note.tags {
            html.push_str(&format!("<span class=\"tag\">#{}</span> ", tag));
        }
        html.push_str("</div>\n");
    }

    html.push_str("<script src=\"/search.js\"></script>\n</body>\n</html>");
    html
}

fn write_default_css(output: &Path) -> Result<()> {
    let base_css = r#"
:root { --bg: #fff; --text: #1a1a1a; --accent: #3b82f6; --muted: #6b7280; --code-bg: #f3f4f6; --border: #e5e7eb; --mark-bg: rgba(255, 208, 0, 0.4); }
@media (prefers-color-scheme: dark) { :root { --bg: #1a1a2e; --text: #e4e4e7; --accent: #60a5fa; --muted: #9ca3af; --code-bg: #2a2a3e; --border: #3a3a5a; --mark-bg: rgba(255, 208, 0, 0.25); } }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 720px; margin: 0 auto; padding: 2rem; background: var(--bg); color: var(--text); line-height: 1.6; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 600; }
pre { background: var(--code-bg); padding: 1rem; border-radius: 6px; overflow-x: auto; }
code { font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.9em; }
p code { background: var(--code-bg); padding: 2px 5px; border-radius: 3px; }
blockquote { border-left: 3px solid var(--accent); margin: 1em 0; padding: 0.5em 1em; color: var(--muted); font-style: italic; }
hr { border: none; border-top: 1px solid var(--border); margin: 2em 0; }
ul, ol { padding-left: 1.5em; margin: 0.5em 0; }
.task-list { list-style: none; padding-left: 0; }
.task-item { display: flex; align-items: baseline; gap: 0.5em; }
del { opacity: 0.6; }
mark { background: var(--mark-bg); padding: 1px 3px; border-radius: 2px; }
img { max-width: 100%; height: auto; border-radius: 6px; margin: 1em 0; }
.breadcrumbs { font-size: 0.85em; color: var(--muted); margin-bottom: 1rem; }
.timestamps { font-size: 0.8em; color: var(--muted); margin-bottom: 1.5rem; }
.backlinks { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid var(--border); }
.backlinks h3 { font-size: 1em; color: var(--muted); }
.tags { margin-top: 1rem; }
.tag { display: inline-block; font-size: 0.8em; padding: 2px 8px; border-radius: 12px; background: var(--code-bg); color: var(--muted); margin-right: 4px; }
"#;
    let full_css = format!(
        "{}{}{}{}{}{}",
        base_css.trim(),
        callouts::callout_css(),
        renderer_extensions::extensions_css(),
        footnotes::footnotes_css(),
        toc::toc_css(),
        canvas_renderer::canvas_css()
    );
    fs::write(output.join("style.css"), full_css)
        .map_err(|e| BismuthError::Generic(format!("CSS write failed: {}", e)))?;
    Ok(())
}

fn write_nav_index(notes: &[PublishableNote], output: &Path) -> Result<()> {
    let mut nav_html = String::from("<nav><ul>\n");
    let pinned: Vec<&PublishableNote> = notes.iter().filter(|n| n.pinned).collect();
    let rest: Vec<&PublishableNote> = notes.iter().filter(|n| !n.pinned && !n.is_home).collect();

    for note in pinned.iter().chain(rest.iter()) {
        nav_html.push_str(&format!(
            "  <li><a href=\"/{}.html\">{}</a></li>\n",
            note.slug, note.title
        ));
    }
    nav_html.push_str("</ul></nav>\n");

    fs::write(output.join("_nav.html"), nav_html)
        .map_err(|e| BismuthError::Generic(format!("Nav write failed: {}", e)))?;
    Ok(())
}

fn write_graph_data(graph: &navigation::GraphData, output: &Path) -> Result<()> {
    let json = serde_json::to_string(graph)
        .map_err(|e| BismuthError::Generic(format!("Graph JSON failed: {}", e)))?;
    fs::write(output.join("graph.json"), json)
        .map_err(|e| BismuthError::Generic(format!("Graph write failed: {}", e)))?;
    Ok(())
}

fn write_search_js(output: &Path) -> Result<()> {
    let js = r#"(function(){
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  if (!input || !results) return;
  let fuse = null;
  fetch('/search-index.json').then(r => r.json()).then(data => {
    fuse = new Fuse(data, { keys: ['title', 'excerpt', 'tags'], threshold: 0.3 });
  });
  input.addEventListener('input', function() {
    if (!fuse) return;
    const q = this.value.trim();
    if (!q) { results.innerHTML = ''; return; }
    const hits = fuse.search(q).slice(0, 8);
    results.innerHTML = hits.map(h =>
      `<a href="/${h.item.slug}.html" class="search-hit"><strong>${h.item.title}</strong><span>${h.item.excerpt.slice(0,60)}</span></a>`
    ).join('');
  });
})();"#;
    fs::write(output.join("search.js"), js)
        .map_err(|e| BismuthError::Generic(format!("Search JS write failed: {}", e)))?;
    Ok(())
}
