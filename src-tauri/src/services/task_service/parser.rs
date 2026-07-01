//! Markdown task parser — entry point.
//!
//! Types and static regexes live in `parser_types`;
//! markdown structure helpers in `parser_markdown`.

use super::parser_markdown::{
    clean_task_text, extract_headings, extract_project, find_heading_for_line,
};
use super::parser_types::{
    CANCELLED_DATE_RE, CREATED_RE, DEPENDS_RE, DONE_DATE_RE, DUE_RE, ID_RE, ON_COMPLETION_RE,
    RECURRENCE_RE, SCHEDULED_RE, START_RE, TAG_RE, TASK_RE,
};
use regex::Regex;

pub use super::parser_types::{ParsedTask, StatusType, TaskPriority, TaskStatus};

/// Parse all tasks from a single Markdown file's content.
pub fn parse_tasks(content: &str, source_path: &str) -> Vec<ParsedTask> {
    let project = extract_project(source_path);
    let headings = extract_headings(content);
    let mut tasks = Vec::new();

    for (line_idx, line) in content.lines().enumerate() {
        if let Some(caps) = TASK_RE.captures(line) {
            let status_char = caps[2].chars().next().unwrap_or(' ');
            let text = caps[3].to_string();

            let (status, status_type) = classify_status(status_char);
            let priority = extract_priority(&text);
            let due_date = extract_date(&DUE_RE, &text);
            let scheduled_date = extract_date(&SCHEDULED_RE, &text);
            let start_date = extract_date(&START_RE, &text);
            let done_date = extract_date(&DONE_DATE_RE, &text);
            let created_date = extract_date(&CREATED_RE, &text);
            let cancelled_date = extract_date(&CANCELLED_DATE_RE, &text);
            let recurrence = RECURRENCE_RE
                .captures(&text)
                .map(|c| c[1].trim().to_string());
            let id = ID_RE.captures(&text).map(|c| c[1].to_string());
            let depends_on: Vec<String> = DEPENDS_RE
                .captures_iter(&text)
                .map(|c| c[1].to_string())
                .collect();
            let on_completion = ON_COMPLETION_RE.captures(&text).map(|c| c[1].to_string());
            let tags: Vec<String> = TAG_RE
                .captures_iter(&text)
                .map(|c| c[1].to_string())
                .collect();

            let clean_text = clean_task_text(&text);
            let heading = find_heading_for_line(line_idx, &headings);

            tasks.push(ParsedTask {
                text: clean_text,
                status,
                status_symbol: status_char,
                status_type,
                priority,
                due_date,
                created_date,
                start_date,
                scheduled_date,
                done_date,
                cancelled_date,
                recurrence,
                id,
                depends_on,
                tags,
                line: line_idx + 1,
                source_path: source_path.to_string(),
                project: project.clone(),
                heading,
                on_completion,
            });
        }
    }

    tasks
}

fn classify_status(ch: char) -> (TaskStatus, StatusType) {
    match ch {
        'x' | 'X' => (TaskStatus::Done, StatusType::Done),
        '-' => (TaskStatus::Cancelled, StatusType::Cancelled),
        '/' => (TaskStatus::InProgress, StatusType::InProgress),
        '>' => (TaskStatus::OnHold, StatusType::OnHold),
        _ => (TaskStatus::Open, StatusType::Todo),
    }
}

fn extract_priority(text: &str) -> TaskPriority {
    if text.contains('⏫') {
        TaskPriority::Highest
    } else if text.contains('🔺') {
        TaskPriority::High
    } else if text.contains('🔼') {
        TaskPriority::Medium
    } else if text.contains('🔽') {
        TaskPriority::Low
    } else if text.contains('⏬') {
        TaskPriority::Lowest
    } else if text.starts_with("!! ") || text.starts_with("!!") {
        TaskPriority::Highest
    } else if text.starts_with("! ") || text.starts_with('!') {
        TaskPriority::High
    } else {
        TaskPriority::None
    }
}

