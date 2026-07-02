//! Query evaluation engine.
//!
//! Compiles a parsed query AST into an executable pipeline.
//! Sort logic lives in `query_eval_sort`; group logic in `query_eval_group`.

use super::parser::ParsedTask;
use super::query_eval_filters::eval_filter;
use super::query_eval_group::group_tasks;
use super::query_eval_sort::sort_tasks;
use super::query_parser::ast::*;

#[derive(Debug, Clone, serde::Serialize)]
pub struct TaskQueryResult {
    pub groups: Vec<TaskGroup>,
    pub total_count: usize,
    pub display: DisplayOptions,
    pub explain: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct TaskGroup {
    pub name: String,
    pub tasks: Vec<ParsedTask>,
    pub count: usize,
}

#[derive(Debug, Clone, Default, serde::Serialize)]
pub struct DisplayOptions {
    pub hidden_fields: Vec<String>,
    pub shown_fields: Vec<String>,
    pub short_mode: bool,
    /// When true, sub-items are indented in the rendered output (show tree)
    pub tree_mode: bool,
}

pub fn evaluate(
    query: &Query,
    tasks: Vec<ParsedTask>,
    context_path: Option<&str>,
) -> TaskQueryResult {
    let mut display = DisplayOptions::default();
    let mut explain_parts: Vec<String> = Vec::new();
    let mut should_explain = false;
    let mut filters: Vec<&FilterExpr> = Vec::new();
    let mut sorts: Vec<&SortInstruction> = Vec::new();
    let mut groups: Vec<&GroupInstruction> = Vec::new();
    let mut task_limit: Option<u32> = None;
    let mut group_limit: Option<u32> = None;
    let mut exclude_sub_items = false;

    for instr in &query.instructions {
        match instr {
            Instruction::Filter(expr) => filters.push(expr),
            Instruction::Sort(s) => sorts.push(s),
            Instruction::Group(g) => groups.push(g),
            Instruction::Display(d) => apply_display(d, &mut display),
            Instruction::Limit(LimitInstruction::Tasks(n)) => task_limit = Some(*n),
            Instruction::Limit(LimitInstruction::Groups(n)) => group_limit = Some(*n),
            Instruction::Explain => should_explain = true,
            Instruction::ExcludeSubItems => exclude_sub_items = true,
            Instruction::Comment(_) | Instruction::IgnoreGlobalQuery => {},
        }
    }

    let mut result: Vec<ParsedTask> = tasks
        .into_iter()
        .filter(|task| {
            if exclude_sub_items && task.text.starts_with("  ") {
                return false;
            }
            filters.iter().all(|f| eval_filter(f, task, context_path))
        })
        .collect();

    if should_explain {
        explain_parts.push(format!("Matched {} tasks after filtering", result.len()));
    }

    for sort in sorts.iter().rev() {
        sort_tasks(&mut result, sort);
    }

    let grouped = if let Some(group) = groups.first() {
        group_tasks(result, &group.field)
    } else {
        vec![TaskGroup {
            name: String::new(),
            count: result.len(),
            tasks: result,
        }]
    };

    let mut final_groups: Vec<TaskGroup> = grouped
        .into_iter()
        .map(|mut g| {
            if let Some(limit) = task_limit {
                g.tasks.truncate(limit as usize);
                g.count = g.tasks.len();
            }
            g
        })
        .collect();

    if let Some(gl) = group_limit {
        final_groups.truncate(gl as usize);
    }

    let total_count = final_groups.iter().map(|g| g.count).sum();

    TaskQueryResult {
        groups: final_groups,
        total_count,
        display,
        explain: if should_explain {
            Some(explain_parts.join("\n"))
        } else {
            None
        },
    }
}

fn apply_display(instr: &DisplayInstruction, opts: &mut DisplayOptions) {
    match instr {
        DisplayInstruction::Hide(field) => opts.hidden_fields.push(format!("{:?}", field)),
        DisplayInstruction::Show(field) => {
            // Special-case: `show tree` sets tree_mode flag rather than adding to shown_fields
            if matches!(field, crate::services::task_service::query_parser::ast::DisplayField::Tree) {
                opts.tree_mode = true;
            } else {
                opts.shown_fields.push(format!("{:?}", field));
            }
        },
        DisplayInstruction::ShortMode => opts.short_mode = true,
        DisplayInstruction::FullMode => opts.short_mode = false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::task_service::parser::parse_tasks;
    use crate::services::task_service::query_parser::{lexer, parser};

    fn run_query(content: &str, query_str: &str) -> TaskQueryResult {
        let tasks = parse_tasks(content, "test/notes.md");
        let lines = lexer::tokenize(query_str);
        let query = parser::parse(&lines).unwrap();
        evaluate(&query, tasks, Some("test/notes.md"))
    }

    #[test]
    fn test_eval_not_done() {
        let content = "- [ ] Open task\n- [x] Done task\n- [-] Cancelled\n";
        let result = run_query(content, "not done");
        assert_eq!(result.total_count, 2);
    }

    #[test]
    fn test_eval_done() {
        let content = "- [ ] Open\n- [x] Done\n";
        let result = run_query(content, "done");
        assert_eq!(result.total_count, 1);
        assert_eq!(result.groups[0].tasks[0].text, "Done");
    }

    #[test]
    fn test_eval_sort_by_priority() {
        let content = "- [ ] Low 🔽\n- [ ] High 🔺\n- [ ] Normal\n";
        let result = run_query(content, "not done\nsort by priority");
        assert_eq!(result.groups[0].tasks[0].text, "High");
    }

    #[test]
    fn test_eval_group_by_status() {
        let content = "- [ ] Open1\n- [ ] Open2\n- [x] Done1\n";
        let result = run_query(content, "group by status");
        assert!(result.groups.len() >= 2);
    }

    #[test]
    fn test_eval_limit() {
        let content = "- [ ] A\n- [ ] B\n- [ ] C\n- [ ] D\n- [ ] E\n";
        let result = run_query(content, "not done\nlimit 3");
        assert_eq!(result.total_count, 3);
    }

    #[test]
    fn test_eval_priority_filter() {
        let content = "- [ ] ⏫ Urgent\n- [ ] 🔽 Low\n- [ ] Normal\n";
        let result = run_query(content, "priority is above medium");
        assert_eq!(result.total_count, 1);
    }

    #[test]
    fn test_eval_has_tags() {
        let content = "- [ ] Tagged #work\n- [ ] Untagged\n";
        let result = run_query(content, "has tags");
        assert_eq!(result.total_count, 1);
    }

    // 5.11: Synthetic benchmark — 10k tasks evaluated in <200ms
    // This is a correctness + perf guard: we generate 10k tasks and verify
    // the evaluation completes in a reasonable time in debug builds.
    #[test]
    fn test_eval_10k_tasks_completes() {
        let mut lines = String::with_capacity(10_000 * 30);
        for i in 0..10_000 {
            if i % 3 == 0 {
                lines.push_str(&format!("- [x] Done task {}\n", i));
            } else {
                lines.push_str(&format!("- [ ] Open task {}\n", i));
            }
        }
        let start = std::time::Instant::now();
        let result = run_query(&lines, "not done");
        let elapsed = start.elapsed();
        // ~6667 open tasks
        assert!(result.total_count > 6000);
        // Must complete in under 2s even in debug builds (production target: <200ms)
        assert!(elapsed.as_millis() < 2000, "Query took {}ms, expected <2000ms", elapsed.as_millis());
    }

    // 6.5: Integration test — full query → result pipeline
    #[test]
    fn test_full_query_pipeline() {
        let content = concat!(
            "- [ ] Buy groceries #shopping 📅 2026-07-01\n",
            "- [x] Write report #work ⏫\n",
            "- [ ] Read book #learning 🔽\n",
            "- [ ] Fix bug #work ⏫\n",
            "- [ ] Water plants\n",
        );
        // Combined filter + sort + limit pipeline
        let result = run_query(content, "not done\nsort by priority\nlimit 3");
        assert_eq!(result.total_count, 3);
        // Highest priority (⏫) should appear first
        let first_task = &result.groups[0].tasks[0];
        assert!(first_task.text.contains("Fix bug"), "Expected high-priority task first, got: {}", first_task.text);
    }
}
