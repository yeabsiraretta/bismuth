//! Relative date resolution.
//!
//! Resolves relative date expressions (today, last week, next month, etc.)
//! into absolute ISO date strings for query evaluation.

use chrono::{Datelike, Local, NaiveDate};

use super::ast::{DateUnit, DateValue, RelativeDate};

/// Resolve a `DateValue` to an absolute date string (YYYY-MM-DD).
/// For range-producing values, returns the start date.
pub fn resolve_date(value: &DateValue) -> Option<String> {
    match value {
        DateValue::Absolute(s) => Some(s.clone()),
        DateValue::Relative(rel) => resolve_relative(rel).map(|d| d.format("%Y-%m-%d").to_string()),
        DateValue::TemplateVar(_) => None, // resolved at eval time with context
    }
}

/// Resolve a `DateValue` to a date range (start, end) inclusive.
pub fn resolve_date_range(value: &DateValue) -> Option<(NaiveDate, NaiveDate)> {
    match value {
        DateValue::Absolute(s) => {
            let d = NaiveDate::parse_from_str(s, "%Y-%m-%d").ok()?;
            Some((d, d))
        },
        DateValue::Relative(rel) => resolve_relative_range(rel),
        DateValue::TemplateVar(_) => None,
    }
}

/// Resolve a single relative date to its anchor point.
fn resolve_relative(rel: &RelativeDate) -> Option<NaiveDate> {
    let today = Local::now().date_naive();
    match rel {
        RelativeDate::Today => Some(today),
        RelativeDate::Yesterday => today.pred_opt(),
        RelativeDate::Tomorrow => today.succ_opt(),
        RelativeDate::Last(unit) => Some(offset_unit(today, *unit, -1).0),
        RelativeDate::This(unit) => Some(unit_start(today, *unit)),
        RelativeDate::Next(unit) => Some(offset_unit(today, *unit, 1).0),
        RelativeDate::IsoWeek(s) => parse_iso_week(s),
        RelativeDate::IsoMonth(s) => parse_iso_month(s).map(|(d, _)| d),
        RelativeDate::IsoQuarter(s) => parse_iso_quarter(s).map(|(d, _)| d),
        RelativeDate::Year(y) => NaiveDate::from_ymd_opt(*y as i32, 1, 1),
    }
}

/// Resolve a relative date to a full range (start, end).
fn resolve_relative_range(rel: &RelativeDate) -> Option<(NaiveDate, NaiveDate)> {
    let today = Local::now().date_naive();
    match rel {
        RelativeDate::Today => Some((today, today)),
        RelativeDate::Yesterday => today.pred_opt().map(|d| (d, d)),
        RelativeDate::Tomorrow => today.succ_opt().map(|d| (d, d)),
        RelativeDate::Last(unit) => Some(offset_unit(today, *unit, -1)),
        RelativeDate::This(unit) => Some(unit_range(today, *unit)),
        RelativeDate::Next(unit) => Some(offset_unit(today, *unit, 1)),
        RelativeDate::IsoWeek(s) => parse_iso_week(s).map(|d| {
            let end = d + chrono::Duration::days(6);
            (d, end)
        }),
        RelativeDate::IsoMonth(s) => parse_iso_month(s),
        RelativeDate::IsoQuarter(s) => parse_iso_quarter(s),
        RelativeDate::Year(y) => {
            let start = NaiveDate::from_ymd_opt(*y as i32, 1, 1)?;
            let end = NaiveDate::from_ymd_opt(*y as i32, 12, 31)?;
            Some((start, end))
        },
    }
}

/// Get the start of the unit containing `date`.
fn unit_start(date: NaiveDate, unit: DateUnit) -> NaiveDate {
    match unit {
        DateUnit::Week => {
            let weekday = date.weekday().num_days_from_monday();
            date - chrono::Duration::days(weekday as i64)
        },
        DateUnit::Month => NaiveDate::from_ymd_opt(date.year(), date.month(), 1).unwrap_or(date),
        DateUnit::Quarter => {
            let q_month = ((date.month() - 1) / 3) * 3 + 1;
            NaiveDate::from_ymd_opt(date.year(), q_month, 1).unwrap_or(date)
        },
        DateUnit::Year => NaiveDate::from_ymd_opt(date.year(), 1, 1).unwrap_or(date),
    }
}

