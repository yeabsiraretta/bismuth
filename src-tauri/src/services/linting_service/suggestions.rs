//! Suggestion helpers for lint issues.

use super::LintIssue;

/// Applies a suggestion to text, returning the modified string.
pub fn apply_suggestion(text: &str, issue: &LintIssue) -> Option<String> {
    let suggestion = issue.suggestion.as_ref()?;
    if issue.from > text.len() || issue.to > text.len() {
        return None;
    }
    let mut result = String::with_capacity(text.len());
    result.push_str(&text[..issue.from]);
    result.push_str(suggestion);
    result.push_str(&text[issue.to..]);
    Some(result)
}

/// Applies multiple non-overlapping suggestions in reverse order.
pub fn apply_all_suggestions(text: &str, issues: &[LintIssue]) -> String {
    let mut applicable: Vec<&LintIssue> = issues
        .iter()
        .filter(|i| i.suggestion.is_some())
        .collect();

    // Sort by position descending so earlier positions remain valid
    applicable.sort_by(|a, b| b.from.cmp(&a.from));

    let mut result = text.to_string();
    for issue in applicable {
        if let Some(fixed) = apply_suggestion(&result, issue) {
            result = fixed;
        }
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::linting_service::rules::LintSeverity;

    #[test]
    fn test_apply_suggestion() {
        let issue = LintIssue {
            rule: "test".to_string(),
            message: "test".to_string(),
            severity: LintSeverity::Info,
            from: 6,
            to: 10,
            suggestion: Some("world".to_string()),
        };
        let result = apply_suggestion("Hello test!", &issue);
        assert_eq!(result, Some("Hello world!".to_string()));
    }

    #[test]
    fn test_apply_empty_suggestion() {
        let issue = LintIssue {
            rule: "test".to_string(),
            message: "test".to_string(),
            severity: LintSeverity::Info,
            from: 0,
            to: 4,
            suggestion: Some(String::new()),
        };
        let result = apply_suggestion("very important", &issue);
        assert_eq!(result, Some(" important".to_string()));
    }
}
