//! Tantivy index write and update operations for the search index service.
//!
//! Extracted from `index_service.rs` to keep that file under the 300-line limit.

use crate::error::Result;
use crate::models::note::Note;
use std::path::Path;
use std::sync::{Arc, Mutex};
use tantivy::schema::Schema;
use tantivy::{doc, IndexReader, IndexWriter, Term};

/// Indexes a single note (upsert: deletes existing entry first).
pub(super) fn index_note(
    schema: &Schema,
    writer: &Arc<Mutex<IndexWriter>>,
    note: &Note,
) -> Result<()> {
    let path_field = schema.get_field("path").unwrap();
    let title_field = schema.get_field("title").unwrap();
    let content_field = schema.get_field("content").unwrap();
    let created_field = schema.get_field("created").unwrap();
    let modified_field = schema.get_field("modified").unwrap();

    let mut writer = writer.lock().unwrap();

    let term = Term::from_field_text(path_field, &note.path.to_string_lossy());
    writer.delete_term(term);

    let created_ts = note.created_at.timestamp();
    let modified_ts = note.modified_at.timestamp();

    let document = doc!(
        path_field => note.path.to_string_lossy().to_string(),
        title_field => note.title.clone(),
        content_field => note.content.clone(),
        created_field => tantivy::DateTime::from_timestamp_secs(created_ts),
        modified_field => tantivy::DateTime::from_timestamp_secs(modified_ts),
    );

    writer.add_document(document)?;
    writer.commit()?;

    Ok(())
}

/// Indexes all provided notes (full reindex) with a single commit at end.
pub(super) fn index_all(
    schema: &Schema,
    writer: &Arc<Mutex<IndexWriter>>,
    reader: &IndexReader,
    notes: Vec<Note>,
) -> Result<()> {
    let path_field = schema.get_field("path").unwrap();
    let title_field = schema.get_field("title").unwrap();
    let content_field = schema.get_field("content").unwrap();
    let created_field = schema.get_field("created").unwrap();
    let modified_field = schema.get_field("modified").unwrap();

    let mut writer = writer.lock().unwrap();

    for note in &notes {
        let term = Term::from_field_text(path_field, &note.path.to_string_lossy());
        writer.delete_term(term);

        let created_ts = note.created_at.timestamp();
        let modified_ts = note.modified_at.timestamp();

        let document = doc!(
            path_field => note.path.to_string_lossy().to_string(),
            title_field => note.title.clone(),
            content_field => note.content.clone(),
            created_field => tantivy::DateTime::from_timestamp_secs(created_ts),
            modified_field => tantivy::DateTime::from_timestamp_secs(modified_ts),
        );

        writer.add_document(document)?;
    }

    writer.commit()?;
    drop(writer);
    reader.reload()?;
    Ok(())
}

/// Removes a note from the search index by path.
pub(super) fn delete_entry(
    schema: &Schema,
    writer: &Arc<Mutex<IndexWriter>>,
    path: &Path,
) -> Result<()> {
    let path_field = schema.get_field("path").unwrap();
    let mut writer = writer.lock().unwrap();

    let term = Term::from_field_text(path_field, &path.to_string_lossy());
    writer.delete_term(term);
    writer.commit()?;

    Ok(())
}
