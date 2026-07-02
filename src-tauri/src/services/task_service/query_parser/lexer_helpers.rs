//! Pure string/char helper functions for the query DSL lexer.
//! These have no dependencies on Token types.

pub(super) fn find_closing_braces(chars: &[char], start: usize) -> Option<usize> {
    let mut i = start;
    while i + 1 < chars.len() {
        if chars[i] == '}' && chars[i + 1] == '}' {
            return Some(i);
        }
        i += 1;
    }
    None
}

pub(super) fn try_parse_regex(chars: &[char], start: usize) -> Option<(String, String, usize)> {
    let len = chars.len();
    let mut i = start + 1;
    let mut pattern = String::new();
    let mut escaped = false;

    while i < len {
        if escaped {
            pattern.push(chars[i]);
            escaped = false;
        } else if chars[i] == '\\' {
            pattern.push(chars[i]);
            escaped = true;
        } else if chars[i] == '/' {
            i += 1;
            let mut flags = String::new();
            while i < len && chars[i].is_alphabetic() {
                flags.push(chars[i]);
                i += 1;
            }
            return Some((pattern, flags, i));
        } else {
            pattern.push(chars[i]);
        }
        i += 1;
    }
    None
}

pub(super) fn parse_quoted_string(chars: &[char], start: usize) -> (String, usize) {
    let quote = chars[start];
    let mut i = start + 1;
    let mut result = String::new();
    let len = chars.len();

    while i < len {
        if chars[i] == quote {
            return (result, i + 1);
        }
        if chars[i] == '\\' && i + 1 < len {
            i += 1;
            result.push(chars[i]);
        } else {
            result.push(chars[i]);
        }
        i += 1;
    }
    (result, i)
}

pub(super) fn is_date(s: &str) -> bool {
    if s.len() != 10 {
        return false;
    }
    let bytes = s.as_bytes();
    bytes[4] == b'-'
        && bytes[7] == b'-'
        && bytes[..4].iter().all(|b| b.is_ascii_digit())
        && bytes[5..7].iter().all(|b| b.is_ascii_digit())
        && bytes[8..10].iter().all(|b| b.is_ascii_digit())
}
