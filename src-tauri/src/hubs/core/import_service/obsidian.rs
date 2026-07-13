use std::fs;
use std::path::Path;

use regex::Regex;

use crate::infrastructure::error::AppResult;

use super::{collect_files, copy_file, ensure_parent, relative_dest, ImportResult};

pub(super) fn import_obsidian(src: &Path, vault_root: &Path) -> AppResult<ImportResult> {
    use std::sync::OnceLock;
    static WIKILINK: OnceLock<Regex> = OnceLock::new();
    let wikilink_re = WIKILINK.get_or_init(|| Regex::new(r"\[\[([^\]\|]+)(?:\|([^\]]+))?\]\]").unwrap());

    let files = collect_files(src, &["md"]);

    let mut result = ImportResult {
        success: 0,
        failed: 0,
        errors: Vec::new(),
    };

    for file in &files {
        let dest = relative_dest(src, file, vault_root);
        match convert_obsidian_note(file, &dest, &wikilink_re) {
            Ok(()) => result.success += 1,
            Err(e) => {
                result.failed += 1;
                result.errors.push(format!("{}: {e}", file.display()));
            }
        }
    }

    // Copy attachments (images, PDFs, etc.)
    let attachments = collect_files(src, &["png", "jpg", "jpeg", "gif", "svg", "pdf", "webp"]);
    for file in &attachments {
        let dest = relative_dest(src, file, vault_root);
        if let Err(e) = copy_file(file, &dest) {
            result.errors.push(format!("attachment {}: {e}", file.display()));
        }
    }

    tracing::info!(success = result.success, failed = result.failed, "Obsidian import complete");
    Ok(result)
}

fn convert_obsidian_note(src: &Path, dest: &Path, wikilink_re: &Regex) -> AppResult<()> {
    let content = fs::read_to_string(src)?;
    let converted = wikilink_re.replace_all(&content, |caps: &regex::Captures| {
        let target = &caps[1];
        let display = caps.get(2).map_or(target, |m| m.as_str());
        format!("[{display}]({target}.md)")
    });
    ensure_parent(dest)?;
    fs::write(dest, converted.as_ref())?;
    Ok(())
}
