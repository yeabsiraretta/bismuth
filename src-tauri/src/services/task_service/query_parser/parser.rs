//! Recursive descent parser for the task query DSL.
//!
//! Converts tokenized lines into a structured `Query` AST.
//! Sort/group/display/limit field parsers live in `parser_fields`.

use super::ast::*;
use super::lexer::{Token, TokenLine};
use super::parser_fields;
use super::parser_filters;
use super::parser_utils::{self, keyword_str};

#[derive(Debug, Clone)]
pub struct ParseError {
    pub message: String,
    pub line: usize,
}

impl std::fmt::Display for ParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Line {}: {}", self.line + 1, self.message)
    }
}

pub fn parse(lines: &[TokenLine]) -> Result<Query, ParseError> {
    let mut instructions = Vec::new();
    for (line_idx, line) in lines.iter().enumerate() {
        if line.tokens.is_empty() {
            continue;
        }
        match parse_instruction(&line.tokens, line_idx) {
            Ok(instr) => instructions.push(instr),
            Err(e) => return Err(e),
        }
    }
    Ok(Query { instructions })
}

fn parse_instruction(tokens: &[Token], line_idx: usize) -> Result<Instruction, ParseError> {
    parse_instruction_inner(tokens, line_idx)
}

pub(crate) fn parse_instruction_inner(
    tokens: &[Token],
    line_idx: usize,
) -> Result<Instruction, ParseError> {
    if tokens.is_empty() {
        return Err(ParseError {
            message: "Empty instruction".into(),
            line: line_idx,
        });
    }

    if let Token::Comment(text) = &tokens[0] {
        return Ok(Instruction::Comment(text.clone()));
    }

    if tokens.contains(&Token::LParen) {
        return parser_utils::parse_boolean_instruction(tokens, line_idx);
    }

    let first = keyword_str(&tokens[0]);

    match first.as_str() {
        "sort" => parser_fields::parse_sort(tokens, line_idx),
        "group" => parser_fields::parse_group(tokens, line_idx),
        "hide" => parser_fields::parse_hide(tokens, line_idx),
        "show" => parser_fields::parse_show(tokens, line_idx),
        "limit" => parser_fields::parse_limit(tokens, line_idx),
        "short" => Ok(Instruction::Display(DisplayInstruction::ShortMode)),
        "full" => Ok(Instruction::Display(DisplayInstruction::FullMode)),
        "explain" => Ok(Instruction::Explain),
        "exclude" => Ok(Instruction::ExcludeSubItems),
        "ignore" => Ok(Instruction::IgnoreGlobalQuery),
        "filter" => parser_fields::parse_script_filter(tokens, line_idx),
        "preset" => parser_fields::parse_preset_stub(tokens, line_idx),
        "done" => Ok(Instruction::Filter(FilterExpr::Simple(Filter::Status(
            StatusFilter::Done,
        )))),
        "not" => parser_filters::parse_not_filter(tokens, line_idx),
        "status" => parser_filters::parse_status_filter(tokens, line_idx),
        "priority" => parser_filters::parse_priority_filter(tokens, line_idx),
        "due" | "created" | "start" | "scheduled" | "cancelled" | "happens" => {
            parser_filters::parse_date_filter(tokens, line_idx)
        },
        "path" | "root" | "folder" | "filename" | "heading" => {
            parser_filters::parse_path_filter(tokens, line_idx)
        },
        "description" => parser_filters::parse_description_filter(tokens, line_idx),
        "tag" | "tags" => parser_filters::parse_tag_filter(tokens, line_idx),
        "has" => parser_filters::parse_has_filter(tokens, line_idx),
        "no" => parser_filters::parse_no_filter(tokens, line_idx),
        "is" => parser_filters::parse_is_filter(tokens, line_idx),
        "id" => parser_filters::parse_id_filter(tokens, line_idx),
        "recurrence" => parser_filters::parse_recurrence_filter(tokens, line_idx),
        _ => Err(ParseError {
            message: format!("Unknown instruction: {}", first),
            line: line_idx,
        }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::task_service::query_parser::lexer::tokenize;

    fn parse_query(input: &str) -> Result<Query, ParseError> {
        let lines = tokenize(input);
        parse(&lines)
    }

    #[test]
    fn test_parse_not_done() {
        let q = parse_query("not done").unwrap();
        assert!(matches!(
            &q.instructions[0],
            Instruction::Filter(FilterExpr::Simple(Filter::Status(StatusFilter::NotDone)))
        ));
    }

    #[test]
    fn test_parse_sort_by_due() {
        let q = parse_query("sort by due").unwrap();
        assert!(matches!(
            &q.instructions[0],
            Instruction::Sort(SortInstruction {
                field: SortField::Due,
                reverse: false
            })
        ));
    }

    #[test]
    fn test_parse_sort_reverse() {
        let q = parse_query("sort by priority reverse").unwrap();
        if let Instruction::Sort(s) = &q.instructions[0] {
            assert!(s.reverse);
            assert!(matches!(s.field, SortField::Priority));
        } else {
            panic!("Expected sort instruction");
        }
    }

    #[test]
    fn test_parse_group_by_folder() {
        let q = parse_query("group by folder").unwrap();
        assert!(matches!(
            &q.instructions[0],
            Instruction::Group(GroupInstruction {
                field: GroupField::Folder
            })
        ));
    }

    #[test]
    fn test_parse_limit() {
        let q = parse_query("limit to 25 tasks").unwrap();
        assert!(matches!(
            &q.instructions[0],
            Instruction::Limit(LimitInstruction::Tasks(25))
        ));
    }

    #[test]
    fn test_parse_priority() {
        let q = parse_query("priority is above medium").unwrap();
        if let Instruction::Filter(FilterExpr::Simple(Filter::Priority(pf))) = &q.instructions[0] {
            assert_eq!(pf.comparison, PriorityComparison::Above);
            assert_eq!(pf.level, PriorityLevel::Medium);
        } else {
            panic!("Expected priority filter");
        }
    }

    #[test]
    fn test_parse_multi_line() {
        let q = parse_query("not done\ndue before today\nsort by due\ngroup by folder\nlimit 25")
            .unwrap();
        assert_eq!(q.instructions.len(), 5);
    }

    #[test]
    fn test_parse_is_blocked() {
        let q = parse_query("is blocked").unwrap();
        assert!(matches!(
            &q.instructions[0],
            Instruction::Filter(FilterExpr::Simple(Filter::Dependency(
                DependencyFilter::IsBlocked
            )))
        ));
    }
}
