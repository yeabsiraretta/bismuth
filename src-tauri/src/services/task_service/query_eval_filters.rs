//! Filter evaluation functions for the task query engine.
//!
//! Handles matching individual filter expressions against parsed tasks.

use chrono::NaiveDate;
use regex::Regex;

use super::parser::{ParsedTask, TaskPriority, TaskStatus};
use super::query_parser::ast::*;
use super::query_parser::date_parser;

// ─── Filter Evaluation ───────────────────────────────────────────────────────

pub fn eval_filter(expr: &FilterExpr, task: &ParsedTask, ctx: Option<&str>) -> bool {
    match expr {
        FilterExpr::Simple(f) => eval_simple_filter(f, task, ctx),
        FilterExpr::And(a, b) => eval_filter(a, task, ctx) && eval_filter(b, task, ctx),
        FilterExpr::Or(a, b) => eval_filter(a, task, ctx) || eval_filter(b, task, ctx),
        FilterExpr::Not(inner) => !eval_filter(inner, task, ctx),
        FilterExpr::Xor(a, b) => eval_filter(a, task, ctx) ^ eval_filter(b, task, ctx),
    }
}

fn eval_simple_filter(filter: &Filter, task: &ParsedTask, ctx: Option<&str>) -> bool {
    match filter {
        Filter::Status(sf) => eval_status_filter(sf, task),
        Filter::Date(df) => eval_date_filter(df, task),
        Filter::Priority(pf) => eval_priority_filter(pf, task),
        Filter::Path(pf) => eval_path_filter(pf, task, ctx),
        Filter::Description(sf) => eval_string_filter(&sf.matcher, &task.text),
        Filter::Tag(tf) => eval_tag_filter(tf, task),
        Filter::Recurrence(rf) => eval_recurrence_filter(rf, task),
        Filter::Dependency(df) => eval_dependency_filter(df, task),
        Filter::ScriptFilter(_) => true, // Stub: pass through
    }
}

fn eval_status_filter(filter: &StatusFilter, task: &ParsedTask) -> bool {
    match filter {
        StatusFilter::Done => task.status == TaskStatus::Done,
        StatusFilter::NotDone => task.status != TaskStatus::Done,
        StatusFilter::StatusName(matcher) => {
            let name = format!("{:?}", task.status).to_lowercase();
            eval_string_filter(matcher, &name)
        },
        StatusFilter::StatusType(m) => {
            let type_str = format!("{:?}", task.status_type).to_uppercase();
            match m {
                StatusTypeMatch::Is(v) => type_str == *v,
                StatusTypeMatch::IsNot(v) => type_str != *v,
            }
        },
    }
}

fn eval_date_filter(filter: &DateFilter, task: &ParsedTask) -> bool {
    let task_date_str = match filter.field {
        DateField::Due => task.due_date.as_deref(),
        DateField::Done => task.done_date.as_deref(),
        DateField::Created => task.created_date.as_deref(),
        DateField::Start => task.start_date.as_deref(),
        DateField::Scheduled => task.scheduled_date.as_deref(),
        DateField::Cancelled => task.cancelled_date.as_deref(),
        DateField::Happens => task
            .start_date
            .as_deref()
            .or(task.scheduled_date.as_deref())
            .or(task.due_date.as_deref()),
    };

    match &filter.condition {
        DateCondition::HasDate => task_date_str.is_some(),
        DateCondition::NoDate => task_date_str.is_none(),
        DateCondition::IsInvalid => {
            task_date_str.map_or(false, |s| NaiveDate::parse_from_str(s, "%Y-%m-%d").is_err())
        },
        _ => {
            let task_date =
                task_date_str.and_then(|s| NaiveDate::parse_from_str(s, "%Y-%m-%d").ok());
            let Some(td) = task_date else { return false };
            eval_date_condition(&filter.condition, td)
        },
    }
}

