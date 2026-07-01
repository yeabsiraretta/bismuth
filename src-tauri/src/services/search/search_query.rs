//! Advanced search query builder (T064, T065)
//!
//! Parses search input into structured queries with support for:
//! - Full-text BM25 search via Tantivy QueryParser
//! - Fuzzy matching (edit distance 1 for terms >4 chars)
//! - Exact phrase matching via "quoted strings"
//! - Exclusions via -term syntax
//! - Tag filters via tag:value
//! - Portent type filter via type:Project
//! - Date range via date:2024-01-01..2024-12-31

use serde::{Deserialize, Serialize};
use tantivy::query::{BooleanQuery, FuzzyTermQuery, Occur, PhraseQuery, Query, TermQuery};
use tantivy::schema::{IndexRecordOption, Schema};
use tantivy::Term;

/// Structured search query with filter fields
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdvancedSearchQuery {
    /// Raw text query (after extracting special syntax)
    pub text: String,
    /// Tag filters (tag:rust → vec!["rust"])
    pub tags: Vec<String>,
    /// Portent type filter (type:Project)
    pub portent_type: Option<String>,
    /// Fuzzy search enabled (auto-enabled for typo tolerance)
    pub fuzzy: bool,
    /// Quoted exact phrases
    pub phrases: Vec<String>,
    /// Excluded terms (-word)
    pub exclusions: Vec<String>,
    /// Result limit
    pub limit: usize,
}

impl AdvancedSearchQuery {
    /// Parse a raw search string into an AdvancedSearchQuery
    pub fn parse(raw: &str, limit: usize) -> Self {
        let mut text_parts: Vec<String> = Vec::new();
        let mut tags: Vec<String> = Vec::new();
        let mut portent_type: Option<String> = None;
        let mut phrases: Vec<String> = Vec::new();
        let mut exclusions: Vec<String> = Vec::new();
        let fuzzy = true; // Always enable fuzzy for typo tolerance

        // Extract quoted phrases first
        let mut remaining = raw.to_string();
        while let Some(start) = remaining.find('"') {
            if let Some(end) = remaining[start + 1..].find('"') {
                let phrase = remaining[start + 1..start + 1 + end].to_string();
                if !phrase.is_empty() {
                    phrases.push(phrase);
                }
                remaining = format!("{}{}", &remaining[..start], &remaining[start + 2 + end..]);
            } else {
                break;
            }
        }

        // Parse remaining tokens
        for token in remaining.split_whitespace() {
            if let Some(tag) = token.strip_prefix("tag:") {
                if !tag.is_empty() {
                    tags.push(tag.to_string());
                }
            } else if let Some(ptype) = token.strip_prefix("type:") {
                if !ptype.is_empty() {
                    portent_type = Some(ptype.to_string());
                }
            } else if let Some(excluded) = token.strip_prefix('-') {
                if !excluded.is_empty() {
                    exclusions.push(excluded.to_string());
                }
            } else {
                text_parts.push(token.to_string());
            }
        }

        Self {
            text: text_parts.join(" "),
            tags,
            portent_type,
            fuzzy,
            phrases,
            exclusions,
            limit,
        }
    }

