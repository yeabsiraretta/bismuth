//! Write-good linting service (F23)
//!
//! Provides prose linting rules for markdown notes:
//! - Passive voice detection
//! - Weasel words
//! - Excessive adverbs
//! - Overly complex sentences

pub mod rules;
pub mod suggestions;

use rules::LintSeverity;
use serde::{Deserialize, Serialize};

/// A single lint issue found in text
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LintIssue {
    pub rule: String,
    pub message: String,
    pub severity: LintSeverity,
    /// Byte offset start in the input text
    pub from: usize,
    /// Byte offset end in the input text
    pub to: usize,
    /// Suggested replacement (if available)
    pub suggestion: Option<String>,
}

/// Lints a markdown note body (frontmatter should be stripped before calling).
pub fn lint_text(text: &str) -> Vec<LintIssue> {
    let all_rules = rules::all_rules();
    let mut issues = Vec::new();

    for rule in &all_rules {
        let found = rule.check(text);
        issues.extend(found);
    }

    // Sort by position
    issues.sort_by_key(|i| i.from);
    issues
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lint_passive_voice() {
        let issues = lint_text("The ball was kicked by the boy.");
        assert!(issues.iter().any(|i| i.rule == "passive-voice"));
    }

    #[test]
    fn test_lint_weasel_words() {
        let issues = lint_text("This is extremely important and very significant.");
        assert!(issues.iter().any(|i| i.rule == "weasel-word"));
    }

    #[test]
    fn test_lint_clean_text() {
        let issues = lint_text("The dog chased the cat.");
        let passive: Vec<_> = issues.iter().filter(|i| i.rule == "passive-voice").collect();
        assert!(passive.is_empty());
    }
}