fn eval_date_condition(condition: &DateCondition, task_date: NaiveDate) -> bool {
    match condition {
        DateCondition::On(v) => date_parser::resolve_date(v)
            .and_then(|s| NaiveDate::parse_from_str(&s, "%Y-%m-%d").ok())
            .map_or(false, |d| task_date == d),
        DateCondition::Before(v) => date_parser::resolve_date(v)
            .and_then(|s| NaiveDate::parse_from_str(&s, "%Y-%m-%d").ok())
            .map_or(false, |d| task_date < d),
        DateCondition::After(v) => date_parser::resolve_date(v)
            .and_then(|s| NaiveDate::parse_from_str(&s, "%Y-%m-%d").ok())
            .map_or(false, |d| task_date > d),
        DateCondition::OnOrBefore(v) => date_parser::resolve_date(v)
            .and_then(|s| NaiveDate::parse_from_str(&s, "%Y-%m-%d").ok())
            .map_or(false, |d| task_date <= d),
        DateCondition::OnOrAfter(v) => date_parser::resolve_date(v)
            .and_then(|s| NaiveDate::parse_from_str(&s, "%Y-%m-%d").ok())
            .map_or(false, |d| task_date >= d),
        DateCondition::InRange(start, end) => {
            let s = date_parser::resolve_date(start)
                .and_then(|s| NaiveDate::parse_from_str(&s, "%Y-%m-%d").ok());
            let e = date_parser::resolve_date(end)
                .and_then(|s| NaiveDate::parse_from_str(&s, "%Y-%m-%d").ok());
            match (s, e) {
                (Some(s), Some(e)) => task_date >= s && task_date <= e,
                _ => false,
            }
        },
        DateCondition::HasDate | DateCondition::NoDate | DateCondition::IsInvalid => {
            unreachable!("handled above")
        },
    }
}

fn eval_priority_filter(filter: &PriorityFilter, task: &ParsedTask) -> bool {
    let task_level = priority_to_level(&task.priority);
    let filter_level = &filter.level;

    match filter.comparison {
        PriorityComparison::Is => task_level == *filter_level,
        PriorityComparison::IsNot => task_level != *filter_level,
        PriorityComparison::Above => priority_rank(task_level) > priority_rank(*filter_level),
        PriorityComparison::Below => priority_rank(task_level) < priority_rank(*filter_level),
    }
}

pub fn priority_to_level(p: &TaskPriority) -> PriorityLevel {
    match p {
        TaskPriority::Lowest => PriorityLevel::Lowest,
        TaskPriority::Low => PriorityLevel::Low,
        TaskPriority::None => PriorityLevel::None,
        TaskPriority::Medium => PriorityLevel::Medium,
        TaskPriority::High => PriorityLevel::High,
        TaskPriority::Highest => PriorityLevel::Highest,
    }
}

pub fn priority_rank(level: PriorityLevel) -> u8 {
    match level {
        PriorityLevel::Lowest => 0,
        PriorityLevel::Low => 1,
        PriorityLevel::None => 2,
        PriorityLevel::Medium => 3,
        PriorityLevel::High => 4,
        PriorityLevel::Highest => 5,
    }
}

fn eval_path_filter(filter: &PathFilter, task: &ParsedTask, ctx: Option<&str>) -> bool {
    let value = match filter.field {
        PathField::Path => &task.source_path,
        PathField::Root => {
            return eval_string_filter_with_ctx(
                &filter.matcher,
                task.source_path.split('/').next().unwrap_or(""),
                ctx,
            );
        },
        PathField::Folder => {
            return eval_string_filter_with_ctx(
                &filter.matcher,
                &task.source_path.rsplitn(2, '/').nth(1).unwrap_or(""),
                ctx,
            );
        },
        PathField::Filename => {
            return eval_string_filter_with_ctx(
                &filter.matcher,
                task.source_path.rsplit('/').next().unwrap_or(""),
                ctx,
            );
        },
        PathField::Heading => {
            return eval_string_filter_with_ctx(
                &filter.matcher,
                task.heading.as_deref().unwrap_or(""),
                ctx,
            );
        },
    };
    eval_string_filter_with_ctx(&filter.matcher, value, ctx)
}

