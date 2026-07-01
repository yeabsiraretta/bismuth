//! Note linker — suggests related notes based on embedding similarity.
//!
//! Uses the embedding service's cosine similarity to find semantically
//! related notes and optionally writes `related:` links to frontmatter.

use super::EmbeddingService;
use crate::error::Result;

/// A link suggestion with acceptance state.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct LinkSuggestion {
    pub source_path: String,
    pub target_path: String,
    pub score: f32,
    pub accepted: bool,
}

impl EmbeddingService {
    /// Suggests related notes for the given path based on similarity.
    ///
    /// Returns up to `limit` suggestions above `threshold`.
    pub fn suggest_related(
        &self,
        path: &str,
        threshold: f32,
        limit: usize,
    ) -> Result<Vec<LinkSuggestion>> {
        let similar = self.get_similar(path, limit + 5)?;

        let suggestions: Vec<LinkSuggestion> = similar
            .into_iter()
            .filter(|s| s.score >= threshold && s.path != path)
            .take(limit)
            .map(|s| LinkSuggestion {
                source_path: path.to_string(),
                target_path: s.path,
                score: s.score,
                accepted: false,
            })
            .collect();

        Ok(suggestions)
    }

    /// Suggests related notes for all notes in the vault (batch mode).
    ///
    /// Returns a flat list of all suggestions above threshold.
    pub fn batch_suggest_related(
        &self,
        threshold: f32,
        limit_per_note: usize,
    ) -> Result<Vec<LinkSuggestion>> {
        let all_paths: Vec<String> = self.cache.keys().cloned().collect();
        let mut all_suggestions = Vec::new();

        for path in &all_paths {
            if let Ok(suggestions) = self.suggest_related(path, threshold, limit_per_note) {
                all_suggestions.extend(suggestions);
            }
        }

        Ok(all_suggestions)
    }
}
