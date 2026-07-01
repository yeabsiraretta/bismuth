//! Sort and urgency computation for the task query evaluator.

use chrono::{Local, NaiveDate};

use super::parser::TaskStatus;
use super::parser::{ParsedTask, TaskPriority};
use super::query_eval_filters::priority_rank;
use super::query_eval_filters::priority_to_level;
use super::query_parser::ast::{SortField, SortInstruction};

pub fn sort_tasks(tasks: &mut [ParsedTask], sort: &SortInstruction) {
    let reverse = sort.reverse;
    tasks.sort_by(|a, b| {
        let cmp = compare_by_field(a, b, &sort.field);
        if reverse {
            cmp.reverse()
        } else {
            cmp
        }
    });
}

fn compare_by_field(a: &ParsedTask, b: &ParsedTask, field: &SortField) -> std::cmp::Ordering {
    match field {
        SortField::Status => status_ord(&a.status).cmp(&status_ord(&b.status)),
        SortField::Priority => priority_rank(priority_to_level(&a.priority))
            .cmp(&priority_rank(priority_to_level(&b.priority)))
            .reverse(),
        SortField::Due => cmp_opt_date(&a.due_date, &b.due_date),
        SortField::Done => cmp_opt_date(&a.done_date, &b.done_date),
        SortField::Created => cmp_opt_date(&a.created_date, &b.created_date),
        SortField::Start => cmp_opt_date(&a.start_date, &b.start_date),
        SortField::Scheduled => cmp_opt_date(&a.scheduled_date, &b.scheduled_date),
        SortField::Cancelled => cmp_opt_date(&a.cancelled_date, &b.cancelled_date),
        SortField::Happens => {
            let ah = a
                .start_date
                .as_ref()
                .or(a.scheduled_date.as_ref())
                .or(a.due_date.as_ref());
            let bh = b
                .start_date
                .as_ref()
                .or(b.scheduled_date.as_ref())
                .or(b.due_date.as_ref());
            cmp_opt_date(&ah.cloned(), &bh.cloned())
        },
        SortField::Path => a.source_path.cmp(&b.source_path),
        SortField::Filename => {
            let af = a.source_path.rsplit('/').next().unwrap_or("");
            let bf = b.source_path.rsplit('/').next().unwrap_or("");
            af.cmp(bf)
        },
        SortField::Heading => a.heading.cmp(&b.heading),
        SortField::Description => a.text.to_lowercase().cmp(&b.text.to_lowercase()),
        SortField::Tag(n) => {
            let idx = n.unwrap_or(0) as usize;
            let at = a.tags.get(idx).map(|s| s.as_str()).unwrap_or("");
            let bt = b.tags.get(idx).map(|s| s.as_str()).unwrap_or("");
            at.cmp(bt)
        },
        SortField::Urgency => compute_urgency(a)
            .partial_cmp(&compute_urgency(b))
            .unwrap_or(std::cmp::Ordering::Equal)
            .reverse(),
        SortField::Recurring => a.recurrence.is_some().cmp(&b.recurrence.is_some()),
        SortField::Id => a.id.cmp(&b.id),
        _ => std::cmp::Ordering::Equal,
    }
}

pub fn compute_urgency(task: &ParsedTask) -> f64 {
    let today = Local::now().date_naive();
    let mut score: f64 = match task.priority {
        TaskPriority::Highest => 9.0,
        TaskPriority::High => 6.0,
        TaskPriority::Medium => 3.9,
        TaskPriority::None => 1.95,
        TaskPriority::Low => 0.8,
        TaskPriority::Lowest => 0.2,
    };

    if let Some(due) = &task.due_date {
        if let Ok(d) = NaiveDate::parse_from_str(due, "%Y-%m-%d") {
            let days = (d - today).num_days();
            if days < 0 {
                score += 12.0;
            } else if days <= 7 {
                score += 8.0 - days as f64;
            }
        }
    }

    if let Some(scheduled) = &task.scheduled_date {
        if let Ok(d) = NaiveDate::parse_from_str(scheduled, "%Y-%m-%d") {
            if d <= today {
                score += 5.0;
            }
        }
    }

    if let Some(start) = &task.start_date {
        if let Ok(d) = NaiveDate::parse_from_str(start, "%Y-%m-%d") {
            if d <= today {
                score += 4.0;
            }
        }
    }

    score
}

fn status_ord(s: &TaskStatus) -> u8 {
    match s {
        TaskStatus::Open => 0,
        TaskStatus::InProgress => 1,
        TaskStatus::OnHold => 2,
        TaskStatus::Done => 3,
        TaskStatus::Cancelled => 4,
    }
}

fn cmp_opt_date(a: &Option<String>, b: &Option<String>) -> std::cmp::Ordering {
    match (a, b) {
        (Some(a), Some(b)) => a.cmp(b),
        (Some(_), None) => std::cmp::Ordering::Less,
        (None, Some(_)) => std::cmp::Ordering::Greater,
        (None, None) => std::cmp::Ordering::Equal,
    }
}
