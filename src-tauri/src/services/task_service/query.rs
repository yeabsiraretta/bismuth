//! Task query and filtering module.

use super::parser::{ParsedTask, TaskPriority, TaskStatus};

/// Filter criteria for querying tasks.
#[derive(Debug, Clone, Default, serde::Deserialize)]
pub struct TaskFilter {
    pub status: Option<TaskStatus>,
    pub priority: Option<TaskPriority>,
    pub project: Option<String>,
    pub tag: Option<String>,
    pub overdue: Option<bool>,
    pub search: Option<String>,
}

/// Sort order for tasks.
#[derive(Debug, Clone, Copy, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TaskSort {
    Priority,
    DueDate,
    Status,
    Project,
    Alphabetical,
}

impl Default for TaskSort {
    fn default() -> Self {
        Self::Priority
    }
}

/// Apply filter and sort to a list of tasks.
pub fn filter_tasks(tasks: &[ParsedTask], filter: &TaskFilter) -> Vec<ParsedTask> {
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();

    tasks
        .iter()
        .filter(|t| {
            if let Some(status) = &filter.status {
                if &t.status != status {
                    return false;
                }
            }
            if let Some(priority) = &filter.priority {
                if &t.priority != priority {
                    return false;
                }
            }
            if let Some(project) = &filter.project {
                if t.project.as_deref() != Some(project.as_str()) {
                    return false;
                }
            }
            if let Some(tag) = &filter.tag {
                if !t.tags.contains(tag) {
                    return false;
                }
            }
            if let Some(true) = filter.overdue {
                match &t.due_date {
                    Some(due) if due < &today && t.status == TaskStatus::Open => {},
                    _ => return false,
                }
            }
            if let Some(search) = &filter.search {
                let lower = search.to_lowercase();
                if !t.text.to_lowercase().contains(&lower) {
                    return false;
                }
            }
            true
        })
        .cloned()
        .collect()
}

/// Sort tasks by the given criterion.
pub fn sort_tasks(tasks: &mut [ParsedTask], sort: TaskSort) {
    match sort {
        TaskSort::Priority => {
            tasks.sort_by(|a, b| priority_rank(&b.priority).cmp(&priority_rank(&a.priority)))
        },
        TaskSort::DueDate => tasks.sort_by(|a, b| a.due_date.cmp(&b.due_date)),
        TaskSort::Status => {
            tasks.sort_by(|a, b| status_rank(&a.status).cmp(&status_rank(&b.status)))
        },
        TaskSort::Project => tasks.sort_by(|a, b| a.project.cmp(&b.project)),
        TaskSort::Alphabetical => {
            tasks.sort_by(|a, b| a.text.to_lowercase().cmp(&b.text.to_lowercase()))
        },
    }
}

fn priority_rank(p: &TaskPriority) -> u8 {
    match p {
        TaskPriority::Highest => 5,
        TaskPriority::High => 4,
        TaskPriority::Medium => 3,
        TaskPriority::None => 2,
        TaskPriority::Low => 1,
        TaskPriority::Lowest => 0,
    }
}

fn status_rank(s: &TaskStatus) -> u8 {
    match s {
        TaskStatus::Open => 0,
        TaskStatus::InProgress => 1,
        TaskStatus::OnHold => 2,
        TaskStatus::Done => 3,
        TaskStatus::Cancelled => 4,
    }
}
