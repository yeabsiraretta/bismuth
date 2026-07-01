//! Template pre-processing helpers.
//!
//! Handles `{{expr | pipe}}` → `{{pipe expr}}` syntax transformation
//! and nested JSON context key insertion.

/// Pre-process pipe syntax: `{{expr | helper}}` → `{{helper expr}}`.
/// Handles chained pipes: `{{expr | a | b}}` → `{{b (a expr)}}`.
/// Skips content inside `{{!-- comments --}}`.
pub fn preprocess_pipes(template: &str) -> String {
    let mut result = String::new();
    let mut chars = template.chars().peekable();

    while let Some(ch) = chars.next() {
        if ch == '{' && chars.peek() == Some(&'{') {
            chars.next(); // consume second {
            let mut expr = String::new();
            let mut found_close = false;

            while let Some(c) = chars.next() {
                if c == '}' && chars.peek() == Some(&'}') {
                    chars.next(); // consume second }
                    found_close = true;
                    break;
                }
                expr.push(c);
            }

            if !found_close {
                result.push_str("{{");
                result.push_str(&expr);
                continue;
            }

            let trimmed = expr.trim();

            // Skip comments, blocks (#if, /if), and raw blocks
            if trimmed.starts_with("!--")
                || trimmed.starts_with('#')
                || trimmed.starts_with('/')
                || trimmed.starts_with('>')
            {
                result.push_str("{{");
                result.push_str(&expr);
                result.push_str("}}");
                continue;
            }

            // Check for pipe syntax
            if trimmed.contains('|') {
                let parts: Vec<&str> = trimmed.split('|').map(|s| s.trim()).collect();
                if parts.len() >= 2 {
                    let base_expr = parts[0];
                    let transformed = apply_pipe_chain(base_expr, &parts[1..]);
                    result.push_str("{{");
                    result.push_str(&transformed);
                    result.push_str("}}");
                    continue;
                }
            }

            // No pipe — pass through unchanged
            result.push_str("{{");
            result.push_str(&expr);
            result.push_str("}}");
        } else {
            result.push(ch);
        }
    }

    result
}

/// Transform chained pipes into nested helper calls.
pub fn apply_pipe_chain(base: &str, pipes: &[&str]) -> String {
    if pipes.is_empty() {
        return base.to_string();
    }

    let (first_func, first_arg) = pipes[0].split_once(':')
        .map(|(f, a)| (f.trim(), Some(a.trim())))
        .unwrap_or((pipes[0], None));

    let mut current = if let Some(a) = first_arg {
        format!("{} {} \"{}\"", first_func, base, a)
    } else {
        format!("{} {}", first_func, base)
    };

    for pipe in &pipes[1..] {
        let (func, arg) = pipe.split_once(':')
            .map(|(f, a)| (f.trim(), Some(a.trim())))
            .unwrap_or((*pipe, None));
        if let Some(a) = arg {
            current = format!("{} ({}) \"{}\"", func, current, a);
        } else {
            current = format!("{} ({})", func, current);
        }
    }
    current
}

/// Insert a value at a nested path in a JSON map.
pub(super) fn insert_nested(
    map: &mut serde_json::Map<String, serde_json::Value>,
    parts: &[&str],
    value: &str,
) {
    if parts.len() == 1 {
        map.insert(parts[0].to_string(), serde_json::Value::String(value.to_string()));
        return;
    }
    let entry = map.entry(parts[0].to_string())
        .or_insert_with(|| serde_json::Value::Object(serde_json::Map::new()));
    if let serde_json::Value::Object(ref mut inner) = entry {
        insert_nested(inner, &parts[1..], value);
    }
}
