//! System builtin module for templates.
//!
//! Provides: uuid, timestamp, cursor, random_id.
//! Security: No network access, no file writes.

use uuid::Uuid;

/// Dispatch a system.* function call.
pub fn call(func: &str) -> Option<String> {
    match func {
        "uuid" => Some(Uuid::new_v4().to_string()),
        "timestamp" => Some(chrono::Local::now().timestamp().to_string()),
        "timestamp_ms" => Some(chrono::Local::now().timestamp_millis().to_string()),
        "cursor" => Some("$CURSOR$".to_string()),
        "newline" => Some("\n".to_string()),
        "tab" => Some("\t".to_string()),
        "random_id" => {
            // Use first 8 chars of a UUID v4 (hex) as a short random ID
            let full = Uuid::new_v4().to_string();
            Some(full[..8].to_string())
        }
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_uuid() {
        let result = call("uuid").unwrap();
        assert_eq!(result.len(), 36);
        assert!(result.contains('-'));
    }

    #[test]
    fn test_timestamp() {
        let result = call("timestamp").unwrap();
        assert!(result.parse::<i64>().is_ok());
    }

    #[test]
    fn test_cursor_marker() {
        assert_eq!(call("cursor").unwrap(), "$CURSOR$");
    }

    #[test]
    fn test_random_id() {
        let result = call("random_id").unwrap();
        assert_eq!(result.len(), 8);
    }
}
