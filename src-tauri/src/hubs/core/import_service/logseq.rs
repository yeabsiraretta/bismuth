use std::fs;
use std::path::Path;

use regex::Regex;

use crate::infrastructure::error::AppResult;

use super::{collect_files, ensure_parent, relative_dest, ImportResult};

pub(super) fn import_logseq(src: &Path, vault_root: &Path) -> AppResult<ImportResult> {
    let pages_dir = src.join("pages");
    let journals_dir = src.join("journals");

    let source_dir = if pages_dir.is_dir() { &pages_dir } else { src };

    let files = collect_files(source_dir, &["md", "org"]);

    let mut result = ImportResult {
        success: 0,
        failed: 0,
        errors: Vec::new(),
    };

    for file in &files {
        let dest = relative_dest(source_dir, file, vault_root).with_extension("md");
        match convert_logseq_note(file, &dest) {
            Ok(()) => result.success += 1,
            Err(e) => {
                result.failed += 1;
                result.errors.push(format!("{}: {e}", file.display()));
            },
        }
    }

    // Import journals if they exist
    if journals_dir.is_dir() {
        let journal_dest = vault_root.join("journal");
        let journal_files = collect_files(&journals_dir, &["md", "org"]);
        for file in &journal_files {
            let dest = relative_dest(&journals_dir, file, &journal_dest).with_extension("md");
            match convert_logseq_note(file, &dest) {
                Ok(()) => result.success += 1,
                Err(e) => {
                    result.failed += 1;
                    result.errors.push(format!("{}: {e}", file.display()));
                },
            }
        }
    }

    tracing::info!(
        success = result.success,
        failed = result.failed,
        "Logseq import complete"
    );
    Ok(result)
}

fn convert_logseq_note(src: &Path, dest: &Path) -> AppResult<()> {
    let content = fs::read_to_string(src)?;
    let is_org = src.extension().and_then(|e| e.to_str()) == Some("org");

    let converted = if is_org {
        convert_org_to_md(&content)
    } else {
        convert_logseq_md(&content)
    };

    ensure_parent(dest)?;
    fs::write(dest, converted)?;
    Ok(())
}

fn convert_logseq_md(content: &str) -> String {
    use std::sync::OnceLock;
    static LG_WIKILINK: OnceLock<Regex> = OnceLock::new();
    static LG_PROPERTY: OnceLock<Regex> = OnceLock::new();
    let wikilink_re = LG_WIKILINK.get_or_init(|| Regex::new(r"\[\[([^\]]+)\]\]").unwrap());
    let property_re = LG_PROPERTY.get_or_init(|| Regex::new(r"^(\w[\w-]*)::(.*)$").unwrap());

    let mut out = String::with_capacity(content.len());

    for line in content.lines() {
        let trimmed = line.trim();

        // Convert Logseq properties (key:: value) to YAML-like frontmatter comments
        if let Some(caps) = property_re.captures(trimmed) {
            out.push_str(&format!("<!-- {}:{} -->\n", &caps[1], &caps[2]));
            continue;
        }

        // Convert outline bullets: Logseq uses `- ` at every level
        // Keep as-is since standard markdown also uses `- `
        let converted = wikilink_re.replace_all(line, |caps: &regex::Captures| {
            let target = &caps[1];
            format!("[{target}]({target}.md)")
        });
        out.push_str(&converted);
        out.push('\n');
    }

    out
}

fn convert_org_to_md(content: &str) -> String {
    use std::sync::OnceLock;
    static ORG_BOLD: OnceLock<Regex> = OnceLock::new();
    static ORG_ITALIC: OnceLock<Regex> = OnceLock::new();
    static ORG_CODE: OnceLock<Regex> = OnceLock::new();
    static ORG_VERBATIM: OnceLock<Regex> = OnceLock::new();
    static ORG_STRIKE: OnceLock<Regex> = OnceLock::new();

    let bold_re =
        ORG_BOLD.get_or_init(|| Regex::new(r"(?<!\w)\*([^\s*](?:[^*]*[^\s*])?)\*(?!\w)").unwrap());
    let italic_re =
        ORG_ITALIC.get_or_init(|| Regex::new(r"(?<!\w)/([^\s/](?:[^/]*[^\s/])?)\/(?!\w)").unwrap());
    let code_re =
        ORG_CODE.get_or_init(|| Regex::new(r"(?<!\w)~([^\s~](?:[^~]*[^\s~])?)~(?!\w)").unwrap());
    let verbatim_re = ORG_VERBATIM
        .get_or_init(|| Regex::new(r"(?<!\w)=([^\s=](?:[^=]*[^\s=])?)=(?!\w)").unwrap());
    let strike_re = ORG_STRIKE
        .get_or_init(|| Regex::new(r"(?<!\w)\+([^\s+](?:[^+]*[^\s+])?)\+(?!\w)").unwrap());

    let mut out = String::with_capacity(content.len());

    for line in content.lines() {
        let trimmed = line.trim();

        if let Some(rest) = trimmed.strip_prefix("**** ") {
            out.push_str(&format!("#### {rest}\n"));
        } else if let Some(rest) = trimmed.strip_prefix("*** ") {
            out.push_str(&format!("### {rest}\n"));
        } else if let Some(rest) = trimmed.strip_prefix("** ") {
            out.push_str(&format!("## {rest}\n"));
        } else if let Some(rest) = trimmed.strip_prefix("* ") {
            out.push_str(&format!("# {rest}\n"));
        } else if trimmed.starts_with("#+TITLE:") {
            let title = trimmed.strip_prefix("#+TITLE:").unwrap().trim();
            out.push_str(&format!("# {title}\n"));
        } else if trimmed.starts_with("#+") {
            continue;
        } else if trimmed == "-----" || trimmed == "---" {
            out.push_str("---\n");
        } else {
            let converted = bold_re.replace_all(line, "**$1**");
            let converted = italic_re.replace_all(&converted, "*$1*");
            let converted = code_re.replace_all(&converted, "`$1`");
            let converted = verbatim_re.replace_all(&converted, "`$1`");
            let converted = strike_re.replace_all(&converted, "~~$1~~");
            out.push_str(&converted);
            out.push('\n');
        }
    }

    out
}
