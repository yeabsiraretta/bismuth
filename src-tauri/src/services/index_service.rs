//! Tantivy full-text search index service (FR-028)
//!
//! Provides BM25-ranked full-text search over vault notes.
//! Uses English stemming, stored fields for title/content/path,
//! and supports both simple and advanced (fuzzy, phrase, exclusion) queries.

use crate::error::{BismuthError, Result};
use crate::models::note::Note;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::{Arc, Mutex};
use tantivy::collector::TopDocs;
use tantivy::query::QueryParser;
use tantivy::schema::*;
use tantivy::tokenizer::*;
use tantivy::{doc, Index, IndexReader, IndexWriter, TantivyDocument};

/// Parameters for a basic vault search.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchQuery {
    /// Natural-language query string.
    pub query: String,
    /// Maximum number of results to return.
    pub limit: usize,
}

/// A single search result with relevance score.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    /// Absolute path to the matching note.
    pub path: String,
    /// Note title.
    pub title: String,
    /// Content snippet (first 200 chars or less).
    pub snippet: String,
    /// BM25 relevance score.
    pub score: f32,
}

/// Tantivy-backed full-text search index over vault notes.
///
/// Maintains an on-disk index with English stemming. The writer is
/// behind an `Arc<Mutex<>>` to allow concurrent reads with exclusive writes.
pub struct IndexService {
    index: Index,
    reader: IndexReader,
    writer: Arc<Mutex<IndexWriter>>,
    schema: Schema,
}

impl IndexService {
    /// Creates or opens a Tantivy index at the given directory.
    ///
    /// Registers the English stemmer tokenizer and allocates a 50 MB writer buffer.
    pub fn new(index_dir: &Path) -> Result<Self> {
        let mut schema_builder = Schema::builder();

        let text_options = TextOptions::default()
            .set_indexing_options(
                TextFieldIndexing::default()
                    .set_tokenizer("en_stem")
                    .set_index_option(IndexRecordOption::WithFreqsAndPositions),
            )
            .set_stored();

        schema_builder.add_text_field("path", STORED);
        schema_builder.add_text_field("title", text_options.clone());
        schema_builder.add_text_field("content", text_options);
        schema_builder.add_facet_field("tags", INDEXED | STORED);
        schema_builder.add_text_field("portent_type", STORED);
        schema_builder.add_date_field("created", INDEXED | STORED);
        schema_builder.add_date_field("modified", INDEXED | STORED);
        schema_builder.add_text_field("outbound_links", STORED);
        schema_builder.add_u64_field("link_count", INDEXED | STORED);

        let schema = schema_builder.build();

        std::fs::create_dir_all(index_dir)?;

        let index = Index::create_in_dir(index_dir, schema.clone())
            .or_else(|_| Index::open_in_dir(index_dir))?;

        index.tokenizers().register(
            "en_stem",
            TextAnalyzer::builder(SimpleTokenizer::default())
                .filter(Stemmer::default())
                .build(),
        );

        let reader = index.reader()?;

        let writer = index.writer(50_000_000)?;

        Ok(Self {
            index,
            reader,
            writer: Arc::new(Mutex::new(writer)),
            schema,
        })
    }

    /// Indexes a single note (upsert: deletes existing entry first).
    pub fn index_note(&self, note: &Note) -> Result<()> {
        let path_field = self.schema.get_field("path").unwrap();
        let title_field = self.schema.get_field("title").unwrap();
        let content_field = self.schema.get_field("content").unwrap();
        let created_field = self.schema.get_field("created").unwrap();
        let modified_field = self.schema.get_field("modified").unwrap();

        let mut writer = self.writer.lock().unwrap();

        let term = Term::from_field_text(path_field, &note.path.to_string_lossy());
        writer.delete_term(term);

        let created_ts = note.created_at.timestamp();
        let modified_ts = note.modified_at.timestamp();

        let doc = doc!(
            path_field => note.path.to_string_lossy().to_string(),
            title_field => note.title.clone(),
            content_field => note.content.clone(),
            created_field => tantivy::DateTime::from_timestamp_secs(created_ts),
            modified_field => tantivy::DateTime::from_timestamp_secs(modified_ts),
        );

        writer.add_document(doc)?;
        writer.commit()?;

        Ok(())
    }

    /// Indexes all provided notes (full reindex) with a single commit at end.
    pub fn index_all(&self, notes: Vec<Note>) -> Result<()> {
        let path_field = self.schema.get_field("path").unwrap();
        let title_field = self.schema.get_field("title").unwrap();
        let content_field = self.schema.get_field("content").unwrap();
        let created_field = self.schema.get_field("created").unwrap();
        let modified_field = self.schema.get_field("modified").unwrap();

        let mut writer = self.writer.lock().unwrap();

        for note in &notes {
            let term = Term::from_field_text(path_field, &note.path.to_string_lossy());
            writer.delete_term(term);

            let created_ts = note.created_at.timestamp();
            let modified_ts = note.modified_at.timestamp();

            let doc = doc!(
                path_field => note.path.to_string_lossy().to_string(),
                title_field => note.title.clone(),
                content_field => note.content.clone(),
                created_field => tantivy::DateTime::from_timestamp_secs(created_ts),
                modified_field => tantivy::DateTime::from_timestamp_secs(modified_ts),
            );

            writer.add_document(doc)?;
        }

        writer.commit()?;
        Ok(())
    }

