//! Date, path, and description filter parsers for the task query DSL.

use super::ast::*;
use super::lexer::Token;
use super::parser::ParseError;
use super::parser_utils::{keyword_str, parse_string_matcher, token_as_str};

pub fn parse_date_filter(tokens: &[Token], line_idx: usize) -> Result<Instruction, ParseError> {
    if tokens.len() < 2 {
        return Err(ParseError {
            message: "Incomplete date filter".into(),
            line: line_idx,
        });
    }

    let field = match keyword_str(&tokens[0]).as_str() {
        "due" => DateField::Due,
        "done" => DateField::Done,
        "created" => DateField::Created,
        "start" => DateField::Start,
        "scheduled" => DateField::Scheduled,
        "cancelled" => DateField::Cancelled,
        "happens" => DateField::Happens,
        _ => {
            return Err(ParseError {
                message: "Unknown date field".into(),
                line: line_idx,
            })
        },
    };

    let keywords: Vec<String> = tokens.iter().map(|t| keyword_str(t)).collect();
    if keywords.contains(&"invalid".to_string()) {
        return Ok(Instruction::Filter(FilterExpr::Simple(Filter::Date(
            DateFilter {
                field,
                condition: DateCondition::IsInvalid,
            },
        ))));
    }

    let (condition, _) = parse_date_condition(&tokens[1..], line_idx)?;
    Ok(Instruction::Filter(FilterExpr::Simple(Filter::Date(
        DateFilter { field, condition },
    ))))
}

fn parse_date_condition(
    tokens: &[Token],
    line_idx: usize,
) -> Result<(DateCondition, usize), ParseError> {
    if tokens.is_empty() {
        return Err(ParseError {
            message: "Expected date condition".into(),
            line: line_idx,
        });
    }
    let keywords: Vec<String> = tokens.iter().map(|t| keyword_str(t)).collect();
    let kw_str = keywords.join(" ");

    let (condition_builder, value_start): (Box<dyn Fn(DateValue) -> DateCondition>, usize) =
        if kw_str.starts_with("on or before") {
            (Box::new(DateCondition::OnOrBefore), 3)
        } else if kw_str.starts_with("on or after") {
            (Box::new(DateCondition::OnOrAfter), 3)
        } else if kw_str.starts_with("before") {
            (Box::new(DateCondition::Before), 1)
        } else if kw_str.starts_with("after") {
            (Box::new(DateCondition::After), 1)
        } else if kw_str.starts_with("on") {
            (Box::new(DateCondition::On), 1)
        } else if kw_str.starts_with("in") {
            let date_value = parse_date_value(&tokens[1..], line_idx)?;
            return Ok((DateCondition::On(date_value), tokens.len()));
        } else {
            return Err(ParseError {
                message: format!("Unknown date operator: {}", kw_str),
                line: line_idx,
            });
        };

    let date_value = parse_date_value(&tokens[value_start..], line_idx)?;
    Ok((condition_builder(date_value), tokens.len()))
}

fn parse_date_value(tokens: &[Token], line_idx: usize) -> Result<DateValue, ParseError> {
    if tokens.is_empty() {
        return Err(ParseError {
            message: "Expected date value".into(),
            line: line_idx,
        });
    }
    if let Token::TemplateVar(v) = &tokens[0] {
        return Ok(DateValue::TemplateVar(v.clone()));
    }
    if let Token::Date(d) = &tokens[0] {
        return Ok(DateValue::Absolute(d.clone()));
    }

    let strs: Vec<&str> = tokens.iter().map(|t| token_as_str(t)).collect();
    if let Some((rel, _)) = super::date_parser::parse_relative_date(&strs) {
        return Ok(DateValue::Relative(rel));
    }
    match strs.join(" ").as_str() {
        "today" => Ok(DateValue::Relative(RelativeDate::Today)),
        "yesterday" => Ok(DateValue::Relative(RelativeDate::Yesterday)),
        "tomorrow" => Ok(DateValue::Relative(RelativeDate::Tomorrow)),
        other => Err(ParseError {
            message: format!("Cannot parse date value: {}", other),
            line: line_idx,
        }),
    }
}

pub fn parse_path_filter(tokens: &[Token], line_idx: usize) -> Result<Instruction, ParseError> {
    if tokens.len() < 3 {
        return Err(ParseError {
            message: "Incomplete path filter".into(),
            line: line_idx,
        });
    }
    let field = match keyword_str(&tokens[0]).as_str() {
        "path" => PathField::Path,
        "root" => PathField::Root,
        "folder" => PathField::Folder,
        "filename" => PathField::Filename,
        "heading" => PathField::Heading,
        _ => {
            return Err(ParseError {
                message: "Unknown path field".into(),
                line: line_idx,
            })
        },
    };
    let matcher = parse_string_matcher(&tokens[1..], line_idx)?;
    Ok(Instruction::Filter(FilterExpr::Simple(Filter::Path(
        PathFilter { field, matcher },
    ))))
}

pub fn parse_description_filter(
    tokens: &[Token],
    line_idx: usize,
) -> Result<Instruction, ParseError> {
    if tokens.len() < 3 {
        return Err(ParseError {
            message: "Incomplete description filter".into(),
            line: line_idx,
        });
    }
    let matcher = parse_string_matcher(&tokens[1..], line_idx)?;
    Ok(Instruction::Filter(FilterExpr::Simple(
        Filter::Description(StringFilter { matcher }),
    )))
}
