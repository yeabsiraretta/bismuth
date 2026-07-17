use std::fs;
use std::path::Path;

use crate::infrastructure::error::{AppError, AppResult};

use super::notion::html_to_markdown;
use super::{collect_files, ensure_parent, sanitize_filename, ImportResult};

pub(super) fn import_evernote(src: &Path, vault_root: &Path) -> AppResult<ImportResult> {
    let enex_files = if src.is_file() && src.extension().and_then(|e| e.to_str()) == Some("enex") {
        vec![src.to_path_buf()]
    } else {
        collect_files(src, &["enex"])
    };

    if enex_files.is_empty() {
        return Err(AppError::Custom(
            "No .enex files found in source path".into(),
        ));
    }

    let mut result = ImportResult {
        success: 0,
        failed: 0,
        errors: Vec::new(),
    };

    for enex_file in &enex_files {
        match import_enex_file(enex_file, vault_root) {
            Ok((s, f, errs)) => {
                result.success += s;
                result.failed += f;
                result.errors.extend(errs);
            },
            Err(e) => {
                result.failed += 1;
                result.errors.push(format!("{}: {e}", enex_file.display()));
            },
        }
    }

    tracing::info!(
        success = result.success,
        failed = result.failed,
        "Evernote import complete"
    );
    Ok(result)
}

fn import_enex_file(src: &Path, vault_root: &Path) -> AppResult<(u32, u32, Vec<String>)> {
    use quick_xml::events::Event;
    use quick_xml::reader::Reader;

    let xml = fs::read_to_string(src)?;
    let mut reader = Reader::from_str(&xml);

    let mut success = 0u32;
    let mut failed = 0u32;
    let mut errors = Vec::new();

    let mut in_note = false;
    let mut in_title = false;
    let mut in_content = false;
    let mut title = String::new();
    let mut content_html = String::new();
    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(ref e)) => match e.name().as_ref() {
                b"note" => {
                    in_note = true;
                    title.clear();
                    content_html.clear();
                },
                b"title" if in_note => in_title = true,
                b"content" if in_note => in_content = true,
                _ => {},
            },
            Ok(Event::End(ref e)) => match e.name().as_ref() {
                b"note" if in_note => {
                    in_note = false;
                    let note_title = if title.is_empty() {
                        "Untitled".to_string()
                    } else {
                        title.clone()
                    };
                    let safe_name = sanitize_filename(&note_title);
                    let dest = vault_root.join(format!("{safe_name}.md"));

                    // Strip CDATA wrapper if present
                    let html = content_html
                        .trim()
                        .strip_prefix("<![CDATA[")
                        .and_then(|s| s.strip_suffix("]]>"))
                        .unwrap_or(&content_html);

                    let md = format!("# {note_title}\n\n{}", html_to_markdown(html));
                    match (|| -> AppResult<()> {
                        ensure_parent(&dest)?;
                        fs::write(&dest, md)?;
                        Ok(())
                    })() {
                        Ok(()) => success += 1,
                        Err(e) => {
                            failed += 1;
                            errors.push(format!("{note_title}: {e}"));
                        },
                    }
                },
                b"title" => in_title = false,
                b"content" => in_content = false,
                _ => {},
            },
            Ok(Event::Text(ref e)) => {
                if in_title {
                    title.push_str(&e.unescape().unwrap_or_default());
                } else if in_content {
                    content_html.push_str(&e.unescape().unwrap_or_default());
                }
            },
            Ok(Event::CData(ref e)) => {
                if in_content {
                    content_html.push_str(&String::from_utf8_lossy(e.as_ref()));
                }
            },
            Ok(Event::Eof) => break,
            Err(e) => {
                return Err(AppError::Custom(format!(
                    "XML parse error at position {}: {e}",
                    reader.error_position()
                )));
            },
            _ => {},
        }
        buf.clear();
    }

    Ok((success, failed, errors))
}
