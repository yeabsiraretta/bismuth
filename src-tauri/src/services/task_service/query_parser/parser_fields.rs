//! Sort, group, display, and limit field parsers for the task query DSL.

use super::ast::*;
use super::lexer::Token;
use super::parser::ParseError;
use super::parser_utils::keyword_str;

pub fn parse_sort_field(
    s: &str,
    next: Option<&Token>,
    line_idx: usize,
) -> Result<SortField, ParseError> {
    match s {
        "status" => Ok(SortField::Status),
        "priority" => Ok(SortField::Priority),
        "due" => Ok(SortField::Due),
        "done" => Ok(SortField::Done),
        "created" => Ok(SortField::Created),
        "start" => Ok(SortField::Start),
        "scheduled" => Ok(SortField::Scheduled),
        "cancelled" => Ok(SortField::Cancelled),
        "happens" => Ok(SortField::Happens),
        "urgency" => Ok(SortField::Urgency),
        "path" => Ok(SortField::Path),
        "filename" => Ok(SortField::Filename),
        "heading" => Ok(SortField::Heading),
        "description" => Ok(SortField::Description),
        "recurring" => Ok(SortField::Recurring),
        "id" => Ok(SortField::Id),
        "random" => Ok(SortField::Random),
        "tag" => {
            let n = next.and_then(|t| {
                if let Token::Number(n) = t {
                    Some(*n)
                } else {
                    None
                }
            });
            Ok(SortField::Tag(n))
        },
        _ => Err(ParseError {
            message: format!("Unknown sort field: {}", s),
            line: line_idx,
        }),
    }
}

pub fn parse_group_field(s: &str, line_idx: usize) -> Result<GroupField, ParseError> {
    match s {
        "status" => Ok(GroupField::Status),
        "priority" => Ok(GroupField::Priority),
        "due" => Ok(GroupField::Due),
        "done" => Ok(GroupField::Done),
        "created" => Ok(GroupField::Created),
        "start" => Ok(GroupField::Start),
        "scheduled" => Ok(GroupField::Scheduled),
        "cancelled" => Ok(GroupField::Cancelled),
        "happens" => Ok(GroupField::Happens),
        "urgency" => Ok(GroupField::Urgency),
        "path" => Ok(GroupField::Path),
        "root" => Ok(GroupField::Root),
        "folder" => Ok(GroupField::Folder),
        "filename" => Ok(GroupField::Filename),
        "heading" => Ok(GroupField::Heading),
        "backlink" => Ok(GroupField::Backlink),
        "tags" => Ok(GroupField::Tags),
        "recurring" => Ok(GroupField::Recurring),
        "recurrence" => Ok(GroupField::Recurrence),
        "id" => Ok(GroupField::Id),
        _ => Err(ParseError {
            message: format!("Unknown group field: {}", s),
            line: line_idx,
        }),
    }
}

pub fn parse_display_field(tokens: &[Token], line_idx: usize) -> Result<DisplayField, ParseError> {
    let combined: String = tokens
        .iter()
        .map(|t| keyword_str(t))
        .collect::<Vec<_>>()
        .join(" ");
    match combined.as_str() {
        "id" => Ok(DisplayField::Id),
        "depends on" => Ok(DisplayField::DependsOn),
        "done date" => Ok(DisplayField::DoneDate),
        "created date" => Ok(DisplayField::CreatedDate),
        "start date" => Ok(DisplayField::StartDate),
        "scheduled date" => Ok(DisplayField::ScheduledDate),
        "due date" => Ok(DisplayField::DueDate),
        "cancelled date" => Ok(DisplayField::CancelledDate),
        "priority" => Ok(DisplayField::Priority),
        "recurrence rule" => Ok(DisplayField::RecurrenceRule),
        "tags" => Ok(DisplayField::Tags),
        "backlink" => Ok(DisplayField::Backlink),
        "edit button" => Ok(DisplayField::EditButton),
        "postpone button" => Ok(DisplayField::PostponeButton),
        "task count" => Ok(DisplayField::TaskCount),
        "urgency" => Ok(DisplayField::Urgency),
        "tree" => Ok(DisplayField::Tree),
        _ => Err(ParseError {
            message: format!("Unknown display field: {}", combined),
            line: line_idx,
        }),
    }
}

pub fn parse_sort(tokens: &[Token], line_idx: usize) -> Result<Instruction, ParseError> {
    if tokens.len() < 3 {
        return Err(ParseError {
            message: "sort requires 'sort by <field>'".into(),
            line: line_idx,
        });
    }
    let field_str = keyword_str(&tokens[2]);
    let field = parse_sort_field(&field_str, tokens.get(3), line_idx)?;
    let reverse = tokens.iter().any(|t| keyword_str(t) == "reverse");
    Ok(Instruction::Sort(SortInstruction { field, reverse }))
}

pub fn parse_group(tokens: &[Token], line_idx: usize) -> Result<Instruction, ParseError> {
    if tokens.len() < 3 {
        return Err(ParseError {
            message: "group requires 'group by <field>'".into(),
            line: line_idx,
        });
    }
    let field_str = keyword_str(&tokens[2]);
    let field = parse_group_field(&field_str, line_idx)?;
    Ok(Instruction::Group(GroupInstruction { field }))
}

pub fn parse_hide(tokens: &[Token], line_idx: usize) -> Result<Instruction, ParseError> {
    if tokens.len() < 2 {
        return Err(ParseError {
            message: "hide requires a field".into(),
            line: line_idx,
        });
    }
    let field = parse_display_field(&tokens[1..], line_idx)?;
    Ok(Instruction::Display(DisplayInstruction::Hide(field)))
}

pub fn parse_show(tokens: &[Token], line_idx: usize) -> Result<Instruction, ParseError> {
    if tokens.len() < 2 {
        return Err(ParseError {
            message: "show requires a field".into(),
            line: line_idx,
        });
    }
    let field = parse_display_field(&tokens[1..], line_idx)?;
    Ok(Instruction::Display(DisplayInstruction::Show(field)))
}

pub fn parse_limit(tokens: &[Token], line_idx: usize) -> Result<Instruction, ParseError> {
    let is_groups = tokens.iter().any(|t| keyword_str(t) == "groups");
    let number = tokens.iter().find_map(|t| {
        if let Token::Number(n) = t {
            Some(*n)
        } else {
            None
        }
    });
    match number {
        Some(n) if is_groups => Ok(Instruction::Limit(LimitInstruction::Groups(n))),
        Some(n) => Ok(Instruction::Limit(LimitInstruction::Tasks(n))),
        None => Err(ParseError {
            message: "limit requires a number".into(),
            line: line_idx,
        }),
    }
}

pub fn parse_script_filter(tokens: &[Token], _line_idx: usize) -> Result<Instruction, ParseError> {
    let raw: String = tokens
        .iter()
        .map(|t| keyword_str(t))
        .collect::<Vec<_>>()
        .join(" ");
    Ok(Instruction::Filter(FilterExpr::Simple(
        Filter::ScriptFilter(raw),
    )))
}

pub fn parse_preset_stub(tokens: &[Token], _line_idx: usize) -> Result<Instruction, ParseError> {
    let name = if tokens.len() > 1 {
        keyword_str(&tokens[1])
    } else {
        "unknown".to_string()
    };
    Ok(Instruction::Comment(format!(
        "TODO: preset '{}' not yet supported",
        name
    )))
}