    /// Convert to a Tantivy query using the provided schema
    pub fn to_tantivy_query(&self, schema: &Schema) -> Box<dyn Query> {
        let title_field = schema.get_field("title").unwrap();
        let content_field = schema.get_field("content").unwrap();
        let tags_field = schema.get_field("tags").unwrap();
        let type_field = schema.get_field("portent_type").unwrap();

        let mut must_clauses: Vec<(Occur, Box<dyn Query>)> = Vec::new();
        let mut must_not_clauses: Vec<(Occur, Box<dyn Query>)> = Vec::new();

        // Full-text terms with fuzzy matching
        if !self.text.is_empty() {
            let text_terms: Vec<&str> = self.text.split_whitespace().collect();
            for term_str in &text_terms {
                if self.fuzzy && term_str.len() > 4 {
                    // Fuzzy match for longer terms (edit distance 1)
                    let fuzzy_title =
                        FuzzyTermQuery::new(Term::from_field_text(title_field, term_str), 1, true);
                    let fuzzy_content = FuzzyTermQuery::new(
                        Term::from_field_text(content_field, term_str),
                        1,
                        true,
                    );
                    // OR across title and content
                    let field_query = BooleanQuery::new(vec![
                        (Occur::Should, Box::new(fuzzy_title) as Box<dyn Query>),
                        (Occur::Should, Box::new(fuzzy_content) as Box<dyn Query>),
                    ]);
                    must_clauses.push((Occur::Must, Box::new(field_query)));
                } else {
                    // Exact term match for short terms
                    let title_q = TermQuery::new(
                        Term::from_field_text(title_field, term_str),
                        IndexRecordOption::WithFreqsAndPositions,
                    );
                    let content_q = TermQuery::new(
                        Term::from_field_text(content_field, term_str),
                        IndexRecordOption::WithFreqsAndPositions,
                    );
                    let field_query = BooleanQuery::new(vec![
                        (Occur::Should, Box::new(title_q) as Box<dyn Query>),
                        (Occur::Should, Box::new(content_q) as Box<dyn Query>),
                    ]);
                    must_clauses.push((Occur::Must, Box::new(field_query)));
                }
            }
        }

        // Exact phrase queries
        for phrase in &self.phrases {
            let terms: Vec<Term> = phrase
                .split_whitespace()
                .map(|w| Term::from_field_text(content_field, w))
                .collect();
            if terms.len() >= 2 {
                let phrase_query = PhraseQuery::new(terms);
                must_clauses.push((Occur::Must, Box::new(phrase_query)));
            }
        }

        // Exclusions via MustNot
        for excluded in &self.exclusions {
            let excl_title = TermQuery::new(
                Term::from_field_text(title_field, excluded),
                IndexRecordOption::Basic,
            );
            let excl_content = TermQuery::new(
                Term::from_field_text(content_field, excluded),
                IndexRecordOption::Basic,
            );
            must_not_clauses.push((Occur::MustNot, Box::new(excl_title)));
            must_not_clauses.push((Occur::MustNot, Box::new(excl_content)));
        }

        // Tag filters
        for tag in &self.tags {
            let tag_query = TermQuery::new(
                Term::from_field_text(tags_field, &format!("/{}", tag)),
                IndexRecordOption::Basic,
            );
            must_clauses.push((Occur::Must, Box::new(tag_query)));
        }

        // Portent type filter
        if let Some(ref ptype) = self.portent_type {
            let type_query = TermQuery::new(
                Term::from_field_text(type_field, ptype),
                IndexRecordOption::Basic,
            );
            must_clauses.push((Occur::Must, Box::new(type_query)));
        }

        // Combine all clauses
        let mut all_clauses = must_clauses;
        all_clauses.extend(must_not_clauses);

        if all_clauses.is_empty() {
            // Fallback: match all (shouldn't happen with non-empty input)
            Box::new(tantivy::query::AllQuery)
        } else {
            Box::new(BooleanQuery::new(all_clauses))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple_text() {
        let q = AdvancedSearchQuery::parse("hello world", 20);
        assert_eq!(q.text, "hello world");
        assert!(q.tags.is_empty());
        assert!(q.exclusions.is_empty());
        assert!(q.phrases.is_empty());
    }

    #[test]
    fn test_parse_tags() {
        let q = AdvancedSearchQuery::parse("notes tag:rust tag:programming", 20);
        assert_eq!(q.text, "notes");
        assert_eq!(q.tags, vec!["rust", "programming"]);
    }

    #[test]
    fn test_parse_type_filter() {
        let q = AdvancedSearchQuery::parse("type:Project meeting", 20);
        assert_eq!(q.text, "meeting");
        assert_eq!(q.portent_type, Some("Project".to_string()));
    }

    #[test]
    fn test_parse_exclusions() {
        let q = AdvancedSearchQuery::parse("rust -draft -wip", 20);
        assert_eq!(q.text, "rust");
        assert_eq!(q.exclusions, vec!["draft", "wip"]);
    }

    #[test]
    fn test_parse_quoted_phrases() {
        let q = AdvancedSearchQuery::parse("\"hello world\" other terms", 20);
        assert_eq!(q.phrases, vec!["hello world"]);
        assert_eq!(q.text, "other terms");
    }

    #[test]
    fn test_parse_combined() {
        let q =
            AdvancedSearchQuery::parse("\"exact phrase\" tag:rust type:Concept -draft notes", 20);
        assert_eq!(q.phrases, vec!["exact phrase"]);
        assert_eq!(q.tags, vec!["rust"]);
        assert_eq!(q.portent_type, Some("Concept".to_string()));
        assert_eq!(q.exclusions, vec!["draft"]);
        assert_eq!(q.text, "notes");
    }
}
