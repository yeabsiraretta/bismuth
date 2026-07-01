//! Filter parsing functions for the task query DSL.
//!
//! Date, path, and description filters are in parser_filters_date.

use super::ast::*;
use super::lexer::Token;
use super::parser::ParseError;
use super::parser_utils::{collect_value_tokens, keyword_str, parse_string_matcher};

pub use super::parser_filters_date::{
    parse_date_filter, parse_description_filter, parse_path_filter,
};

// --- Status filters ---

pub fn parse_not_filter(tokens: &[Token], line_idx: usize) -> Result<Instruction, ParseError> {
    if tokens.len() < 2 {
        return Err(ParseError {
            message: "'not' requires a filter".into(),
            line: line_idx,
        });
    }
    let second = keyword_str(&tokens[1]);
    if second == "done" {
        return Ok(Instruction::Filter(FilterExpr::Simple(Filter::Status(
            StatusFilter::NotDone,
        ))));
    }
    let inner = super::parser::parse_instruction_inner(&tokens[1..], line_idx)?;
    if let Instruction::Filter(expr) = inner {
        Ok(Instruction::Filter(FilterExpr::Not(Box::new(expr))))
    } else {
        Err(ParseError {
            message: "'not' can only negate filters".into(),
            line: line_idx,
        })
    }
}

pub fn parse_status_filter(tokens: &[Token], line_idx: usize) -> Result<Instruction, ParseError> {
    if tokens.len() < 3 {
        return Err(ParseError {
            message: "Incomplete status filter".into(),
            line: line_idx,
        });
    }
    let second = keyword_str(&tokens[1]);
    if second.contains("type") || (tokens.len() > 2 && keyword_str(&tokens[2]) == "type") {
        let value = collect_value_tokens(&tokens[3..]);
        let is_not = tokens.iter().any(|t| keyword_str(t) == "not");
        let match_val = value.to_uppercase();
        return Ok(Instruction::Filter(FilterExpr::Simple(Filter::Status(
            StatusFilter::StatusType(if is_not {
                StatusTypeMatch::IsNot(match_val)
            } else {
                StatusTypeMatch::Is(match_val)
            }),
        ))));
    }
    let symbol = keyword_str(&tokens[1]);
    let is_not = tokens.iter().any(|t| keyword_str(t) == "not");
    match symbol.as_str() {
        "done" => Ok(Instruction::Filter(FilterExpr::Simple(Filter::Status(
            if is_not {
                StatusFilter::NotDone
            } else {
                StatusFilter::Done
            },
        )))),
        _ => Err(ParseError {
            message: format!("Unknown status: {}", symbol),
            line: line_idx,
        }),
    }
}

// --- Priority filters ---

pub fn parse_priority_filter(tokens: &[Token], line_idx: usize) -> Result<Instruction, ParseError> {
    if tokens.len() < 4 {
        return Err(ParseError {
            message: "Incomplete priority filter".into(),
            line: line_idx,
        });
    }
    let keywords: Vec<String> = tokens.iter().map(|t| keyword_str(t)).collect();
    let comparison = if keywords.contains(&"above".to_string()) {
        PriorityComparison::Above
    } else if keywords.contains(&"below".to_string()) {
        PriorityComparison::Below
    } else if keywords.contains(&"not".to_string()) {
        PriorityComparison::IsNot
    } else {
        PriorityComparison::Is
    };
    let level_str = keywords.last().map(|s| s.as_str()).unwrap_or("");
    let level = match level_str {
        "lowest" => PriorityLevel::Lowest,
        "low" => PriorityLevel::Low,
        "none" | "normal" => PriorityLevel::None,
        "medium" => PriorityLevel::Medium,
        "high" => PriorityLevel::High,
        "highest" => PriorityLevel::Highest,
        _ => {
            return Err(ParseError {
                message: format!("Unknown priority: {}", level_str),
                line: line_idx,
            })
        },
    };
    Ok(Instruction::Filter(FilterExpr::Simple(Filter::Priority(
        PriorityFilter { comparison, level },
    ))))
}

// --- Tag filters ---

pub fn parse_tag_filter(tokens: &[Token], line_idx: usize) -> Result<Instruction, ParseError> {
    if tokens.len() < 2 {
        return Err(ParseError {
            message: "Incomplete tag filter".into(),
            line: line_idx,
        });
    }
    let matcher = parse_string_matcher(&tokens[1..], line_idx)?;
    Ok(Instruction::Filter(FilterExpr::Simple(Filter::Tag(
        TagFilter::Includes(matcher),
    ))))
}

// --- Has/No filters ---