fn extract_date(re: &Regex, text: &str) -> Option<String> {
    re.captures(text).map(|c| c[1].to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_basic_tasks() {
        let content = "# My Note\n\n- [ ] Buy groceries\n- [x] Write tests\n- [-] Cancelled item\n";
        let tasks = parse_tasks(content, "inbox/todo.md");
        assert_eq!(tasks.len(), 3);
        assert_eq!(tasks[0].status, TaskStatus::Open);
        assert_eq!(tasks[0].text, "Buy groceries");
        assert_eq!(tasks[1].status, TaskStatus::Done);
        assert_eq!(tasks[2].status, TaskStatus::Cancelled);
        assert_eq!(tasks[0].project, Some("inbox".to_string()));
    }

    #[test]
    fn test_parse_extended_status() {
        let content = "- [/] In progress task\n- [>] On hold task\n";
        let tasks = parse_tasks(content, "test.md");
        assert_eq!(tasks[0].status, TaskStatus::InProgress);
        assert_eq!(tasks[1].status, TaskStatus::OnHold);
    }

    #[test]
    fn test_parse_priority_emoji() {
        let content =
            "- [ ] ⏫ Highest\n- [ ] 🔺 High\n- [ ] 🔼 Medium\n- [ ] 🔽 Low\n- [ ] ⏬ Lowest\n";
        let tasks = parse_tasks(content, "test.md");
        assert_eq!(tasks[0].priority, TaskPriority::Highest);
        assert_eq!(tasks[1].priority, TaskPriority::High);
        assert_eq!(tasks[2].priority, TaskPriority::Medium);
        assert_eq!(tasks[3].priority, TaskPriority::Low);
        assert_eq!(tasks[4].priority, TaskPriority::Lowest);
    }

    #[test]
    fn test_parse_priority_legacy() {
        let content = "- [ ] !! Critical task\n- [ ] ! High priority\n- [ ] Normal\n";
        let tasks = parse_tasks(content, "test.md");
        assert_eq!(tasks[0].priority, TaskPriority::Highest);
        assert_eq!(tasks[1].priority, TaskPriority::High);
        assert_eq!(tasks[2].priority, TaskPriority::None);
    }

    #[test]
    fn test_parse_due_date() {
        let content = "- [ ] Submit report 📅 2024-12-31\n";
        let tasks = parse_tasks(content, "test.md");
        assert_eq!(tasks[0].due_date, Some("2024-12-31".to_string()));
        assert_eq!(tasks[0].text, "Submit report");
    }

    #[test]
    fn test_parse_all_dates() {
        let content = "- [ ] Task ➕ 2024-01-01 🛫 2024-02-01 ⏳ 2024-03-01 📅 2024-04-01\n";
        let tasks = parse_tasks(content, "test.md");
        assert_eq!(tasks[0].created_date, Some("2024-01-01".to_string()));
        assert_eq!(tasks[0].start_date, Some("2024-02-01".to_string()));
        assert_eq!(tasks[0].scheduled_date, Some("2024-03-01".to_string()));
        assert_eq!(tasks[0].due_date, Some("2024-04-01".to_string()));
        assert_eq!(tasks[0].text, "Task");
    }

    #[test]
    fn test_parse_done_and_cancelled_dates() {
        let content = "- [x] Done task ✅ 2024-06-15\n- [-] Nope ❌ 2024-06-16\n";
        let tasks = parse_tasks(content, "test.md");
        assert_eq!(tasks[0].done_date, Some("2024-06-15".to_string()));
        assert_eq!(tasks[1].cancelled_date, Some("2024-06-16".to_string()));
    }

    #[test]
    fn test_parse_recurrence() {
        let content = "- [ ] Water plants 🔁 every week 📅 2024-06-01\n";
        let tasks = parse_tasks(content, "test.md");
        assert_eq!(tasks[0].recurrence, Some("every week".to_string()));
    }

    #[test]
    fn test_parse_id_and_depends() {
        let content = "- [ ] First task 🆔 abc123\n- [ ] Second task ⛔ abc123\n";
        let tasks = parse_tasks(content, "test.md");
        assert_eq!(tasks[0].id, Some("abc123".to_string()));
        assert_eq!(tasks[1].depends_on, vec!["abc123"]);
    }

    #[test]
    fn test_parse_tags() {
        let content = "- [ ] Review #project/alpha #urgent\n";
        let tasks = parse_tasks(content, "test.md");
        assert_eq!(tasks[0].tags, vec!["project/alpha", "urgent"]);
    }

    #[test]
    fn test_parse_heading() {
        let content =
            "# Top\n\n## Section A\n\n- [ ] Task in A\n\n## Section B\n\n- [ ] Task in B\n";
        let tasks = parse_tasks(content, "test.md");
        assert_eq!(tasks[0].heading, Some("Section A".to_string()));
        assert_eq!(tasks[1].heading, Some("Section B".to_string()));
    }

    #[test]
    fn test_clean_text_removes_metadata() {
        let content = "- [ ] 🔺 Buy milk 📅 2024-12-01 🆔 task1 ➕ 2024-11-01 #shopping\n";
        let tasks = parse_tasks(content, "test.md");
        assert_eq!(tasks[0].text, "Buy milk #shopping");
        assert_eq!(tasks[0].priority, TaskPriority::High);
    }
}
