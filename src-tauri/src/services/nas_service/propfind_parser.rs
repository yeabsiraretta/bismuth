//! PROPFIND XML parser — extracted from webdav_client.rs per architecture spec.
//! Parses WebDAV multistatus XML responses into RemoteEntry structs.

use std::collections::HashMap;
use super::webdav_client::{RemoteEntry, WebDavError};

/// Parse a WebDAV PROPFIND multistatus XML response into RemoteEntry structs.
pub fn parse_propfind_response(xml: &str) -> Result<Vec<RemoteEntry>, WebDavError> {
    use quick_xml::events::Event;
    use quick_xml::Reader;

    let mut reader = Reader::from_str(xml);
    reader.config_mut().trim_text(true);

    let mut entries: Vec<RemoteEntry> = Vec::new();
    let mut current: HashMap<&'static str, String> = HashMap::new();
    let mut in_response = false;
    let mut in_prop = false;
    let mut current_tag = "";
    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(e)) => {
                let local = e.local_name();
                let name = std::str::from_utf8(local.as_ref()).unwrap_or("");
                match name {
                    "response" => { in_response = true; current.clear(); }
                    "prop" => in_prop = true,
                    "href" | "getcontentlength" | "getlastmodified" | "displayname" => {
                        current_tag = match name {
                            "href" => "href",
                            "getcontentlength" => "content_length",
                            "getlastmodified" => "last_modified",
                            "displayname" => "display_name",
                            _ => "",
                        };
                    }
                    "collection" if in_prop => { current.insert("is_collection", "true".to_string()); }
                    _ => {}
                }
            }
            Ok(Event::Text(e)) if !current_tag.is_empty() => {
                if let Ok(text) = e.decode() { current.insert(current_tag, text.into_owned()); }
                current_tag = "";
            }
            Ok(Event::End(e)) => {
                let local = e.local_name();
                let name = std::str::from_utf8(local.as_ref()).unwrap_or("");
                match name {
                    "response" if in_response => {
                        let href = current.remove("href").unwrap_or_default();
                        let display_name = current.remove("display_name")
                            .unwrap_or_else(|| href.split('/').last().unwrap_or("").to_string());
                        let content_length = current.remove("content_length")
                            .and_then(|s| s.parse().ok()).unwrap_or(0);
                        let last_modified = current.remove("last_modified").unwrap_or_default();
                        let is_collection = current.remove("is_collection")
                            .map(|s| s == "true").unwrap_or(false);
                        if !href.is_empty() {
                            entries.push(RemoteEntry { href, display_name, content_length, last_modified, is_collection });
                        }
                        in_response = false;
                    }
                    "prop" => in_prop = false,
                    _ => { current_tag = ""; }
                }
            }
            Ok(Event::Eof) => break,
            Err(e) => return Err(WebDavError::ParseError(format!("XML parse error: {e}"))),
            _ => {}
        }
        buf.clear();
    }

    Ok(entries)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_file_entry() {
        let xml = r#"<?xml version="1.0"?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/dav/notes/test.md</d:href>
    <d:propstat>
      <d:prop>
        <d:displayname>test.md</d:displayname>
        <d:getcontentlength>1024</d:getcontentlength>
        <d:getlastmodified>Mon, 21 Jun 2026 12:00:00 GMT</d:getlastmodified>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>"#;
        let entries = parse_propfind_response(xml).unwrap();
        assert!(!entries.is_empty());
        assert_eq!(entries[0].href, "/dav/notes/test.md");
        assert!(!entries[0].is_collection);
    }

    #[test]
    fn test_parse_collection_entry() {
        let xml = r#"<?xml version="1.0"?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/dav/notes/</d:href>
    <d:propstat>
      <d:prop>
        <d:displayname>notes</d:displayname>
        <d:resourcetype><d:collection/></d:resourcetype>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>"#;
        let entries = parse_propfind_response(xml).unwrap();
        assert!(!entries.is_empty());
        assert!(entries[0].is_collection);
    }
}
