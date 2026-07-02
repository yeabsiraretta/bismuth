//! Link embed IPC commands — fetch URL metadata for rich embeds.
//!
//! Uses `ureq` for HTTP requests and basic HTML parsing for Open Graph,
//! Twitter Card, and standard meta tags.

use serde::Serialize;

/// Metadata extracted from a URL for rendering a link embed.
#[derive(Debug, Serialize, Clone)]
pub struct UrlMetadata {
    pub url: String,
    pub title: String,
    pub description: String,
    pub image: String,
    pub favicon: String,
    pub site_name: String,
}

/// Fetch metadata from a URL by downloading the HTML and parsing meta tags.
#[tauri::command]
pub async fn fetch_url_metadata(url: String) -> Result<UrlMetadata, String> {
    tokio::task::spawn_blocking(move || fetch_metadata_sync(&url))
        .await
        .map_err(|e| format!("Task join error: {e}"))?
}

fn fetch_metadata_sync(url: &str) -> Result<UrlMetadata, String> {
    let resp = ureq::get(url)
        .set("User-Agent", "Mozilla/5.0 (compatible; BismuthBot/1.0)")
        .timeout(std::time::Duration::from_secs(10))
        .call()
        .map_err(|e| format!("HTTP error: {e}"))?;

    let content_type = resp
        .header("Content-Type")
        .unwrap_or("")
        .to_lowercase();
    if !content_type.contains("text/html") && !content_type.contains("application/xhtml") {
        return Err("URL does not return HTML content".into());
    }

    let body = resp
        .into_string()
        .map_err(|e| format!("Failed to read response body: {e}"))?;

    let mut meta = UrlMetadata {
        url: url.to_string(),
        title: String::new(),
        description: String::new(),
        image: String::new(),
        favicon: String::new(),
        site_name: String::new(),
    };

    // Parse meta tags (og:, twitter:, standard)
    for cap in regex::Regex::new(
        r#"<meta\s+[^>]*(?:property|name)\s*=\s*"([^"]*)"[^>]*content\s*=\s*"([^"]*)"[^>]*/?\s*>"#,
    )
    .unwrap()
    .captures_iter(&body)
    {
        let key = cap[1].to_lowercase();
        let val = html_decode(&cap[2]);
        match key.as_str() {
            "og:title" | "twitter:title" => {
                if meta.title.is_empty() { meta.title = val; }
            }
            "og:description" | "twitter:description" | "description" => {
                if meta.description.is_empty() { meta.description = val; }
            }
            "og:image" | "twitter:image" | "twitter:image:src" => {
                if meta.image.is_empty() { meta.image = resolve_url(url, &val); }
            }
            "og:site_name" => {
                if meta.site_name.is_empty() { meta.site_name = val; }
            }
            _ => {}
        }
    }

    // Also handle reversed attribute order: content before property
    for cap in regex::Regex::new(
        r#"<meta\s+[^>]*content\s*=\s*"([^"]*)"[^>]*(?:property|name)\s*=\s*"([^"]*)"[^>]*/?\s*>"#,
    )
    .unwrap()
    .captures_iter(&body)
    {
        let val = html_decode(&cap[1]);
        let key = cap[2].to_lowercase();
        match key.as_str() {
            "og:title" | "twitter:title" => {
                if meta.title.is_empty() { meta.title = val; }
            }
            "og:description" | "twitter:description" | "description" => {
                if meta.description.is_empty() { meta.description = val; }
            }
            "og:image" | "twitter:image" | "twitter:image:src" => {
                if meta.image.is_empty() { meta.image = resolve_url(url, &val); }
            }
            "og:site_name" => {
                if meta.site_name.is_empty() { meta.site_name = val; }
            }
            _ => {}
        }
    }

    // Fallback: <title>
    if meta.title.is_empty() {
        if let Some(cap) = regex::Regex::new(r"<title[^>]*>([^<]+)</title>")
            .unwrap()
            .captures(&body)
        {
            meta.title = html_decode(&cap[1]).trim().to_string();
        }
    }

    // Favicon: look for <link rel="icon" href="...">
    if let Some(cap) = regex::Regex::new(
        r#"<link\s+[^>]*rel\s*=\s*"(?:icon|shortcut icon)"[^>]*href\s*=\s*"([^"]*)"[^>]*/?\s*>"#,
    )
    .unwrap()
    .captures(&body)
    {
        meta.favicon = resolve_url(url, &html_decode(&cap[1]));
    }
    // Fallback favicon
    if meta.favicon.is_empty() {
        if let Ok(parsed) = url::Url::parse(url) {
            meta.favicon = format!("{}://{}/favicon.ico", parsed.scheme(), parsed.host_str().unwrap_or(""));
        }
    }

    if meta.title.is_empty() {
        return Err("Could not extract metadata from URL".into());
    }

    Ok(meta)
}

/// Resolve a potentially relative URL against a base URL.
fn resolve_url(base: &str, href: &str) -> String {
    if href.starts_with("http://") || href.starts_with("https://") || href.starts_with("//") {
        if href.starts_with("//") {
            return format!("https:{href}");
        }
        return href.to_string();
    }
    if let Ok(base_url) = url::Url::parse(base) {
        if let Ok(resolved) = base_url.join(href) {
            return resolved.to_string();
        }
    }
    href.to_string()
}

/// Basic HTML entity decoding.
fn html_decode(s: &str) -> String {
    s.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&#x27;", "'")
        .replace("&apos;", "'")
}
