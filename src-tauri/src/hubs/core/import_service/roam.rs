use std::fs;
use std::path::Path;

use regex::Regex;
use serde::Deserialize;

use crate::infrastructure::error::{AppError, AppResult};

use super::{collect_files, ensure_parent, sanitize_filename, ImportResult};

pub(super) fn import_roam(src: &Path, vault_root: &Path) -> AppResult<ImportResult> {
    let json_files = if src.is_file() && src.extension().and_then(|e| e.to_str()) == Some("json") {
        vec![src.to_path_buf()]
    } else {
        collect_files(src, &["json"])
    };

    if json_files.is_empty() {
        return Err(AppError::Custom(
            "No JSON files found in source path".into(),
        ));
    }

    let mut result = ImportResult {
        success: 0,
        failed: 0,
        errors: Vec::new(),
    };

    for json_file in &json_files {
        match import_roam_json(json_file, vault_root) {
            Ok(count) => result.success += count,
            Err(e) => {
                result.failed += 1;
                result.errors.push(format!("{}: {e}", json_file.display()));
            }
        }
    }

    tracing::info!(success = result.success, failed = result.failed, "Roam import complete");
    Ok(result)
}

#[derive(Deserialize)]
struct RoamPage {
    title: Option<String>,
    children: Option<Vec<RoamBlock>>,
}

#[derive(Deserialize)]
struct RoamBlock {
    string: Option<String>,
    children: Option<Vec<RoamBlock>>,
}

fn import_roam_json(src: &Path, vault_root: &Path) -> AppResult<u32> {
    use std::sync::OnceLock;
    static ROAM_WIKILINK: OnceLock<Regex> = OnceLock::new();

    let data = fs::read_to_string(src)?;
    let pages: Vec<RoamPage> = serde_json::from_str(&data)?;
    let mut count = 0u32;

    for page in &pages {
        let title = page.title.as_deref().unwrap_or("Untitled");
        let safe_title = sanitize_filename(title);
        let dest = vault_root.join(format!("{safe_title}.md"));

        let mut md = format!("# {title}\n\n");
        if let Some(children) = &page.children {
            render_roam_blocks(children, 0, &mut md);
        }

        // Convert Roam [[links]] to standard markdown
        let wikilink_re = ROAM_WIKILINK.get_or_init(|| Regex::new(r"\[\[([^\]]+)\]\]").unwrap());
        let md = wikilink_re.replace_all(&md, |caps: &regex::Captures| {
            let target = &caps[1];
            format!("[{target}]({target}.md)")
        });

        ensure_parent(&dest)?;
        fs::write(&dest, md.as_ref())?;
        count += 1;
    }

    Ok(count)
}

fn render_roam_blocks(blocks: &[RoamBlock], depth: usize, out: &mut String) {
    let indent = "  ".repeat(depth);
    for block in blocks {
        if let Some(text) = &block.string {
            out.push_str(&format!("{indent}- {text}\n"));
        }
        if let Some(children) = &block.children {
            render_roam_blocks(children, depth + 1, out);
        }
    }
}
