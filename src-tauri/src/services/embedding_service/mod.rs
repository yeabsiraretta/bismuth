//! Semantic embedding service (FR-025)
//!
//! Provides local, offline embeddings using character n-gram hashing.
//! Embeds note content into dense vectors and supports cosine similarity search
//! for the Connections view. Vectors stored as `.vec` files in `.bismuth/embeddings/`.

pub mod indexing;
pub mod note_linker;
pub mod search;
pub mod similarity;
pub(crate) mod embedding_pipeline;

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
    /// Creates a new `EmbeddingService` for the given vault.
    ///
    /// Initializes the embeddings directory path at `.bismuth/embeddings/`
    /// but does not load vectors from disk until [`initialize`](Self::initialize) is called.
    pub fn new(vault_root: &Path) -> Self {
        use crate::config::constants::filesystem::VAULT_DIR_NAME;
        let embeddings_dir = vault_root.join(VAULT_DIR_NAME).join("embeddings");
        Self {
            vault_root: vault_root.to_path_buf(),
            embeddings_dir,
            cache: HashMap::new(),
            config: EmbeddingConfig::default(),
            model_ready: false,
        }
    }

    /// Initializes the embedding service by creating the storage directory,
    /// loading configuration, and populating the in-memory vector cache from disk.
    ///
    /// Must be called before any embed/search operations.
    pub fn initialize(&mut self) -> Result<()> {
        fs::create_dir_all(&self.embeddings_dir)?;
        self.load_config();
        indexing::load_cache(&self.embeddings_dir, &mut self.cache)?;
        self.model_ready = true;
        Ok(())
    }

    fn load_config(&mut self) {
        self.config = embedding_pipeline::load_config(&self.vault_root);
    }

    /// Persists the current embedding configuration to `.bismuth/embedding-config.json`.
    pub fn save_config(&self) -> Result<()> {
        embedding_pipeline::save_config(&self.vault_root, &self.config)
    }

    /// Replaces the embedding configuration and persists it to disk.
    ///
    /// # Arguments
    ///
    /// * `config` — New exclusion rules for paths and tags.
    pub fn set_config(&mut self, config: EmbeddingConfig) -> Result<()> {
        self.config = config;
        self.save_config()
    }

    /// Returns a reference to the current embedding configuration.
    pub fn get_config(&self) -> &EmbeddingConfig {
        &self.config
    }

    /// Checks whether a note should be excluded from embedding based on
    /// configured path patterns and tag exclusions.
    pub fn is_excluded(&self, path: &str, tags: &[String]) -> bool {
        embedding_pipeline::is_excluded(&self.config, path, tags)
    }

    /// Generates a dense embedding vector for the given text.
    ///
    /// Uses character n-gram hashing (no neural model required).
    /// The resulting vector has [`EMBEDDING_DIM`] dimensions.
    pub fn embed(&self, text: &str) -> Result<Vec<f32>> {
        indexing::embed(text)
    }

    /// Generates embedding vectors for multiple texts in one call.
    ///
    /// Each text is independently embedded; no cross-document context is used.
    pub fn embed_batch(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>> {
        indexing::embed_batch(texts)
    }

    /// Stores an embedding vector to disk and updates the in-memory cache.
    ///
    /// The vector is written as a binary `.vec` file under the embeddings directory.
    ///
    /// # Arguments
    ///
    /// * `path` — Relative note path (used as the cache key and file name).
    /// * `vector` — The embedding vector to persist.
    pub fn store_embedding(&mut self, path: &str, vector: &[f32]) -> Result<()> {
        indexing::store_embedding(&self.embeddings_dir, &mut self.cache, path, vector)
    }

    /// Removes a stored embedding from both disk and the in-memory cache.
    ///
    /// No-ops gracefully if the embedding does not exist.
    pub fn remove_embedding(&mut self, path: &str) -> Result<()> {
        indexing::remove_embedding(&self.embeddings_dir, &mut self.cache, path)
    }

    /// Finds the top-K most similar notes to the given note path.
    ///
    /// Uses cosine similarity on the cached embedding vectors.
    /// Returns an error if no embedding exists for the given path.
    ///
    /// # Arguments
    ///
    /// * `path` — Relative note path whose embedding is the query.
    /// * `top_k` — Maximum number of results to return.
    pub fn get_similar(&self, path: &str, top_k: usize) -> Result<Vec<SimilarNote>> {
        let query_vec = self.cache.get(path)
            .ok_or_else(|| BismuthError::Generic(format!("No embedding for: {}", path)))?;
        Ok(search::top_k_similar(&self.cache, query_vec, Some(path), top_k))
    }

    /// Finds the top-K most similar notes to an arbitrary query vector.
    ///
    /// Useful for text-based lookups where the query is not an existing note.
    pub fn get_similar_to_vector(&self, query_vec: &[f32], top_k: usize) -> Vec<SimilarNote> {
        search::top_k_similar(&self.cache, query_vec, None, top_k)
    }

    /// Returns `true` if an embedding vector is cached for the given note path.
    pub fn has_embedding(&self, path: &str) -> bool {
        self.cache.contains_key(path)
    }

    /// Returns the total number of embeddings currently held in the cache.
    pub fn embedding_count(&self) -> usize {
        self.cache.len()
    }

    /// Returns `true` once [`initialize`](Self::initialize) has completed successfully.
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
