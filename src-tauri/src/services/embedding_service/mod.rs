//! Semantic embedding service (FR-025)
//!
//! Provides local, offline embeddings using character n-gram hashing.
//! Embeds note content into dense vectors and supports cosine similarity search
//! for the Connections view. Vectors stored as `.vec` files in `.bismuth/embeddings/`.

pub mod indexing;
pub mod search;

use crate::error::{BismuthError, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

/// Dimensionality of the embedding vectors.
pub const EMBEDDING_DIM: usize = 384;

/// A similarity result between two notes.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimilarNote {
    pub path: String,
    pub score: f32,
}

/// Configuration for embedding exclusions.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct EmbeddingConfig {
    pub excluded_paths: Vec<String>,
    pub excluded_tags: Vec<String>,
}

/// The embedding service manages vector storage and similarity search.
pub struct EmbeddingService {
    vault_root: PathBuf,
    embeddings_dir: PathBuf,
    cache: HashMap<String, Vec<f32>>,
    config: EmbeddingConfig,
    model_ready: bool,
}

impl EmbeddingService {
    pub fn new(vault_root: &Path) -> Self {
        let embeddings_dir = vault_root.join(".bismuth").join("embeddings");
        Self {
            vault_root: vault_root.to_path_buf(),
            embeddings_dir,
            cache: HashMap::new(),
            config: EmbeddingConfig::default(),
            model_ready: false,
        }
    }

    pub fn initialize(&mut self) -> Result<()> {
        fs::create_dir_all(&self.embeddings_dir)?;
        self.load_config();
        indexing::load_cache(&self.embeddings_dir, &mut self.cache)?;
        self.model_ready = true;
        Ok(())
    }

    fn load_config(&mut self) {
        let config_path = self.vault_root.join(".bismuth").join("embedding-config.json");
        if let Ok(content) = fs::read_to_string(&config_path) {
            if let Ok(config) = serde_json::from_str::<EmbeddingConfig>(&content) {
                self.config = config;
            }
        }
    }

    pub fn save_config(&self) -> Result<()> {
        let config_path = self.vault_root.join(".bismuth").join("embedding-config.json");
        let content = serde_json::to_string_pretty(&self.config)
            .map_err(|e| BismuthError::Generic(e.to_string()))?;
        fs::write(&config_path, content)?;
        Ok(())
    }

    pub fn set_config(&mut self, config: EmbeddingConfig) -> Result<()> {
        self.config = config;
        self.save_config()
    }

    pub fn get_config(&self) -> &EmbeddingConfig {
        &self.config
    }

    pub fn is_excluded(&self, path: &str, tags: &[String]) -> bool {
        for pattern in &self.config.excluded_paths {
            if path.contains(pattern) || glob_match(pattern, path) {
                return true;
            }
        }
        for tag in tags {
            if self.config.excluded_tags.contains(tag) {
                return true;
            }
        }
        false
    }

    pub fn embed(&self, text: &str) -> Result<Vec<f32>> {
        indexing::embed(text)
    }

