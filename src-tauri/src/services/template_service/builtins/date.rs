//! Date builtin module for templates.
//!
//! Provides: now, today, tomorrow, yesterday, weekStart, monthStart, yearStart, format.

use chrono::{Local, Datelike, Duration, NaiveDate};

/// Dispatch a date.* function call.
pub fn call(func: &str) -> Option<String> {
    let now = Local::now();
    match func {
        "now" => Some(now.format("%Y-%m-%d %H:%M:%S").to_string()),
        "today" => Some(now.format("%Y-%m-%d").to_string()),
        "tomorrow" => {
            let d = now + Duration::days(1);
            Some(d.format("%Y-%m-%d").to_string())
        }
        "yesterday" => {
            let d = now - Duration::days(1);
            Some(d.format("%Y-%m-%d").to_string())
        }
        "weekStart" | "week_start" => {
            let weekday = now.weekday().num_days_from_monday();
            let start = now - Duration::days(weekday as i64);
            Some(start.format("%Y-%m-%d").to_string())
        }
        "monthStart" | "month_start" => {
            let d = NaiveDate::from_ymd_opt(now.year(), now.month(), 1)
                .unwrap_or(now.date_naive());
            Some(d.format("%Y-%m-%d").to_string())
        }
        "yearStart" | "year_start" => {
            let d = NaiveDate::from_ymd_opt(now.year(), 1, 1)
                .unwrap_or(now.date_naive());
            Some(d.format("%Y-%m-%d").to_string())
        }
        "year" => Some(now.format("%Y").to_string()),
        "month" => Some(now.format("%m").to_string()),
        "day" => Some(now.format("%d").to_string()),
        "time" => Some(now.format("%H:%M").to_string()),
        "isoWeek" | "iso_week" => Some(now.iso_week().week().to_string()),
        "dayOfWeek" | "day_of_week" => Some(now.weekday().to_string()),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_date_today() {
        let result = call("today").unwrap();
        assert_eq!(result.len(), 10); // YYYY-MM-DD
        assert!(result.contains('-'));
    }

    #[test]
    fn test_date_now() {
        let result = call("now").unwrap();
        assert!(result.contains(' ')); // date + time
    }

    #[test]
    fn test_unknown_function() {
        assert!(call("nonexistent").is_none());
    }
}
