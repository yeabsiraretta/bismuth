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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchQuery {
    pub query: String,
    pub limit: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub path: String,
    pub title: String,
    pub snippet: String,
    pub score: f32,
}

pub struct IndexService {
    index: Index,
    reader: IndexReader,
    writer: Arc<Mutex<IndexWriter>>,
    schema: Schema,
}

impl IndexService {
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

        index
            .tokenizers()
            .register("en_stem", TextAnalyzer::builder(SimpleTokenizer::default()).filter(Stemmer::default()).build());

        let reader = index
            .reader()?;

        let writer = index.writer(50_000_000)?;

        Ok(Self {
            index,
            reader,
            writer: Arc::new(Mutex::new(writer)),
            schema,
        })
    }

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

    pub fn index_all(&self, notes: Vec<Note>) -> Result<()> {
        for note in notes {
            self.index_note(&note)?;
        }
        Ok(())
    }

    pub fn delete_entry(&self, path: &Path) -> Result<()> {
        let path_field = self.schema.get_field("path").unwrap();
        let mut writer = self.writer.lock().unwrap();

        let term = Term::from_field_text(path_field, &path.to_string_lossy());
        writer.delete_term(term);
        writer.commit()?;

        Ok(())
    }

    pub fn search(&self, query: SearchQuery) -> Result<Vec<SearchResult>> {
        let searcher = self.reader.searcher();

        let title_field = self.schema.get_field("title").unwrap();
        let content_field = self.schema.get_field("content").unwrap();
        let path_field = self.schema.get_field("path").unwrap();

        let query_parser = QueryParser::for_index(&self.index, vec![title_field, content_field]);

        let parsed_query = query_parser
            .parse_query(&query.query)
            .map_err(|e| BismuthError::IndexError(e.to_string()))?;

        let top_docs = searcher
            .search(&parsed_query, &TopDocs::with_limit(query.limit))
            .map_err(|e| BismuthError::IndexError(e.to_string()))?;

        let mut results = Vec::new();

        for (score, doc_address) in top_docs {
            let retrieved_doc: TantivyDocument = searcher
                .doc(doc_address)
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
                format!("{}...", &content[..200])
            } else {
                content.to_string()
            };

            results.push(SearchResult {
                path,
                title,
                snippet,
                score,
            });
        }

        Ok(results)
    }
}