    pub fn embed_batch(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>> {
        indexing::embed_batch(texts)
    }

    pub fn store_embedding(&mut self, path: &str, vector: &[f32]) -> Result<()> {
        indexing::store_embedding(&self.embeddings_dir, &mut self.cache, path, vector)
    }

    pub fn remove_embedding(&mut self, path: &str) -> Result<()> {
        indexing::remove_embedding(&self.embeddings_dir, &mut self.cache, path)
    }

    pub fn get_similar(&self, path: &str, top_k: usize) -> Result<Vec<SimilarNote>> {
        let query_vec = self.cache.get(path)
            .ok_or_else(|| BismuthError::Generic(format!("No embedding for: {}", path)))?;
        Ok(search::top_k_similar(&self.cache, query_vec, Some(path), top_k))
    }

    pub fn get_similar_to_vector(&self, query_vec: &[f32], top_k: usize) -> Vec<SimilarNote> {
        search::top_k_similar(&self.cache, query_vec, None, top_k)
    }

    pub fn has_embedding(&self, path: &str) -> bool {
        self.cache.contains_key(path)
    }

    pub fn embedding_count(&self) -> usize {
        self.cache.len()
    }

    pub fn is_ready(&self) -> bool {
        self.model_ready
    }

    #[cfg(test)]
    fn vec_path(&self, note_path: &str) -> PathBuf {
        indexing::vec_path(&self.embeddings_dir, note_path)
    }

    #[cfg(test)]
    fn read_vec_file(&self, path: &Path) -> Result<Vec<f32>> {
        indexing::read_vec_file(path)
    }
}

/// Simple glob matching (supports * and ** patterns).
fn glob_match(pattern: &str, path: &str) -> bool {
    if pattern.contains("**") {
        let parts: Vec<&str> = pattern.split("**").collect();
        if parts.len() == 2 {
            return path.starts_with(parts[0]) && path.ends_with(parts[1]);
        }
    }
    if pattern.starts_with('*') {
        return path.ends_with(&pattern[1..]);
    }
    if pattern.ends_with('*') {
        return path.starts_with(&pattern[..pattern.len() - 1]);
    }
    path == pattern
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_embed_produces_normalized_vector() {
        let tmp = TempDir::new().unwrap();
        let service = EmbeddingService::new(tmp.path());
        let vec = service.embed("Hello world this is a test").unwrap();
        assert_eq!(vec.len(), EMBEDDING_DIM);
        let norm: f32 = vec.iter().map(|x| x * x).sum::<f32>().sqrt();
        assert!((norm - 1.0).abs() < 0.01);
    }

    #[test]
    fn test_embed_empty_text() {
        let tmp = TempDir::new().unwrap();
        let service = EmbeddingService::new(tmp.path());
        let vec = service.embed("").unwrap();
        assert_eq!(vec.len(), EMBEDDING_DIM);
        assert!(vec.iter().all(|&v| v == 0.0));
    }

    #[test]
    fn test_similar_texts_have_higher_similarity() {
        let tmp = TempDir::new().unwrap();
        let service = EmbeddingService::new(tmp.path());
        let v1 = service.embed("rust programming language systems").unwrap();
        let v2 = service.embed("rust language systems programming").unwrap();
        let v3 = service.embed("cooking recipes for chocolate cake").unwrap();
        let sim_related = search::cosine_similarity(&v1, &v2);
        let sim_unrelated = search::cosine_similarity(&v1, &v3);
        assert!(sim_related > sim_unrelated);
    }

    #[test]
    fn test_store_and_retrieve_embedding() {
        let tmp = TempDir::new().unwrap();
        let mut service = EmbeddingService::new(tmp.path());
        service.initialize().unwrap();
        let vec = service.embed("test note content").unwrap();
        service.store_embedding("notes/test.md", &vec).unwrap();
        assert!(service.has_embedding("notes/test.md"));
        assert_eq!(service.embedding_count(), 1);
    }

    #[test]
    fn test_get_similar() {
        let tmp = TempDir::new().unwrap();
        let mut service = EmbeddingService::new(tmp.path());
        service.initialize().unwrap();
        let texts = [
            ("notes/rust.md", "rust programming systems language"),
            ("notes/python.md", "python programming scripting language"),
            ("notes/cooking.md", "baking chocolate cake recipe dessert"),
        ];
        for (path, text) in &texts {
            let vec = service.embed(text).unwrap();
            service.store_embedding(path, &vec).unwrap();
        }
        let similar = service.get_similar("notes/rust.md", 2).unwrap();
        assert_eq!(similar.len(), 2);
        assert_eq!(similar[0].path, "notes/python.md");
    }

    #[test]
    fn test_exclusion_by_path() {
        let tmp = TempDir::new().unwrap();
        let mut service = EmbeddingService::new(tmp.path());
        service.config.excluded_paths = vec!["templates/".to_string()];
        assert!(service.is_excluded("templates/daily.md", &[]));
        assert!(!service.is_excluded("notes/daily.md", &[]));
    }

    #[test]
    fn test_exclusion_by_tag() {
        let tmp = TempDir::new().unwrap();
        let mut service = EmbeddingService::new(tmp.path());
        service.config.excluded_tags = vec!["private".to_string()];
        assert!(service.is_excluded("notes/secret.md", &["private".to_string()]));
        assert!(!service.is_excluded("notes/public.md", &["public".to_string()]));
    }

    #[test]
    fn test_vec_path_extension_only() {
        let tmp = TempDir::new().unwrap();
        let service = EmbeddingService::new(tmp.path());
        let path = service.vec_path("readme.md.backup.md");
        assert!(path.to_string_lossy().ends_with("readme.md.backup.vec"));
    }

    #[test]
    fn test_read_vec_file_validates_size() {
        let tmp = TempDir::new().unwrap();
        let mut service = EmbeddingService::new(tmp.path());
        service.initialize().unwrap();
        let vec_file = tmp.path().join(".bismuth/embeddings/bad.vec");
        std::fs::create_dir_all(vec_file.parent().unwrap()).unwrap();
        std::fs::write(&vec_file, b"truncated data").unwrap();
        let result = service.read_vec_file(&vec_file);
        assert!(result.is_err());
    }
}