fn eval_tag_filter(filter: &TagFilter, task: &ParsedTask) -> bool {
    match filter {
        TagFilter::HasTags => !task.tags.is_empty(),
        TagFilter::NoTags => task.tags.is_empty(),
        TagFilter::Includes(matcher) => {
            task.tags.iter().any(|tag| eval_string_filter(matcher, tag))
        },
    }
}

fn eval_recurrence_filter(filter: &RecurrenceFilter, task: &ParsedTask) -> bool {
    match filter {
        RecurrenceFilter::IsRecurring => task.recurrence.is_some(),
        RecurrenceFilter::IsNotRecurring => task.recurrence.is_none(),
        RecurrenceFilter::Matches(matcher) => task
            .recurrence
            .as_deref()
            .map_or(false, |r| eval_string_filter(matcher, r)),
    }
}

fn eval_dependency_filter(filter: &DependencyFilter, task: &ParsedTask) -> bool {
    match filter {
        DependencyFilter::HasId => task.id.is_some(),
        DependencyFilter::NoId => task.id.is_none(),
        DependencyFilter::IdMatches(matcher) => task
            .id
            .as_deref()
            .map_or(false, |id| eval_string_filter(matcher, id)),
        DependencyFilter::HasDependsOn => !task.depends_on.is_empty(),
        DependencyFilter::NoDependsOn => task.depends_on.is_empty(),
        // Cross-task resolution not available in single-task eval — treated as false
        DependencyFilter::IsBlocked => !task.depends_on.is_empty(),
        DependencyFilter::IsNotBlocked => task.depends_on.is_empty(),
        DependencyFilter::IsBlocking => task.id.is_some(),
        DependencyFilter::IsNotBlocking => task.id.is_none(),
    }
}

// ─── String Matching ─────────────────────────────────────────────────────────

fn eval_string_filter(matcher: &StringMatcher, value: &str) -> bool {
    eval_string_filter_with_ctx(matcher, value, None)
}

fn eval_string_filter_with_ctx(matcher: &StringMatcher, value: &str, ctx: Option<&str>) -> bool {
    match matcher {
        StringMatcher::Includes(sv) => {
            let search = resolve_string_value(sv, ctx);
            value.to_lowercase().contains(&search.to_lowercase())
        },
        StringMatcher::DoesNotInclude(sv) => {
            let search = resolve_string_value(sv, ctx);
            !value.to_lowercase().contains(&search.to_lowercase())
        },
        StringMatcher::RegexMatches(pattern, flags) => match build_regex(pattern, flags) {
            Some(re) => re.is_match(value),
            None => false,
        },
        StringMatcher::RegexDoesNotMatch(pattern, flags) => match build_regex(pattern, flags) {
            Some(re) => !re.is_match(value),
            None => true,
        },
    }
}

fn resolve_string_value(sv: &StringValue, ctx: Option<&str>) -> String {
    match sv {
        StringValue::Literal(s) => s.clone(),
        StringValue::TemplateVar(var) => resolve_template_var(var, ctx),
    }
}

fn resolve_template_var(var: &str, ctx: Option<&str>) -> String {
    let path = ctx.unwrap_or("");
    match var {
        "query.file.path" => path.to_string(),
        "query.file.folder" => path.rsplitn(2, '/').nth(1).unwrap_or("").to_string(),
        "query.file.filename" => path.rsplit('/').next().unwrap_or("").to_string(),
        "query.file.root" => path.split('/').next().unwrap_or("").to_string(),
        _ => String::new(),
    }
}

fn build_regex(pattern: &str, flags: &str) -> Option<Regex> {
    let case_insensitive = flags.contains('i');
    let regex_str = if case_insensitive {
        format!("(?i){}", pattern)
    } else {
        pattern.to_string()
    };
    // ReDoS protection: use with_size_limit (bounded)
    regex::RegexBuilder::new(&regex_str)
        .size_limit(1024 * 100) // 100KB compiled size limit
        .build()
        .ok()
}