/// Get the range (start, end) of the unit containing `date`.
fn unit_range(date: NaiveDate, unit: DateUnit) -> (NaiveDate, NaiveDate) {
    let start = unit_start(date, unit);
    let end = match unit {
        DateUnit::Week => start + chrono::Duration::days(6),
        DateUnit::Month => {
            let (y, m) = if start.month() == 12 {
                (start.year() + 1, 1)
            } else {
                (start.year(), start.month() + 1)
            };
            NaiveDate::from_ymd_opt(y, m, 1)
                .unwrap_or(start)
                .pred_opt()
                .unwrap_or(start)
        },
        DateUnit::Quarter => {
            let next_q_month = start.month() + 3;
            let (y, m) = if next_q_month > 12 {
                (start.year() + 1, next_q_month - 12)
            } else {
                (start.year(), next_q_month)
            };
            NaiveDate::from_ymd_opt(y, m, 1)
                .unwrap_or(start)
                .pred_opt()
                .unwrap_or(start)
        },
        DateUnit::Year => NaiveDate::from_ymd_opt(start.year(), 12, 31).unwrap_or(start),
    };
    (start, end)
}

/// Offset by N units and return the range of that unit.
fn offset_unit(date: NaiveDate, unit: DateUnit, offset: i32) -> (NaiveDate, NaiveDate) {
    let base = match unit {
        DateUnit::Week => date + chrono::Duration::weeks(offset as i64),
        DateUnit::Month => {
            let total_months = date.year() * 12 + date.month() as i32 - 1 + offset;
            let y = total_months / 12;
            let m = (total_months % 12 + 1) as u32;
            let d = date.day().min(days_in_month(y, m));
            NaiveDate::from_ymd_opt(y, m, d).unwrap_or(date)
        },
        DateUnit::Quarter => {
            let total_months = date.year() * 12 + date.month() as i32 - 1 + (offset * 3);
            let y = total_months / 12;
            let m = (total_months % 12 + 1) as u32;
            let d = date.day().min(days_in_month(y, m));
            NaiveDate::from_ymd_opt(y, m, d).unwrap_or(date)
        },
        DateUnit::Year => {
            NaiveDate::from_ymd_opt(date.year() + offset, date.month(), date.day()).unwrap_or(date)
        },
    };
    unit_range(base, unit)
}

fn days_in_month(year: i32, month: u32) -> u32 {
    let (ny, nm) = if month == 12 {
        (year + 1, 1)
    } else {
        (year, month + 1)
    };
    NaiveDate::from_ymd_opt(ny, nm, 1)
        .and_then(|d| d.pred_opt())
        .map(|d| d.day())
        .unwrap_or(28)
}

/// Parse ISO week notation: `YYYY-Www`
fn parse_iso_week(s: &str) -> Option<NaiveDate> {
    // Format: 2024-W03
    if s.len() < 8 || &s[4..6] != "-W" {
        return None;
    }
    let year: i32 = s[..4].parse().ok()?;
    let week: u32 = s[6..].parse().ok()?;
    NaiveDate::from_isoywd_opt(year, week, chrono::Weekday::Mon)
}

/// Parse ISO month notation: `YYYY-MM` → (first day, last day)
fn parse_iso_month(s: &str) -> Option<(NaiveDate, NaiveDate)> {
    if s.len() < 7 || s.as_bytes()[4] != b'-' {
        return None;
    }
    let year: i32 = s[..4].parse().ok()?;
    let month: u32 = s[5..7].parse().ok()?;
    let start = NaiveDate::from_ymd_opt(year, month, 1)?;
    let end_day = days_in_month(year, month);
    let end = NaiveDate::from_ymd_opt(year, month, end_day)?;
    Some((start, end))
}

