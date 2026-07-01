//! Shared database query helpers.

use crate::error::Result;
use crate::models::link::Link;
use crate::models::note::Note;
use chrono::{DateTime, Utc};
use std::path::PathBuf;

use super::Database;

impl Database {
    /// Gets all notes from the database
    pub fn get_all_notes(&self) -> Result<Vec<Note>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn
            .prepare("SELECT path, title, frontmatter_json, created_at, modified_at FROM notes")?;

        let notes = stmt
            .query_map([], |row| {
                let path: String = row.get(0)?;
                let title: String = row.get(1)?;
                let frontmatter_json: Option<String> = row.get(2)?;
                let created_at: i64 = row.get(3)?;
                let modified_at: i64 = row.get(4)?;

                let frontmatter = frontmatter_json
                    .and_then(|json| serde_json::from_str(&json).ok())
                    .unwrap_or_default();

                Ok(Note {
                    path: PathBuf::from(path),
                    title,
                    content: String::new(),
                    frontmatter,
                    created_at: DateTime::from_timestamp(created_at, 0)
                        .unwrap_or_else(|| Utc::now()),
                    modified_at: DateTime::from_timestamp(modified_at, 0)
                        .unwrap_or_else(|| Utc::now()),
                })
            })?
            .collect::<std::result::Result<Vec<_>, _>>()?;

        Ok(notes)
    }

    /// Gets all links from the database
    pub fn get_all_links(&self) -> Result<Vec<Link>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt =
            conn.prepare("SELECT source_path, target_title, target_path, is_resolved FROM links")?;

        let links = stmt
            .query_map([], |row| {
                let source_path: String = row.get(0)?;
                let target_title: String = row.get(1)?;
                let target_path: Option<String> = row.get(2)?;
                let is_resolved: i32 = row.get(3)?;

                Ok(Link {
                    source_path: PathBuf::from(source_path),
                    target_title,
                    target_path: target_path.map(PathBuf::from),
                    alias: None,
                    is_resolved: is_resolved != 0,
                })
            })?
            .collect::<std::result::Result<Vec<_>, _>>()?;

        Ok(links)
    }

    /// Gets backlinks for a specific note path
    pub fn get_backlinks(&self, target_path: &str) -> Result<Vec<Link>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT source_path, target_title, target_path, is_resolved 
             FROM links WHERE target_path = ?",
        )?;

        let links = stmt
            .query_map([target_path], |row| {
                let source_path: String = row.get(0)?;
                let target_title: String = row.get(1)?;
                let target_path: Option<String> = row.get(2)?;
                let is_resolved: i32 = row.get(3)?;

                Ok(Link {
                    source_path: PathBuf::from(source_path),
                    target_title,
                    target_path: target_path.map(PathBuf::from),
                    alias: None,
                    is_resolved: is_resolved != 0,
                })
            })?
            .collect::<std::result::Result<Vec<_>, _>>()?;

        Ok(links)
    }
}
