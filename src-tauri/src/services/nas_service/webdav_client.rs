//! Minimal WebDAV client using ureq (sync, no tokio runtime in blocking thread).
//!
//! Covers all six WebDAV operations: PROPFIND, GET, PUT, MKCOL, DELETE, MOVE.
//! Content-Type is validated on GET before returning bytes (SSRF mitigation).
//! PUT enforces a 500 MB size limit.
//!
//! All async methods use tokio::task::spawn_blocking internally.

use percent_encoding::{utf8_percent_encode, NON_ALPHANUMERIC};

/// A parsed remote WebDAV entry from a PROPFIND response.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoteEntry {
    pub href: String,
    pub display_name: String,
    pub content_length: u64,
    pub last_modified: String,
    pub is_collection: bool,
}

/// Errors returned by WebDAV client operations.
#[derive(Debug, thiserror::Error)]
pub enum WebDavError {
    #[error("Not found: {0}")]
    NotFound(String),
    #[error("Unauthorized")]
    Unauthorized,
    #[error("Server error {0}: {1}")]
    ServerError(u16, String),
    #[error("Parse error: {0}")]
    ParseError(String),
    #[error("Size limit exceeded")]
    SizeLimitExceeded,
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("HTTP error: {0}")]
    Http(String),
    #[error("Task join error")]
    Join,
}

impl From<Box<dyn std::any::Any + Send>> for WebDavError {
    fn from(_: Box<dyn std::any::Any + Send>) -> Self { WebDavError::Join }
}

/// Content-Type allowlist for vault files.
fn is_allowed_content_type(ct: &str) -> bool {
    let ct = ct.split(';').next().unwrap_or("").trim().to_lowercase();
    matches!(ct.as_str(), "text/plain" | "text/markdown" | "application/json" | "application/octet-stream")
        || ct.starts_with("image/") || ct.starts_with("video/") || ct.starts_with("audio/")
}

/// Maximum single-file size before size-warning is triggered.
const MAX_AUTO_SIZE_BYTES: u64 = 500 * 1024 * 1024;

/// Minimal WebDAV client using ureq (sync HTTP, no reqwest).
/// password is used in request auth only — never logged.
#[derive(Clone)]
pub struct WebDavClient {
    base_url: String,
    username: String,
    password: String, // used in Basic auth only — never logged
}

impl WebDavClient {
    pub fn new(base_url: String, username: String, password: String) -> Self {
        Self {
            base_url: base_url.trim_end_matches('/').to_string(),
            username,
            password,
        }
    }

    fn url(&self, path: &str) -> String {
        let encoded = utf8_percent_encode(path.trim_start_matches('/'), NON_ALPHANUMERIC);
        format!("{}/{}", self.base_url, encoded)
    }

    fn basic_auth_header(&self) -> String {
        let credentials = format!("{}:{}", self.username, self.password);
        let bytes = credentials.as_bytes();
        let table = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        let mut out = String::new();
        for chunk in bytes.chunks(3) {
            let b0 = chunk[0] as u32;
            let b1 = if chunk.len() > 1 { chunk[1] as u32 } else { 0 };
            let b2 = if chunk.len() > 2 { chunk[2] as u32 } else { 0 };
            let val = (b0 << 16) | (b1 << 8) | b2;
            out.push(table[((val >> 18) & 63) as usize] as char);
            out.push(table[((val >> 12) & 63) as usize] as char);
            out.push(if chunk.len() > 1 { table[((val >> 6) & 63) as usize] as char } else { '=' });
            out.push(if chunk.len() > 2 { table[(val & 63) as usize] as char } else { '=' });
        }
        format!("Basic {}", out)
    }

    /// PROPFIND — list or stat a remote path.
    pub async fn propfind(&self, path: &str, depth: u8) -> Result<Vec<RemoteEntry>, WebDavError> {
        let url = self.url(path);
        let auth = self.basic_auth_header();
        let depth_val = depth.to_string();
        tokio::task::spawn_blocking(move || {
            let body = r#"<?xml version="1.0"?><d:propfind xmlns:d="DAV:"><d:prop><d:getcontentlength/><d:getlastmodified/><d:displayname/><d:resourcetype/></d:prop></d:propfind>"#;
            let resp = ureq::request("PROPFIND", &url)
                .set("Authorization", &auth)
                .set("Depth", &depth_val)
                .set("Content-Type", "application/xml")
                .send_string(body);
            match resp {
                Ok(r) => {
                    let status = r.status();
                    let text = r.into_string().unwrap_or_default();
                    if status == 207 {
                        crate::services::nas_service::propfind_parser::parse_propfind_response(&text)
                    } else if status == 401 {
                        Err(WebDavError::Unauthorized)
                    } else if status == 404 {
                        Err(WebDavError::NotFound(url))
                    } else {
                        Err(WebDavError::ServerError(status, text))
                    }
                }
                Err(e) => Err(WebDavError::Http(e.to_string())),
            }
        }).await.map_err(|_| WebDavError::Join)?
    }

