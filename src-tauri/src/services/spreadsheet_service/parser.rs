//! CSV/TSV tokeniser and JSON-table normaliser (Spec 042).
//! Parses RFC 4180 CSV (configurable delimiter, CRLF/LF) and JSON
//! array-of-objects / array-of-arrays into two-dimensional cell grids.

use std::io::{Cursor, Write};

// ─── Errors ──────────────────────────────────────────────────────────────────

#[derive(Debug)]
pub enum ParseError {
    Io(std::io::Error),
    Json(serde_json::Error),
    InvalidStructure(String),
}

impl std::fmt::Display for ParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ParseError::Io(e) => write!(f, "IO error: {}", e),
            ParseError::Json(e) => write!(f, "JSON error: {}", e),
            ParseError::InvalidStructure(msg) => write!(f, "Invalid structure: {}", msg),
        }
    }
}

impl From<std::io::Error> for ParseError {
    fn from(e: std::io::Error) -> Self { ParseError::Io(e) }
}

impl From<serde_json::Error> for ParseError {
    fn from(e: serde_json::Error) -> Self { ParseError::Json(e) }
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

/// Parses a CSV/TSV string into a 2-D grid.
/// `delimiter` is the field separator byte (e.g. `b','`, `b'\t'`).
pub fn parse_csv(content: &str, delimiter: u8) -> Result<Vec<Vec<String>>, ParseError> {
    let mut rows: Vec<Vec<String>> = Vec::new();
    let mut current_row: Vec<String> = Vec::new();
    let mut field = String::new();
    let mut in_quotes = false;
    let bytes = content.as_bytes();
    let mut i = 0;

    while i < bytes.len() {
        let b = bytes[i];
        if in_quotes {
            if b == b'"' {
                // Peek ahead for escaped quote (`""`)
                if i + 1 < bytes.len() && bytes[i + 1] == b'"' {
                    field.push('"');
                    i += 2;
                    continue;
                } else {
                    in_quotes = false;
                }
            } else {
                field.push(b as char);
            }
        } else {
            match b {
                b'"' => {
                    in_quotes = true;
                }
                b'\r' => {
                    // CR — peek for CRLF
                    current_row.push(field.clone());
                    field.clear();
                    rows.push(current_row.clone());
                    current_row.clear();
                    if i + 1 < bytes.len() && bytes[i + 1] == b'\n' {
                        i += 1;
                    }
                }
                b'\n' => {
                    current_row.push(field.clone());
                    field.clear();
                    rows.push(current_row.clone());
                    current_row.clear();
                }
                d if d == delimiter => {
                    current_row.push(field.clone());
                    field.clear();
                }
                _ => {
                    field.push(b as char);
                }
            }
        }
        i += 1;
    }

    // Flush any trailing content
    if !field.is_empty() || !current_row.is_empty() {
        current_row.push(field);
        rows.push(current_row);
    }

    // Remove completely empty trailing rows
    while rows.last().map_or(false, |r| r.iter().all(|c| c.is_empty())) {
        rows.pop();
    }

    Ok(rows)
}

/// Serialises a two-dimensional string grid to CSV (comma-delimited, RFC 4180).
///
/// Fields containing commas, double-quotes, or newlines are quoted.
pub fn serialize_csv(rows: &[Vec<String>]) -> Result<Vec<u8>, ParseError> {
    let mut buf = Cursor::new(Vec::new());
    for (r_idx, row) in rows.iter().enumerate() {
        for (c_idx, field) in row.iter().enumerate() {
            if c_idx > 0 {
                buf.write_all(b",")?;
            }
            let needs_quoting =
                field.contains(',') || field.contains('"') || field.contains('\n') || field.contains('\r');
            if needs_quoting {
                buf.write_all(b"\"")?;
                buf.write_all(field.replace('"', "\"\"").as_bytes())?;
                buf.write_all(b"\"")?;
            } else {
                buf.write_all(field.as_bytes())?;
            }
        }
        if r_idx < rows.len() - 1 {
            buf.write_all(b"\n")?;
        }
    }
    Ok(buf.into_inner())
}

// ─── JSON Table Normaliser ────────────────────────────────────────────────────

/// Parses JSON to a 2-D grid of `serde_json::Value`.
/// Accepts array-of-objects (produces header row) or array-of-arrays (as-is).
pub fn parse_json_table(content: &str) -> Result<Vec<Vec<serde_json::Value>>, ParseError> {
    let value: serde_json::Value = serde_json::from_str(content)?;
    match value {
        serde_json::Value::Array(arr) => {
            if arr.is_empty() {
                return Ok(vec![]);
            }
            match &arr[0] {
                serde_json::Value::Array(_) => {
                    // Already a 2-D array
                    let rows = arr
                        .into_iter()
                        .map(|row| match row {
                            serde_json::Value::Array(cells) => cells,
                            other => vec![other],
                        })
                        .collect();
                    Ok(rows)
                }
                serde_json::Value::Object(first_obj) => {
                    // Build header from the first object's keys
                    let headers: Vec<String> = first_obj.keys().cloned().collect();
                    let mut rows: Vec<Vec<serde_json::Value>> = Vec::new();
                    // Header row
                    rows.push(
                        headers
                            .iter()
                            .map(|h| serde_json::Value::String(h.clone()))
                            .collect(),
                    );
                    // Data rows
                    for item in arr {
                        match item {
                            serde_json::Value::Object(obj) => {
                                let row: Vec<serde_json::Value> = headers
                                    .iter()
                                    .map(|h| obj.get(h).cloned().unwrap_or(serde_json::Value::Null))
                                    .collect();
                                rows.push(row);
                            }
                            _ => {
                                return Err(ParseError::InvalidStructure(
                                    "Mixed array-of-objects and non-object entries".to_string(),
                                ))
                            }
                        }
                    }
                    Ok(rows)
                }
                _ => Err(ParseError::InvalidStructure(
                    "Expected array-of-objects or array-of-arrays".to_string(),
                )),
            }
        }
        _ => Err(ParseError::InvalidStructure(
            "Top-level value must be a JSON array".to_string(),
        )),
    }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    // ── CSV ──

    #[test]
    fn test_parse_csv_basic() {
        let rows = parse_csv("a,b,c\n1,2,3\n", b',').unwrap();
        assert_eq!(rows, vec![vec!["a", "b", "c"], vec!["1", "2", "3"]]);
    }

    #[test]
    fn test_parse_csv_quoted_fields() {
        let rows = parse_csv("\"hello, world\",b\n1,2\n", b',').unwrap();
        assert_eq!(rows[0][0], "hello, world");
    }

    #[test]
    fn test_parse_csv_escaped_quotes() {
        let rows = parse_csv("\"he said \"\"hi\"\"\",b\n", b',').unwrap();
        assert_eq!(rows[0][0], "he said \"hi\"");
    }

    #[test]
    fn test_parse_csv_empty_cells() {
        let rows = parse_csv("a,,c\n,2,\n", b',').unwrap();
        assert_eq!(rows[0], vec!["a", "", "c"]);
        assert_eq!(rows[1], vec!["", "2", ""]);
    }

    #[test]
    fn test_parse_csv_tab_delimiter() {
        let rows = parse_csv("a\tb\tc\n1\t2\t3\n", b'\t').unwrap();
        assert_eq!(rows[0], vec!["a", "b", "c"]);
    }

    #[test]
    fn test_parse_csv_crlf() {
        let rows = parse_csv("a,b\r\n1,2\r\n", b',').unwrap();
        assert_eq!(rows.len(), 2);
        assert_eq!(rows[1], vec!["1", "2"]);
    }

    #[test]
    fn test_parse_csv_no_trailing_newline() {
        let rows = parse_csv("a,b\n1,2", b',').unwrap();
        assert_eq!(rows.len(), 2);
    }

    #[test]
    fn test_serialize_csv_round_trip() {
        let original = vec![
            vec!["name".to_string(), "age".to_string()],
            vec!["Alice".to_string(), "30".to_string()],
            vec!["Bob, Jr.".to_string(), "25".to_string()],
        ];
        let bytes = serialize_csv(&original).unwrap();
        let back = parse_csv(std::str::from_utf8(&bytes).unwrap(), b',').unwrap();
        assert_eq!(back, original);
    }

    // ── JSON table ──

    #[test]
    fn test_parse_json_array_of_objects() {
        let json = r#"[{"name":"Alice","age":30},{"name":"Bob","age":25}]"#;
        let rows = parse_json_table(json).unwrap();
        assert_eq!(rows.len(), 3);
        assert_eq!(rows[0][0], serde_json::Value::String("name".to_string()));
        assert_eq!(rows[1][0], serde_json::Value::String("Alice".to_string()));
    }

    #[test]
    fn test_parse_json_array_of_arrays() {
        let json = r#"[[1,2],[3,4]]"#;
        let rows = parse_json_table(json).unwrap();
        assert_eq!(rows.len(), 2);
        assert_eq!(rows[0][0], serde_json::Value::Number(1.into()));
    }

    #[test]
    fn test_parse_json_empty_array() {
        let rows = parse_json_table("[]").unwrap();
        assert!(rows.is_empty());
    }

    #[test]
    fn test_parse_json_invalid_top_level() {
        let result = parse_json_table(r#"{"key":"val"}"#);
        assert!(result.is_err());
    }

    #[test]
    fn test_serialize_csv_quoted_commas() {
        let rows = vec![vec!["a,b".to_string(), "c".to_string()]];
        let bytes = serialize_csv(&rows).unwrap();
        let text = std::str::from_utf8(&bytes).unwrap();
        assert!(text.starts_with('"'));
    }
}