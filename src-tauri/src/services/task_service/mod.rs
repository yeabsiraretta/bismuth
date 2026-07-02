//! Task management service.
//!
//! Parses Markdown checkbox tasks from vault notes and provides query/filter
//! capabilities for the task sidebar panel and kanban board.

pub mod parser;
pub(crate) mod parser_markdown;
pub(crate) mod parser_types;
pub mod query;
pub mod query_eval;
pub(crate) mod query_eval_filters;
pub(crate) mod query_eval_group;
pub(crate) mod query_eval_sort;
pub mod query_parser;

use crate::commands::vault_commands::AppState;
pub use parser::{ParsedTask, StatusType, TaskPriority, TaskStatus};
pub use query::{TaskFilter, TaskSort};

/// Collect all tasks across the entire vault.
pub fn get_all_tasks(state: &AppState) -> Result<Vec<ParsedTask>, String> {
    let mut service = state.vault_service.lock().unwrap();
    let notes = service
        .scan()
        .map_err(|e| format!("Vault scan failed: {}", e))?;

    let mut all_tasks = Vec::new();
    for note in &notes {
        let path_str = note.path.to_string_lossy().to_string();
        let tasks = parser::parse_tasks(&note.content, &path_str);
        all_tasks.extend(tasks);
    }

    Ok(all_tasks)
}

/// Get distinct project names from all tasks.
pub fn get_task_projects(state: &AppState) -> Result<Vec<String>, String> {
    let tasks = get_all_tasks(state)?;
    let mut projects: Vec<String> = tasks
        .iter()
        .filter_map(|t| t.project.clone())
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect();
    projects.sort();
    Ok(projects)
}

/// Update a task's status in its source file by rewriting the checkbox marker.
pub fn update_task_status(
    state: &AppState,
    source_path: &str,
    line: usize,
    new_status: TaskStatus,
) -> Result<(), String> {
    let service = state.vault_service.lock().unwrap();

    // Read the file content via get_note
    let path = std::path::PathBuf::from(source_path);
    let note = service
        .get_note(&path)
        .map_err(|e| format!("Failed to read note: {}", e))?;

    let mut lines: Vec<String> = note.content.lines().map(|l| l.to_string()).collect();
    let line_idx = line.checked_sub(1).ok_or("Invalid line number")?;

    if line_idx >= lines.len() {
        return Err(format!(
            "Line {} out of range (file has {} lines)",
            line,
            lines.len()
        ));
    }

    let marker = match new_status {
        TaskStatus::Open => " ",
        TaskStatus::Done => "x",
        TaskStatus::Cancelled => "-",
        TaskStatus::InProgress => "/",
        TaskStatus::OnHold => ">",
    };

    // Replace the checkbox marker
    let line_content = &lines[line_idx];
    if let Some(bracket_pos) = line_content.find("- [") {
        let mut new_line = String::new();
        new_line.push_str(&line_content[..bracket_pos + 3]);
        new_line.push_str(marker);
        new_line.push_str(&line_content[bracket_pos + 4..]);
        lines[line_idx] = new_line;
    } else {
        return Err("Line does not contain a task checkbox".to_string());
    }

    let new_content = lines.join("\n");
    service
        .write_note(&path, &new_content)
        .map_err(|e| format!("Failed to write note: {}", e))?;

    Ok(())
}
