//! Query DSL lexer — tokenizes query lines into instruction tokens.

use super::lexer_helpers::{find_closing_braces, is_date, parse_quoted_string, try_parse_regex};
use super::lexer_tokens::KEYWORDS;

pub use super::lexer_tokens::{BoolOperator, Token, TokenLine};

/// Tokenize a single query line into a `TokenLine`.
pub fn tokenize_line(line: &str) -> TokenLine {
    let raw = line.to_string();
    let trimmed = line.trim();

    // Comment lines
    if trimmed.starts_with('#') {
        return TokenLine {
            tokens: vec![Token::Comment(trimmed[1..].trim().to_string())],
            raw,
        };
    }

    let mut tokens = Vec::new();
    let chars: Vec<char> = trimmed.chars().collect();
    let len = chars.len();
    let mut i = 0;

    while i < len {
        let ch = chars[i];

        // Skip whitespace
        if ch.is_whitespace() {
            i += 1;
            continue;
        }

        // Parentheses
        if ch == '(' {
            tokens.push(Token::LParen);
            i += 1;
            continue;
        }
        if ch == ')' {
            tokens.push(Token::RParen);
            i += 1;
            continue;
        }

        // Template variable {{...}}
        if ch == '{' && i + 1 < len && chars[i + 1] == '{' {
            let start = i + 2;
            if let Some(end) = find_closing_braces(&chars, start) {
                let var: String = chars[start..end].iter().collect();
                tokens.push(Token::TemplateVar(var));
                i = end + 2;
                continue;
            }
        }

        // Regex literal /pattern/flags
        if ch == '/' {
            if let Some((pattern, flags, end_idx)) = try_parse_regex(&chars, i) {
                tokens.push(Token::Regex { pattern, flags });
                i = end_idx;
                continue;
            }
        }

        // Quoted string
        if ch == '"' || ch == '\'' {
            let (s, end_idx) = parse_quoted_string(&chars, i);
            tokens.push(Token::StringLit(s));
            i = end_idx;
            continue;
        }

        // Word or number
        let start = i;
        while i < len && !chars[i].is_whitespace() && chars[i] != '(' && chars[i] != ')' {
            i += 1;
        }
        let word: String = chars[start..i].iter().collect();

        // Check if it's a date
        if is_date(&word) {
            tokens.push(Token::Date(word));
        // Check if it's a number
        } else if let Ok(n) = word.parse::<u32>() {
            tokens.push(Token::Number(n));
        // Check boolean operators (case-insensitive)
        } else if let Some(bop) = match_bool_op(&word, &tokens) {
            tokens.push(Token::BoolOp(bop));
        // Check keywords
        } else if KEYWORDS.contains(&word.to_lowercase().as_str()) {
            tokens.push(Token::Keyword(word.to_lowercase()));
        // Otherwise it's a string value
        } else {
            tokens.push(Token::StringLit(word));
        }
    }

    TokenLine { tokens, raw }
}

/// Tokenize a multi-line query string.
pub fn tokenize(query: &str) -> Vec<TokenLine> {
    query.lines().map(tokenize_line).collect()
}

fn match_bool_op(word: &str, preceding: &[Token]) -> Option<BoolOperator> {
    let after_paren = matches!(preceding.last(), Some(Token::RParen));
    match word.to_uppercase().as_str() {
        "AND" if after_paren => Some(BoolOperator::And),
        "OR" if after_paren => Some(BoolOperator::Or),
        "NOT" if after_paren => Some(BoolOperator::Not),
        "XOR" if after_paren => Some(BoolOperator::Xor),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tokenize_simple_filter() {
        let line = tokenize_line("not done");
        assert_eq!(line.tokens.len(), 2);
        assert_eq!(line.tokens[0], Token::Keyword("not".to_string()));
        assert_eq!(line.tokens[1], Token::Keyword("done".to_string()));
    }

    #[test]
    fn test_tokenize_date_filter() {
        let line = tokenize_line("due before 2024-12-31");
        assert_eq!(line.tokens[0], Token::Keyword("due".to_string()));
        assert_eq!(line.tokens[1], Token::Keyword("before".to_string()));
        assert_eq!(line.tokens[2], Token::Date("2024-12-31".to_string()));
    }

    #[test]
    fn test_tokenize_sort() {
        let line = tokenize_line("sort by priority reverse");
        assert_eq!(line.tokens.len(), 4);
        assert_eq!(line.tokens[0], Token::Keyword("sort".to_string()));
        assert_eq!(line.tokens[1], Token::Keyword("by".to_string()));
        assert_eq!(line.tokens[2], Token::Keyword("priority".to_string()));
        assert_eq!(line.tokens[3], Token::Keyword("reverse".to_string()));
    }

    #[test]
    fn test_tokenize_regex() {
        let line = tokenize_line("description regex matches /buy.*milk/i");
        assert!(line
            .tokens
            .iter()
            .any(|t| matches!(t, Token::Regex { pattern, flags }
            if pattern == "buy.*milk" && flags == "i")));
    }

    #[test]
    fn test_tokenize_limit() {
        let line = tokenize_line("limit to 25 tasks");
        assert!(line.tokens.contains(&Token::Number(25)));
    }

    #[test]
    fn test_tokenize_comment() {
        let line = tokenize_line("# This is a comment");
        assert_eq!(
            line.tokens[0],
            Token::Comment("This is a comment".to_string())
        );
    }

    #[test]
    fn test_tokenize_template_var() {
        let line = tokenize_line("path includes {{query.file.folder}}");
        assert!(line
            .tokens
            .contains(&Token::TemplateVar("query.file.folder".to_string())));
    }

    #[test]
    fn test_tokenize_boolean() {
        let line = tokenize_line("(due before today) AND (priority is high)");
        assert!(line.tokens.contains(&Token::LParen));
        assert!(line.tokens.contains(&Token::RParen));
        assert!(line.tokens.contains(&Token::BoolOp(BoolOperator::And)));
    }

    #[test]
    fn test_tokenize_string_value() {
        let line = tokenize_line("path includes projects/alpha");
        // "projects/alpha" is not a keyword, so it's a StringLit
        assert!(line
            .tokens
            .contains(&Token::StringLit("projects/alpha".to_string())));
    }

    #[test]
    fn test_tokenize_multiline() {
        let query = "not done\ndue before today\nsort by due";
        let lines = tokenize(query);
        assert_eq!(lines.len(), 3);
    }
}
