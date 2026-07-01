//! Group-by logic for the task query evaluator.

use super::parser::ParsedTask;
use super::query_eval::TaskGroup;
use super::query_eval_sort::compute_urgency;
use super::query_parser::ast::GroupField;

pub fn group_tasks(tasks: Vec<ParsedTask>, field: &GroupField) -> Vec<TaskGroup> {
    let mut groups: Vec<(String, Vec<ParsedTask>)> = Vec::new();

    for task in tasks {
        let key = group_key(&task, field);
        if let Some(existing) = groups.iter_mut().find(|(k, _)| k == &key) {
            existing.1.push(task);
        } else {
            groups.push((key, vec![task]));
        }
    }

    groups
        .into_iter()
        .map(|(name, tasks)| {
            let count = tasks.len();
            TaskGroup { name, tasks, count }
        })
        .collect()
}

fn group_key(task: &ParsedTask, field: &GroupField) -> String {
    match field {
        GroupField::Status | GroupField::StatusName => format!("{:?}", task.status),
        GroupField::StatusType => format!("{:?}", task.status_type),
        GroupField::Priority => format!("{:?}", task.priority),
        GroupField::Due => task
            .due_date
            .clone()
            .unwrap_or_else(|| "No due date".to_string()),
        GroupField::Done => task
            .done_date
            .clone()
            .unwrap_or_else(|| "Not done".to_string()),
        GroupField::Created => task
            .created_date
            .clone()
            .unwrap_or_else(|| "No created date".to_string()),
        GroupField::Start => task
            .start_date
            .clone()
            .unwrap_or_else(|| "No start date".to_string()),
        GroupField::Scheduled => task
            .scheduled_date
            .clone()
            .unwrap_or_else(|| "No scheduled date".to_string()),
        GroupField::Cancelled => task
            .cancelled_date
            .clone()
            .unwrap_or_else(|| "No cancelled date".to_string()),
        GroupField::Happens => task
            .start_date
            .as_ref()
            .or(task.scheduled_date.as_ref())
            .or(task.due_date.as_ref())
            .cloned()
            .unwrap_or_else(|| "No date".to_string()),
        GroupField::Path => task.source_path.clone(),
        GroupField::Root => task.source_path.split('/').next().unwrap_or("").to_string(),
        GroupField::Folder => task
            .source_path
            .rsplitn(2, '/')
            .nth(1)
            .unwrap_or("")
            .to_string(),
        GroupField::Filename => task
            .source_path
            .rsplit('/')
            .next()
            .unwrap_or("")
            .to_string(),
        GroupField::Heading => task
            .heading
            .clone()
            .unwrap_or_else(|| "(no heading)".to_string()),
        GroupField::Backlink => task.source_path.clone(),
        GroupField::Tags => task.tags.join(", "),
        GroupField::Recurring => {
            if task.recurrence.is_some() {
                "Recurring".to_string()
            } else {
                "Not recurring".to_string()
            }
        },
        GroupField::Recurrence => task
            .recurrence
            .clone()
            .unwrap_or_else(|| "None".to_string()),
        GroupField::Id => task.id.clone().unwrap_or_else(|| "(no id)".to_string()),
        GroupField::Urgency => format!("{:.1}", compute_urgency(task)),
    }
}