    /// Removes a note from the search index by path.
    pub fn delete_entry(&self, path: &Path) -> Result<()> {
        let path_field = self.schema.get_field("path").unwrap();
        let mut writer = self.writer.lock().unwrap();

        let term = Term::from_field_text(path_field, &path.to_string_lossy());
        writer.delete_term(term);
        writer.commit()?;

        Ok(())
    }

    /// Executes a basic BM25 search across title and content fields.
    pub fn search(&self, query: SearchQuery) -> Result<Vec<SearchResult>> {
        let searcher = self.reader.searcher();

        let title_field = self.schema.get_field("title").unwrap();
        let content_field = self.schema.get_field("content").unwrap();

        let query_parser = QueryParser::for_index(&self.index, vec![title_field, content_field]);

        let parsed_query = query_parser
            .parse_query(&query.query)
            .map_err(|e| BismuthError::IndexError(e.to_string()))?;

        let top_docs = searcher
            .search(&parsed_query, &TopDocs::with_limit(query.limit))
            .map_err(|e| BismuthError::IndexError(e.to_string()))?;

        self.collect_results(&searcher, &top_docs)
    }

    /// Advanced search with fuzzy matching, phrase queries, exclusions, and filters
    pub fn advanced_search(&self, raw_query: &str, limit: usize) -> Result<Vec<SearchResult>> {
        use crate::services::search_query::AdvancedSearchQuery;

        let advanced = AdvancedSearchQuery::parse(raw_query, limit);
        let tantivy_query = advanced.to_tantivy_query(&self.schema);

        let searcher = self.reader.searcher();
        let top_docs = searcher
            .search(&*tantivy_query, &TopDocs::with_limit(advanced.limit))
            .map_err(|e| BismuthError::IndexError(e.to_string()))?;

        self.collect_results(&searcher, &top_docs)
    }

    /// Collect search results from Tantivy doc addresses
    fn collect_results(
        &self,
        searcher: &tantivy::Searcher,
        top_docs: &[(f32, tantivy::DocAddress)],
    ) -> Result<Vec<SearchResult>> {
        let title_field = self.schema.get_field("title").unwrap();
        let content_field = self.schema.get_field("content").unwrap();
        let path_field = self.schema.get_field("path").unwrap();

        let mut results = Vec::new();

        for (score, doc_address) in top_docs {
            let retrieved_doc: TantivyDocument = searcher
                .doc(*doc_address)
                .map_err(|e| BismuthError::IndexError(e.to_string()))?;

            let path = retrieved_doc
                .get_first(path_field)
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let title = retrieved_doc
                .get_first(title_field)
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let content = retrieved_doc
                .get_first(content_field)
                .and_then(|v| v.as_str())
                .unwrap_or("");

            let snippet = if content.len() > 200 {
                let end = content
                    .char_indices()
                    .take_while(|(i, _)| *i < 200)
                    .last()
                    .map(|(i, c)| i + c.len_utf8())
                    .unwrap_or(0);
                format!("{}...", &content[..end])
            } else {
                content.to_string()
            };

            results.push(SearchResult {
                path,
                title,
                snippet,
                score: *score,
            });
        }

        Ok(results)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::note::Note;
    use chrono::Utc;
    use std::path::PathBuf;

    #[test]
    fn test_index_all_single_commit() {
        let temp_dir = tempfile::tempdir().unwrap();
        let index_path = temp_dir.path().join("search_index");

        let service = IndexService::new(&index_path).unwrap();

        let notes = vec![
            Note {
                path: PathBuf::from("/vault/note1.md"),
                title: "Note 1".to_string(),
                content: "First note content".to_string(),
                created_at: Utc::now(),
                modified_at: Utc::now(),
                ..Default::default()
            },
            Note {
                path: PathBuf::from("/vault/note2.md"),
                title: "Note 2".to_string(),
                content: "Second note content".to_string(),
                created_at: Utc::now(),
                modified_at: Utc::now(),
                ..Default::default()
            },
            Note {
                path: PathBuf::from("/vault/note3.md"),
                title: "Note 3".to_string(),
                content: "Third note content".to_string(),
                created_at: Utc::now(),
                modified_at: Utc::now(),
                ..Default::default()
            },
        ];

        // index_all with multiple notes should succeed (single commit)
        let result = service.index_all(notes);
        assert!(result.is_ok());

        // Verify all notes are searchable
        let results = service.search(SearchQuery {
            query: "note content".to_string(),
            limit: 10,
        }).unwrap();
        assert_eq!(results.len(), 3);
    }
}
