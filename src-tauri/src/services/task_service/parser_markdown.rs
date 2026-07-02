//! Markdown structure helpers for the task parser.
//!
//! Provides heading extraction, heading-to-task association,
//! project inference, and metadata text cleanup.

use super::parser_types::{
    CANCELLED_DATE_RE, CREATED_RE, DEPENDS_RE, DONE_DATE_RE, DUE_RE, ID_RE, ON_COMPLETION_RE,
    PRIORITY_EMOJI_RE, RECURRENCE_RE, SCHEDULED_RE, START_RE,
};

pub type HeadingEntry = (usize, String);

/// Extract all headings with their line positions.
pub fn extract_headings(content: &str) -> Vec<HeadingEntry> {
    content
        .lines()
        .enumerate()
        .filter_map(|(idx, line)| {
            let trimmed = line.trim_start();
            if trimmed.starts_with('#') {
                let text = trimmed.trim_start_matches('#').trim().to_string();
                Some((idx, text))
            } else {
                None
            }
        })
        .collect()
}

/// Find the nearest heading above a given line index.
pub fn find_heading_for_line(line_idx: usize, headings: &[HeadingEntry]) -> Option<String> {
    headings
        .iter()
        .rev()
        .find(|(h_line, _)| *h_line < line_idx)
        .map(|(_, text)| text.clone())
}

/// Extract project name from file path (first folder segment, or None for flat files).
pub fn extract_project(path: &str) -> Option<String> {
    let parts: Vec<&str> = path.split('/').collect();
    if parts.len() > 1 {
        Some(parts[0].to_string())
    } else {
        None
    }
}

/// Remove all metadata emoji markers from task text for clean display.
pub fn clean_task_text(text: &str) -> String {
    let mut result = text.to_string();

    for re in [
        &*DUE_RE,
        &*SCHEDULED_RE,
        &*START_RE,
        &*DONE_DATE_RE,
        &*CREATED_RE,
        &*CANCELLED_DATE_RE,
    ] {
        result = re.replace_all(&result, "").to_string();
    }

    result = RECURRENCE_RE.replace_all(&result, "").to_string();
    result = ID_RE.replace_all(&result, "").to_string();
    result = DEPENDS_RE.replace_all(&result, "").to_string();
    result = ON_COMPLETION_RE.replace_all(&result, "").to_string();
    result = PRIORITY_EMOJI_RE.replace_all(&result, "").to_string();

    if result.starts_with("!! ") {
        result = result[3..].to_string();
    } else if result.starts_with("! ") {
        result = result[2..].to_string();
    }

    // Collapse multiple spaces left by removed metadata
    let mut prev_space = false;
    result
        .trim()
        .chars()
        .filter(|c| {
            if *c == ' ' {
                if prev_space {
                    return false;
                }
                prev_space = true;
            } else {
                prev_space = false;
            }
            true
        })
        .collect()
}