    /// GET — download file with Content-Type validation.
    pub async fn get(&self, path: &str) -> Result<Vec<u8>, WebDavError> {
        let url = self.url(path);
        let auth = self.basic_auth_header();
        tokio::task::spawn_blocking(move || {
            let resp = ureq::get(&url)
                .set("Authorization", &auth)
                .call();
            match resp {
                Ok(r) => {
                    let status = r.status();
                    let ct = r.header("content-type").unwrap_or("application/octet-stream").to_string();
                    if !is_allowed_content_type(&ct) {
                        return Err(WebDavError::ParseError("unexpected_content_type".to_string()));
                    }
                    if status == 200 {
                        use std::io::Read;
                        let mut bytes = Vec::new();
                        r.into_reader().read_to_end(&mut bytes).map_err(WebDavError::Io)?;
                        Ok(bytes)
                    } else if status == 401 {
                        Err(WebDavError::Unauthorized)
                    } else if status == 404 {
                        Err(WebDavError::NotFound(url))
                    } else {
                        Err(WebDavError::ServerError(status, String::new()))
                    }
                }
                Err(e) => Err(WebDavError::Http(e.to_string())),
            }
        }).await.map_err(|_| WebDavError::Join)?
    }

    /// PUT — upload file. Rejects content >500 MB.
    pub async fn put(&self, path: &str, content: Vec<u8>, content_type: &str) -> Result<(), WebDavError> {
        if content.len() as u64 > MAX_AUTO_SIZE_BYTES {
            return Err(WebDavError::SizeLimitExceeded);
        }
        let url = self.url(path);
        let auth = self.basic_auth_header();
        let ct = content_type.to_string();
        tokio::task::spawn_blocking(move || {
            let resp = ureq::put(&url)
                .set("Authorization", &auth)
                .set("Content-Type", &ct)
                .send_bytes(&content);
            match resp {
                Ok(r) => {
                    let status = r.status();
                    if matches!(status, 200 | 201 | 204) { Ok(()) }
                    else if status == 401 { Err(WebDavError::Unauthorized) }
                    else { Err(WebDavError::ServerError(status, r.into_string().unwrap_or_default())) }
                }
                Err(e) => Err(WebDavError::Http(e.to_string())),
            }
        }).await.map_err(|_| WebDavError::Join)?
    }

    /// MKCOL — create collection, tolerate 405 (already exists).
    pub async fn mkcol(&self, path: &str) -> Result<(), WebDavError> {
        let url = self.url(path);
        let auth = self.basic_auth_header();
        tokio::task::spawn_blocking(move || {
            let resp = ureq::request("MKCOL", &url)
                .set("Authorization", &auth)
                .call();
            match resp {
                Ok(r) => {
                    let status = r.status();
                    if matches!(status, 200 | 201 | 204 | 405) { Ok(()) }
                    else if status == 401 { Err(WebDavError::Unauthorized) }
                    else { Err(WebDavError::ServerError(status, r.into_string().unwrap_or_default())) }
                }
                Err(e) => Err(WebDavError::Http(e.to_string())),
            }
        }).await.map_err(|_| WebDavError::Join)?
    }

    /// DELETE — delete remote file or collection.
    pub async fn delete(&self, path: &str) -> Result<(), WebDavError> {
        let url = self.url(path);
        let auth = self.basic_auth_header();
        tokio::task::spawn_blocking(move || {
            let resp = ureq::delete(&url)
                .set("Authorization", &auth)
                .call();
            match resp {
                Ok(r) => {
                    let status = r.status();
                    if matches!(status, 200 | 204) { Ok(()) }
                    else if status == 401 { Err(WebDavError::Unauthorized) }
                    else if status == 404 { Err(WebDavError::NotFound(url)) }
                    else { Err(WebDavError::ServerError(status, r.into_string().unwrap_or_default())) }
                }
                Err(e) => Err(WebDavError::Http(e.to_string())),
            }
        }).await.map_err(|_| WebDavError::Join)?
    }

    /// MOVE — rename/move resource.
    pub async fn move_resource(&self, src: &str, dst: &str, overwrite: bool) -> Result<(), WebDavError> {
        let src_url = self.url(src);
        let dst_url = self.url(dst);
        let auth = self.basic_auth_header();
        let overwrite_val = if overwrite { "T" } else { "F" };
        tokio::task::spawn_blocking(move || {
            let resp = ureq::request("MOVE", &src_url)
                .set("Authorization", &auth)
                .set("Destination", &dst_url)
                .set("Overwrite", overwrite_val)
                .call();
            match resp {
                Ok(r) => {
                    let status = r.status();
                    if matches!(status, 200 | 201 | 204) { Ok(()) }
                    else if status == 401 { Err(WebDavError::Unauthorized) }
                    else if status == 404 { Err(WebDavError::NotFound(src_url)) }
                    else { Err(WebDavError::ServerError(status, r.into_string().unwrap_or_default())) }
                }
                Err(e) => Err(WebDavError::Http(e.to_string())),
            }
        }).await.map_err(|_| WebDavError::Join)?
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_allowed_content_types() {
        assert!(is_allowed_content_type("text/plain"));
        assert!(is_allowed_content_type("text/markdown"));
        assert!(is_allowed_content_type("application/json"));
        assert!(is_allowed_content_type("application/octet-stream"));
        assert!(is_allowed_content_type("image/jpeg"));
        assert!(is_allowed_content_type("video/mp4"));
        assert!(is_allowed_content_type("text/plain; charset=utf-8"));
    }

    #[test]
    fn test_rejected_content_types() {
        assert!(!is_allowed_content_type("application/x-executable"));
        assert!(!is_allowed_content_type("application/x-httpd-php"));
        assert!(!is_allowed_content_type("text/html"));
        assert!(!is_allowed_content_type("application/javascript"));
    }
}
