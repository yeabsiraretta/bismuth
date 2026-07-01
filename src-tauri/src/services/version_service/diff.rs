//! Diff computation and complexity metrics for knowledge versioning.
//!
//! Implements `DiffMetrics`, `BumpType`, `compute_diff_metrics`, and `classify_bump`.
//! Uses line-by-line analysis (no external diff crate required) to keep the
//! dependency surface minimal and compilable in the Tauri build environment.

use serde::{Deserialize, Serialize};

/// Quantitative metrics extracted from the diff between two document versions.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DiffMetrics {
    /// Number of lines added in the new version.
    pub added_lines: usize,
    /// Number of lines removed from the old version.
    pub removed_lines: usize,
    /// Total line count of the old document (denominator for change_pct).
    pub total_lines: usize,
    /// Net change in Markdown heading count (new_headings – old_headings).
    pub heading_delta: i32,
    /// Net change in structural tokens: headings + list items + code-block markers.
    pub structural_token_delta: i32,
}

/// Semantic version bump type derived from diff complexity.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum BumpType {
    Patch,
    Minor,
    Major,
}

/// Classify a set of diff metrics into a semantic version bump type.
///
/// Rules (from spec 051 research document):
/// - Major: `change_pct > 0.30` OR (`heading_delta < -1` AND `removed_lines > 10`)
/// - Minor: `change_pct > 0.05` OR `heading_delta > 0`
/// - Patch: `change_pct <= 0.05` AND `heading_delta <= 0`
pub fn classify_bump(metrics: &DiffMetrics) -> BumpType {
    let change_pct = (metrics.added_lines + metrics.removed_lines) as f64
        / metrics.total_lines.max(1) as f64;

    if change_pct > 0.30 || (metrics.heading_delta < -1 && metrics.removed_lines > 10) {
        return BumpType::Major;
    }
    if change_pct > 0.05 || metrics.heading_delta > 0 {
        return BumpType::Minor;
    }
    BumpType::Patch
}

/// Count the number of Markdown headings in a document string.
///
/// A heading is any line whose first non-space character is `#` followed by
/// a space (ATX-style: `# `, `## `, `### `, etc.).
fn count_headings(text: &str) -> i32 {
    text.lines()
        .filter(|line| {
            let trimmed = line.trim_start_matches('#');
            // Line must start with at least one '#' and be followed by a space
            !trimmed.is_empty()
                && trimmed.len() < line.len() // there were leading '#'s
                && trimmed.starts_with(' ')
        })
        .count() as i32
}

/// Count structural tokens: headings, unordered list items (`- `, `* `),
/// ordered list items (`N. `), and fenced code-block markers (` ``` `).
fn count_structural_tokens(text: &str) -> i32 {
    text.lines()
        .filter(|line| {
            let t = line.trim_start();
            // Heading
            if t.starts_with('#') {
                let rest = t.trim_start_matches('#');
                return !rest.is_empty() && rest.starts_with(' ');
            }
            // Unordered list
            if t.starts_with("- ") || t.starts_with("* ") || t.starts_with("+ ") {
                return true;
            }
            // Ordered list (e.g., "1. ")
            if let Some(dot_idx) = t.find(". ") {
                if t[..dot_idx].chars().all(|c| c.is_ascii_digit()) && dot_idx > 0 {
                    return true;
                }
            }
            // Fenced code block marker
            if t.starts_with("```") || t.starts_with("~~~") {
                return true;
            }
            false
        })
        .count() as i32
}

/// Compute diff metrics by comparing old and new document content line-by-line.
///
/// Uses a simple LCS-based longest-common-subsequence diff to count added/removed
/// lines, then separately computes heading and structural token deltas from the
/// full document texts.
pub fn compute_diff_metrics(old: &str, new: &str) -> DiffMetrics {
    let old_lines: Vec<&str> = old.lines().collect();
    let new_lines: Vec<&str> = new.lines().collect();

    let total_lines = old_lines.len();

    // Myers-style simple diff using LCS lengths for added/removed counts.
    let (added_lines, removed_lines) = count_added_removed(&old_lines, &new_lines);

    let old_headings = count_headings(old);
    let new_headings = count_headings(new);
    let heading_delta = new_headings - old_headings;

    let old_structural = count_structural_tokens(old);
    let new_structural = count_structural_tokens(new);
    let structural_token_delta = new_structural - old_structural;

    DiffMetrics {
        added_lines,
        removed_lines,
        total_lines,
        heading_delta,
        structural_token_delta,
    }
}

