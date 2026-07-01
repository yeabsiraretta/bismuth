//! Utility functions and boolean expression parsing for the task query DSL.

use super::ast::*;
use super::lexer::{BoolOperator, Token};
use super::parser::ParseError;

// ─── Boolean expressions ─────────────────────────────────────────────────────

pub fn parse_boolean_instruction(
    tokens: &[Token],
    line_idx: usize,
) -> Result<Instruction, ParseError> {
    let expr = parse_boolean_expr(tokens, line_idx)?;
    Ok(Instruction::Filter(expr))
}

pub fn parse_boolean_expr(tokens: &[Token], line_idx: usize) -> Result<FilterExpr, ParseError> {
    // Find top-level boolean operator (not inside parens)
    let mut depth = 0;
    let mut op_idx = None;

    for (i, t) in tokens.iter().enumerate() {
        match t {
            Token::LParen => depth += 1,
            Token::RParen => depth -= 1,
            Token::BoolOp(_) if depth == 0 => {
                op_idx = Some(i);
                break;
            },
            _ => {},
        }
    }

    if let Some(idx) = op_idx {
        let left_tokens = &tokens[..idx];
        let right_tokens = &tokens[idx + 1..];
        let op = if let Token::BoolOp(op) = &tokens[idx] {
            *op
        } else {
            unreachable!()
        };

        // Check for AND NOT / OR NOT
        let (actual_op, actual_right) = if matches!(op, BoolOperator::And | BoolOperator::Or)
            && !right_tokens.is_empty()
            && matches!(&right_tokens[0], Token::BoolOp(BoolOperator::Not))
        {
            let negated_right = &right_tokens[1..];
            match op {
                BoolOperator::And => (BoolOperator::AndNot, negated_right),
                BoolOperator::Or => (BoolOperator::OrNot, negated_right),
                _ => (op, right_tokens),
            }
        } else {
            (op, right_tokens)
        };

        let left = parse_boolean_expr(left_tokens, line_idx)?;
        let right = parse_boolean_expr(actual_right, line_idx)?;

        match actual_op {
            BoolOperator::And => Ok(FilterExpr::And(Box::new(left), Box::new(right))),
            BoolOperator::Or => Ok(FilterExpr::Or(Box::new(left), Box::new(right))),
            BoolOperator::Xor => Ok(FilterExpr::Xor(Box::new(left), Box::new(right))),
            BoolOperator::Not => Ok(FilterExpr::Not(Box::new(right))),
            BoolOperator::AndNot => Ok(FilterExpr::And(
                Box::new(left),
                Box::new(FilterExpr::Not(Box::new(right))),
            )),
            BoolOperator::OrNot => Ok(FilterExpr::Or(
                Box::new(left),
                Box::new(FilterExpr::Not(Box::new(right))),
            )),
        }
    } else {
        // Strip outer parens and parse inner
        let inner = strip_parens(tokens);
        if inner.len() < tokens.len() {
            parse_boolean_expr(inner, line_idx)
        } else {
            // No parens, parse as simple filter instruction
            let instr = super::parser::parse_instruction_inner(tokens, line_idx)?;
            match instr {
                Instruction::Filter(expr) => Ok(expr),
                _ => Err(ParseError {
                    message: "Expected filter in boolean expression".into(),
                    line: line_idx,
                }),
            }
        }
    }
}

fn strip_parens(tokens: &[Token]) -> &[Token] {
    if tokens.len() >= 2 && tokens[0] == Token::LParen && tokens[tokens.len() - 1] == Token::RParen
    {
        &tokens[1..tokens.len() - 1]
    } else {
        tokens
    }
}

// ─── String matcher helpers ──────────────────────────────────────────────────

pub fn parse_string_matcher(
    tokens: &[Token],
    line_idx: usize,
) -> Result<StringMatcher, ParseError> {
    if tokens.is_empty() {
        return Err(ParseError {
            message: "Expected string matcher".into(),
            line: line_idx,
        });
    }

    let keywords: Vec<String> = tokens.iter().map(|t| keyword_str(t)).collect();
    let combined = keywords.join(" ");

    // Regex patterns
    if combined.contains("regex does not match") || combined.contains("regex does not match") {
        if let Some(regex_tok) = tokens.iter().find_map(|t| {
            if let Token::Regex { pattern, flags } = t {
                Some((pattern.clone(), flags.clone()))
            } else {
                None
            }
        }) {
            return Ok(StringMatcher::RegexDoesNotMatch(regex_tok.0, regex_tok.1));
        }
    }
    if combined.contains("regex match") {
        if let Some(regex_tok) = tokens.iter().find_map(|t| {
            if let Token::Regex { pattern, flags } = t {
                Some((pattern.clone(), flags.clone()))
            } else {
                None
            }
        }) {
            return Ok(StringMatcher::RegexMatches(regex_tok.0, regex_tok.1));
        }
    }

    // "does not include"
    if combined.contains("does not include") {
        let value = extract_string_value(tokens);
        return Ok(StringMatcher::DoesNotInclude(value));
    }

    // "includes" or "include"
    if combined.contains("include") {
        let value = extract_string_value(tokens);
        return Ok(StringMatcher::Includes(value));
    }

    // Fallback: treat remaining as includes
    let value = extract_string_value(tokens);
    Ok(StringMatcher::Includes(value))
}

pub fn extract_string_value(tokens: &[Token]) -> StringValue {
    for token in tokens.iter().rev() {
        match token {
            Token::StringLit(s) => return StringValue::Literal(s.clone()),
            Token::TemplateVar(v) => return StringValue::TemplateVar(v.clone()),
            _ => {},
        }
    }
    if let Some(last) = tokens.last() {
        StringValue::Literal(keyword_str(last))
    } else {
        StringValue::Literal(String::new())
    }
}

// ─── Token utility functions ─────────────────────────────────────────────────

pub fn keyword_str(token: &Token) -> String {
    match token {
        Token::Keyword(k) => k.clone(),
        Token::StringLit(s) => s.clone(),
        Token::Date(d) => d.clone(),
        Token::Number(n) => n.to_string(),
        Token::BoolOp(op) => match op {
            BoolOperator::And => "AND".to_string(),
            BoolOperator::Or => "OR".to_string(),
            BoolOperator::Not => "NOT".to_string(),
            BoolOperator::Xor => "XOR".to_string(),
            BoolOperator::AndNot => "AND NOT".to_string(),
            BoolOperator::OrNot => "OR NOT".to_string(),
        },
        Token::Regex { pattern, flags } => format!("/{}/{}", pattern, flags),
        Token::LParen => "(".to_string(),
        Token::RParen => ")".to_string(),
        Token::Comment(c) => format!("# {}", c),
        Token::TemplateVar(v) => format!("{{{{{}}}}}", v),
    }
}

pub fn token_as_str(token: &Token) -> &str {
    match token {
        Token::Keyword(k) => k.as_str(),
        Token::StringLit(s) => s.as_str(),
        Token::Date(d) => d.as_str(),
        _ => "",
    }
}

pub fn collect_value_tokens(tokens: &[Token]) -> String {
    tokens
        .iter()
        .filter_map(|t| match t {
            Token::Keyword(k)
                if !["is", "not", "does", "include", "includes"].contains(&k.as_str()) =>
            {
                Some(k.clone())
            },
            Token::StringLit(s) => Some(s.clone()),
            _ => None,
        })
        .collect::<Vec<_>>()
        .join(" ")
}
