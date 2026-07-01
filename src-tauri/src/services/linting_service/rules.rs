//! Lint rule definitions for prose quality checking.

use super::LintIssue;
use regex::Regex;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LintSeverity {
    Info,
    Warning,
    Error,
}

/// A lint rule that checks text for stylistic issues.
pub trait LintRule: Send + Sync {
    fn check(&self, text: &str) -> Vec<LintIssue>;
}

/// Returns all enabled lint rules.
pub fn all_rules() -> Vec<Box<dyn LintRule>> {
    vec![
        Box::new(PassiveVoiceRule),
        Box::new(WeaselWordRule),
        Box::new(AdverbRule),
        Box::new(ComplexSentenceRule),
    ]
}

// ─── Passive Voice ──────────────────────────────────────────────────────────

struct PassiveVoiceRule;

impl LintRule for PassiveVoiceRule {
    fn check(&self, text: &str) -> Vec<LintIssue> {
        let mut issues = Vec::new();
        let re = Regex::new(r"\b(is|are|was|were|be|been|being)\s+(\w+ed)\b").unwrap();
        for cap in re.captures_iter(text) {
            if let Some(m) = cap.get(0) {
                issues.push(LintIssue {
                    rule: "passive-voice".to_string(),
                    message: format!("\"{}\" may be passive voice", m.as_str()),
                    severity: LintSeverity::Warning,
                    from: m.start(),
                    to: m.end(),
                    suggestion: None,
                });
            }
        }
        issues
    }
}

// ─── Weasel Words ───────────────────────────────────────────────────────────

struct WeaselWordRule;

const WEASEL_WORDS: &[&str] = &[
    "very", "really", "extremely", "quite", "rather", "fairly",
    "just", "basically", "actually", "literally", "simply",
    "obviously", "clearly", "definitely", "certainly",
    "probably", "possibly", "maybe", "perhaps",
    "somewhat", "somehow", "stuff", "things",
];

impl LintRule for WeaselWordRule {
    fn check(&self, text: &str) -> Vec<LintIssue> {
        let mut issues = Vec::new();
        let lower = text.to_lowercase();
        for &word in WEASEL_WORDS {
            let pattern = format!(r"\b{}\b", regex::escape(word));
            if let Ok(re) = Regex::new(&pattern) {
                for m in re.find_iter(&lower) {
                    issues.push(LintIssue {
                        rule: "weasel-word".to_string(),
                        message: format!("\"{}\" is a weasel word — consider removing", word),
                        severity: LintSeverity::Info,
                        from: m.start(),
                        to: m.end(),
                        suggestion: Some(String::new()),
                    });
                }
            }
        }
        issues
    }
}

// ─── Adverbs ────────────────────────────────────────────────────────────────

struct AdverbRule;

impl LintRule for AdverbRule {
    fn check(&self, text: &str) -> Vec<LintIssue> {
        let mut issues = Vec::new();
        let re = Regex::new(r"\b(\w+ly)\b").unwrap();
        // Exclude common non-adverb "-ly" words
        let exceptions = ["apply", "supply", "reply", "fly", "rely", "only", "early", "family", "daily", "ugly"];
        for m in re.find_iter(text) {
            let word = m.as_str().to_lowercase();
            if exceptions.contains(&word.as_str()) {
                continue;
            }
            issues.push(LintIssue {
                rule: "adverb".to_string(),
                message: format!("\"{}\" — adverbs can weaken prose", m.as_str()),
                severity: LintSeverity::Info,
                from: m.start(),
                to: m.end(),
                suggestion: None,
            });
        }
        issues
    }
}

// ─── Complex Sentences ──────────────────────────────────────────────────────

struct ComplexSentenceRule;

impl LintRule for ComplexSentenceRule {
    fn check(&self, text: &str) -> Vec<LintIssue> {
        let mut issues = Vec::new();
        let re = Regex::new(r"[^.!?]+[.!?]").unwrap();
        for m in re.find_iter(text) {
            let sentence = m.as_str();
            let word_count = sentence.split_whitespace().count();
            if word_count > 30 {
                issues.push(LintIssue {
                    rule: "complex-sentence".to_string(),
                    message: format!(
                        "This sentence has {} words — consider splitting it",
                        word_count
                    ),
                    severity: LintSeverity::Warning,
                    from: m.start(),
                    to: m.end(),
                    suggestion: None,
                });
            }
        }
        issues
    }
}
