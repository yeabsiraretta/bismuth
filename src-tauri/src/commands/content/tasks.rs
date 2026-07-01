//! Task management IPC commands.

use crate::commands::vault_commands::AppState;
use crate::services::task_service::{self, ParsedTask, TaskFilter, TaskSort, TaskStatus};
use tauri::State;

/// Returns all tasks from the vault.
#[tauri::command]
pub async fn get_all_tasks(
    state: State<'_, AppState>,
) -> Result<Vec<ParsedTask>, String> {
    task_service::get_all_tasks(&state)
}

/// Returns tasks matching the given filter criteria.
#[tauri::command]
pub async fn get_tasks_filtered(
    state: State<'_, AppState>,
    filter: TaskFilter,
    sort: Option<TaskSort>,
) -> Result<Vec<ParsedTask>, String> {
    let all_tasks = task_service::get_all_tasks(&state)?;
    let mut filtered = task_service::query::filter_tasks(&all_tasks, &filter);
    task_service::query::sort_tasks(&mut filtered, sort.unwrap_or_default());
    Ok(filtered)
}

/// Returns distinct project names from tasks.
#[tauri::command]
pub async fn get_task_projects(
    state: State<'_, AppState>,
) -> Result<Vec<String>, String> {
    task_service::get_task_projects(&state)
}

/// Updates the status of a task in its source file.
#[tauri::command]
pub async fn update_task_status(
    state: State<'_, AppState>,
    source_path: String,
    line: usize,
    new_status: TaskStatus,
) -> Result<(), String> {
    task_service::update_task_status(&state, &source_path, line, new_status)
}

/// Executes a task query DSL string against all vault tasks.
#[tauri::command]
pub async fn execute_task_query(
    state: State<'_, AppState>,
    query: String,
    context_path: Option<String>,
) -> Result<crate::services::task_service::query_eval::TaskQueryResult, String> {
    use crate::services::task_service::query_eval;
    use crate::services::task_service::query_parser::{lexer, parser};

    let all_tasks = task_service::get_all_tasks(&state)?;
    let lines = lexer::tokenize(&query);
    let ast = parser::parse(&lines).map_err(|e| e.to_string())?;
    let result = query_eval::evaluate(&ast, all_tasks, context_path.as_deref());
    Ok(result)
}