/// Parse ISO quarter notation: `YYYY-Qq` → (first day, last day)
fn parse_iso_quarter(s: &str) -> Option<(NaiveDate, NaiveDate)> {
    if s.len() < 7 || &s[4..6] != "-Q" {
        return None;
    }
    let year: i32 = s[..4].parse().ok()?;
    let quarter: u32 = s[6..].parse().ok()?;
    if !(1..=4).contains(&quarter) {
        return None;
    }
    let start_month = (quarter - 1) * 3 + 1;
    let end_month = start_month + 2;
    let start = NaiveDate::from_ymd_opt(year, start_month, 1)?;
    let end_day = days_in_month(year, end_month);
    let end = NaiveDate::from_ymd_opt(year, end_month, end_day)?;
    Some((start, end))
}

/// Parse a text token into a RelativeDate or None.
pub fn parse_relative_date(tokens: &[&str]) -> Option<(RelativeDate, usize)> {
    if tokens.is_empty() {
        return None;
    }
    match tokens[0].to_lowercase().as_str() {
        "today" => Some((RelativeDate::Today, 1)),
        "yesterday" => Some((RelativeDate::Yesterday, 1)),
        "tomorrow" => Some((RelativeDate::Tomorrow, 1)),
        "last" if tokens.len() >= 2 => {
            parse_date_unit(tokens[1]).map(|u| (RelativeDate::Last(u), 2))
        },
        "this" if tokens.len() >= 2 => {
            parse_date_unit(tokens[1]).map(|u| (RelativeDate::This(u), 2))
        },
        "next" if tokens.len() >= 2 => {
            parse_date_unit(tokens[1]).map(|u| (RelativeDate::Next(u), 2))
        },
        s if s.contains("-W") => Some((RelativeDate::IsoWeek(s.to_string()), 1)),
        s if s.contains("-Q") => Some((RelativeDate::IsoQuarter(s.to_string()), 1)),
        s if s.len() == 7 && s.as_bytes()[4] == b'-' => {
            Some((RelativeDate::IsoMonth(s.to_string()), 1))
        },
        s if s.len() == 4 && s.parse::<u32>().is_ok() => {
            Some((RelativeDate::Year(s.parse().unwrap()), 1))
        },
        _ => None,
    }
}

fn parse_date_unit(s: &str) -> Option<DateUnit> {
    match s.to_lowercase().as_str() {
        "week" => Some(DateUnit::Week),
        "month" => Some(DateUnit::Month),
        "quarter" => Some(DateUnit::Quarter),
        "year" => Some(DateUnit::Year),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resolve_today() {
        let today = Local::now().format("%Y-%m-%d").to_string();
        let result = resolve_date(&DateValue::Relative(RelativeDate::Today));
        assert_eq!(result, Some(today));
    }

    #[test]
    fn test_resolve_absolute() {
        let result = resolve_date(&DateValue::Absolute("2024-06-15".to_string()));
        assert_eq!(result, Some("2024-06-15".to_string()));
    }

    #[test]
    fn test_iso_week_parse() {
        let d = parse_iso_week("2024-W01");
        assert!(d.is_some());
        let d = d.unwrap();
        assert_eq!(d.weekday(), chrono::Weekday::Mon);
    }

    #[test]
    fn test_iso_quarter_parse() {
        let range = parse_iso_quarter("2024-Q2");
        assert!(range.is_some());
        let (start, end) = range.unwrap();
        assert_eq!(start.month(), 4);
        assert_eq!(end.month(), 6);
    }

    #[test]
    fn test_parse_relative_tokens() {
        let tokens = vec!["last", "week"];
        let result = parse_relative_date(&tokens);
        assert!(matches!(
            result,
            Some((RelativeDate::Last(DateUnit::Week), 2))
        ));
    }

    #[test]
    fn test_unit_range_month() {
        let date = NaiveDate::from_ymd_opt(2024, 2, 15).unwrap();
        let (start, end) = unit_range(date, DateUnit::Month);
        assert_eq!(start, NaiveDate::from_ymd_opt(2024, 2, 1).unwrap());
        assert_eq!(end, NaiveDate::from_ymd_opt(2024, 2, 29).unwrap());
    }
}
