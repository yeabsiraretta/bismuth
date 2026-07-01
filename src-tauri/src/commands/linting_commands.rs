//! Writing lint IPC commands (F23)

use crate::services::linting_service::{lint_text, LintIssue};

/// Lints the given text and returns all issues found.
#[tauri::command]
pub async fn lint_note_text(text: String) -> Result<Vec<LintIssue>, String> {
    Ok(lint_text(&text))
}