pub fn parse_has_filter(tokens: &[Token], line_idx: usize) -> Result<Instruction, ParseError> {
    if tokens.len() < 2 {
        return Err(ParseError {
            message: "'has' requires a target".into(),
            line: line_idx,
        });
    }
    let target = keyword_str(&tokens[1]);
    match target.as_str() {
        "tags" => Ok(Instruction::Filter(FilterExpr::Simple(Filter::Tag(
            TagFilter::HasTags,
        )))),
        "id" => Ok(Instruction::Filter(FilterExpr::Simple(Filter::Dependency(
            DependencyFilter::HasId,
        )))),
        "depends" => Ok(Instruction::Filter(FilterExpr::Simple(Filter::Dependency(
            DependencyFilter::HasDependsOn,
        )))),
        "due" | "start" | "scheduled" | "created" | "done" | "cancelled" => Ok(
            Instruction::Filter(FilterExpr::Simple(Filter::Date(DateFilter {
                field: date_field_from_str(&target),
                condition: DateCondition::HasDate,
            }))),
        ),
        _ => Err(ParseError {
            message: format!("Unknown 'has' target: {}", target),
            line: line_idx,
        }),
    }
}

pub fn parse_no_filter(tokens: &[Token], line_idx: usize) -> Result<Instruction, ParseError> {
    if tokens.len() < 2 {
        return Err(ParseError {
            message: "'no' requires a target".into(),
            line: line_idx,
        });
    }
    let target = keyword_str(&tokens[1]);
    match target.as_str() {
        "tags" => Ok(Instruction::Filter(FilterExpr::Simple(Filter::Tag(
            TagFilter::NoTags,
        )))),
        "id" => Ok(Instruction::Filter(FilterExpr::Simple(Filter::Dependency(
            DependencyFilter::NoId,
        )))),
        "depends" => Ok(Instruction::Filter(FilterExpr::Simple(Filter::Dependency(
            DependencyFilter::NoDependsOn,
        )))),
        "due" | "start" | "scheduled" | "created" | "done" | "cancelled" => Ok(
            Instruction::Filter(FilterExpr::Simple(Filter::Date(DateFilter {
                field: date_field_from_str(&target),
                condition: DateCondition::NoDate,
            }))),
        ),
        _ => Err(ParseError {
            message: format!("Unknown 'no' target: {}", target),
            line: line_idx,
        }),
    }
}

// --- Is filters ---

pub fn parse_is_filter(tokens: &[Token], line_idx: usize) -> Result<Instruction, ParseError> {
    if tokens.len() < 2 {
        return Err(ParseError {
            message: "'is' requires a predicate".into(),
            line: line_idx,
        });
    }
    let combined: String = tokens
        .iter()
        .map(|t| keyword_str(t))
        .collect::<Vec<_>>()
        .join(" ");
    if combined.contains("not blocked") {
        return Ok(Instruction::Filter(FilterExpr::Simple(Filter::Dependency(
            DependencyFilter::IsNotBlocked,
        ))));
    }
    if combined.contains("blocked") {
        return Ok(Instruction::Filter(FilterExpr::Simple(Filter::Dependency(
            DependencyFilter::IsBlocked,
        ))));
    }
    if combined.contains("not blocking") {
        return Ok(Instruction::Filter(FilterExpr::Simple(Filter::Dependency(
            DependencyFilter::IsNotBlocking,
        ))));
    }
    if combined.contains("blocking") {
        return Ok(Instruction::Filter(FilterExpr::Simple(Filter::Dependency(
            DependencyFilter::IsBlocking,
        ))));
    }
    if combined.contains("not recurring") {
        return Ok(Instruction::Filter(FilterExpr::Simple(Filter::Recurrence(
            RecurrenceFilter::IsNotRecurring,
        ))));
    }
    if combined.contains("recurring") {
        return Ok(Instruction::Filter(FilterExpr::Simple(Filter::Recurrence(
            RecurrenceFilter::IsRecurring,
        ))));
    }
    Err(ParseError {
        message: format!("Unknown 'is' predicate: {}", combined),
        line: line_idx,
    })
}

// --- ID / Recurrence filters ---

pub fn parse_id_filter(tokens: &[Token], line_idx: usize) -> Result<Instruction, ParseError> {
    if tokens.len() < 2 {
        return Err(ParseError {
            message: "Incomplete id filter".into(),
            line: line_idx,
        });
    }
    let matcher = parse_string_matcher(&tokens[1..], line_idx)?;
    Ok(Instruction::Filter(FilterExpr::Simple(Filter::Dependency(
        DependencyFilter::IdMatches(matcher),
    ))))
}

pub fn parse_recurrence_filter(
    tokens: &[Token],
    line_idx: usize,
) -> Result<Instruction, ParseError> {
    if tokens.len() < 2 {
        return Err(ParseError {
            message: "Incomplete recurrence filter".into(),
            line: line_idx,
        });
    }
    let matcher = parse_string_matcher(&tokens[1..], line_idx)?;
    Ok(Instruction::Filter(FilterExpr::Simple(Filter::Recurrence(
        RecurrenceFilter::Matches(matcher),
    ))))
}

fn date_field_from_str(s: &str) -> DateField {
    match s {
        "due" => DateField::Due,
        "start" => DateField::Start,
        "scheduled" => DateField::Scheduled,
        "created" => DateField::Created,
        "done" => DateField::Done,
        "cancelled" => DateField::Cancelled,
        _ => unreachable!(),
    }
}