/// Count added and removed lines using a lightweight LCS approach.
///
/// Returns `(added, removed)`.  Lines present only in `new_lines` are added;
/// lines present only in `old_lines` are removed.
fn count_added_removed(old_lines: &[&str], new_lines: &[&str]) -> (usize, usize) {
    let m = old_lines.len();
    let n = new_lines.len();

    // Build LCS length table.
    let mut dp = vec![vec![0usize; n + 1]; m + 1];
    for i in 1..=m {
        for j in 1..=n {
            if old_lines[i - 1] == new_lines[j - 1] {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = dp[i - 1][j].max(dp[i][j - 1]);
            }
        }
    }

    let lcs = dp[m][n];
    let removed = m - lcs;
    let added = n - lcs;
    (added, removed)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn metrics(added: usize, removed: usize, total: usize, hd: i32) -> DiffMetrics {
        DiffMetrics { added_lines: added, removed_lines: removed, total_lines: total, heading_delta: hd, structural_token_delta: 0 }
    }

    #[test]
    fn test_classify_boundaries() {
        // 0% → Patch
        assert_eq!(classify_bump(&metrics(0, 0, 100, 0)), BumpType::Patch);
        // 4% → Patch (not strictly > 5%)
        assert_eq!(classify_bump(&metrics(4, 0, 100, 0)), BumpType::Patch);
        // 5% exactly → Patch (not strictly > 0.05)
        assert_eq!(classify_bump(&metrics(5, 0, 100, 0)), BumpType::Patch);
        // 6% → Minor
        assert_eq!(classify_bump(&metrics(6, 0, 100, 0)), BumpType::Minor);
        // 29% → Minor
        assert_eq!(classify_bump(&metrics(29, 0, 100, 0)), BumpType::Minor);
        // 30% exactly → Minor (not strictly > 0.30)
        assert_eq!(classify_bump(&metrics(30, 0, 100, 0)), BumpType::Minor);
        // 31% → Major
        assert_eq!(classify_bump(&metrics(31, 0, 100, 0)), BumpType::Major);
    }

    #[test]
    fn test_classify_heading_overrides() {
        // heading_delta > 0 → Minor regardless of low change_pct
        assert_eq!(classify_bump(&metrics(1, 0, 100, 1)), BumpType::Minor);
        // heading_delta < -1 AND removed_lines > 10 → Major
        assert_eq!(classify_bump(&metrics(0, 11, 100, -2)), BumpType::Major);
        // heading_delta < -1 but removed_lines <= 10 → no major override
        assert_eq!(classify_bump(&metrics(5, 0, 100, -2)), BumpType::Patch);
        // heading_delta == -1 (not < -1) → no major override
        assert_eq!(classify_bump(&metrics(0, 20, 100, -1)), BumpType::Patch);
    }

    #[test]
    fn test_classify_edge_cases() {
        // total_lines = 0 → no divide-by-zero; any added lines → Major
        assert_eq!(classify_bump(&metrics(5, 0, 0, 0)), BumpType::Major);
        // New file (empty old)
        let m = compute_diff_metrics("", "# New Document\n\nSome content here.\n");
        assert_eq!(classify_bump(&m), BumpType::Major);
        // Empty to empty → Patch
        let m2 = compute_diff_metrics("", "");
        assert_eq!(classify_bump(&m2), BumpType::Patch);
    }

    #[test]
    fn test_metrics_added_only() {
        let m = compute_diff_metrics("line one\nline two\n", "line one\nline two\nline three\n");
        assert_eq!(m.added_lines, 1);
        assert_eq!(m.removed_lines, 0);
        assert_eq!(m.total_lines, 2);
    }

    #[test]
    fn test_metrics_removed_only() {
        let m = compute_diff_metrics("line one\nline two\nline three\n", "line one\nline two\n");
        assert_eq!(m.added_lines, 0);
        assert_eq!(m.removed_lines, 1);
        assert_eq!(m.total_lines, 3);
    }

    #[test]
    fn test_metrics_mixed_diff() {
        let old = "# Heading\n\nParagraph one.\nParagraph two.\n";
        let new = "# Heading\n\nParagraph one revised.\nNew line.\nParagraph two.\n";
        let m = compute_diff_metrics(old, new);
        assert!(m.added_lines >= 1 && m.removed_lines >= 1);
    }

    #[test]
    fn test_metrics_heading_delta() {
        let old = "# Title\n\nContent.\n";
        let new_with = "# Title\n\n## New Section\n\nContent.\n";
        let new_without = "Content.\n";
        assert!(compute_diff_metrics(old, new_with).heading_delta > 0);
        assert!(compute_diff_metrics(old, new_without).heading_delta < 0);
    }

    #[test]
    fn test_metrics_structural_token_list() {
        let old = "# Notes\n\nSome content.\n";
        let new = "# Notes\n\nSome content.\n\n- item one\n- item two\n";
        let m = compute_diff_metrics(old, new);
        assert!(m.structural_token_delta > 0);
    }

    #[test]
    fn test_metrics_no_change_returns_zeros() {
        let doc = "# Title\n\nSame content.\n";
        let m = compute_diff_metrics(doc, doc);
        assert_eq!(m.added_lines, 0);
        assert_eq!(m.removed_lines, 0);
        assert_eq!(m.heading_delta, 0);
        assert_eq!(m.structural_token_delta, 0);
    }
}
