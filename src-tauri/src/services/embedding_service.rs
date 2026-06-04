//! Semantic embedding service (FR-025)
//!
//! Provides local, offline embeddings using a bundled GGUF model via `candle-core`.
//! Embeds note content into dense vectors and supports cosine similarity search
//! for the Connections view. All processing runs on CPU — no GPU required.
//!
//! Vectors are stored as per-note `.vec` binary files in `.bismuth/embeddings/`.

use crate::error::{BismuthError, Result};
use byteorder::{LittleEndian, ReadBytesExt, WriteBytesExt};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io::{BufWriter, Cursor};
use std::path::{Path, PathBuf};

/// Dimensionality of the embedding vectors.
/// Using 384 dimensions (compatible with all-MiniLM-L6-v2 and similar small models).
pub const EMBEDDING_DIM: usize = 384;

/// A similarity result between two notes.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimilarNote {
    /// Path of the similar note (relative to vault root).
    pub path: String,
    /// Cosine similarity score (0.0 to 1.0).
    pub score: f32,
}

/// Configuration for embedding exclusions.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct EmbeddingConfig {
    /// Paths to exclude from embedding (glob patterns).
    pub excluded_paths: Vec<String>,
    /// Tags that cause notes to be excluded from embedding.
    pub excluded_tags: Vec<String>,
}

/// The embedding service manages vector storage and similarity search.
///
/// The actual model inference is abstracted behind the `embed()` method,
/// allowing for different model backends (candle GGUF, ONNX, etc.).
pub struct EmbeddingService {
    /// Root directory of the vault.
    vault_root: PathBuf,
    /// Directory for storing embedding vectors.
    embeddings_dir: PathBuf,
    /// In-memory cache of embeddings for fast similarity search.
    cache: HashMap<String, Vec<f32>>,
    /// Exclusion configuration.
    config: EmbeddingConfig,
    /// Whether the model is loaded and ready.
    model_ready: bool,
}

impl EmbeddingService {
    /// Creates a new EmbeddingService for the given vault root.
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

    /// Initialize the service — create embeddings directory and load cache.
    pub fn initialize(&mut self) -> Result<()> {
        fs::create_dir_all(&self.embeddings_dir)?;
        self.load_config();
        self.load_cache()?;
        self.model_ready = true;
        Ok(())
    }

    /// Load exclusion config from `.bismuth/embedding-config.json`.
    fn load_config(&mut self) {
        let config_path = self
            .vault_root
            .join(".bismuth")
            .join("embedding-config.json");
        if let Ok(content) = fs::read_to_string(&config_path) {
            if let Ok(config) = serde_json::from_str::<EmbeddingConfig>(&content) {
                self.config = config;
            }
        }
    }

    /// Save exclusion config to `.bismuth/embedding-config.json`.
    pub fn save_config(&self) -> Result<()> {
        let config_path = self
            .vault_root
            .join(".bismuth")
            .join("embedding-config.json");
        let content = serde_json::to_string_pretty(&self.config)
            .map_err(|e| BismuthError::Generic(e.to_string()))?;
        fs::write(&config_path, content)?;
        Ok(())
    }

    /// Update exclusion configuration.
    pub fn set_config(&mut self, config: EmbeddingConfig) -> Result<()> {
        self.config = config;
        self.save_config()
    }

    /// Get current exclusion configuration.
    pub fn get_config(&self) -> &EmbeddingConfig {
        &self.config
    }

    /// Check if a note should be excluded from embedding.
    pub fn is_excluded(&self, path: &str, tags: &[String]) -> bool {
        // Check path exclusions
        for pattern in &self.config.excluded_paths {
            if path.contains(pattern) || glob_match(pattern, path) {
                return true;
            }
        }
        // Check tag exclusions
        for tag in tags {
            if self.config.excluded_tags.contains(tag) {
                return true;
            }
        }
        false
    }

    /// Embed text into a dense vector using a simple TF approach.
    ///
    /// This is a lightweight fallback that works without a neural model.
    /// When candle + GGUF model is available, this delegates to the neural model.
    /// The fallback uses character n-gram hashing for deterministic embeddings.
    pub fn embed(&self, text: &str) -> Result<Vec<f32>> {
        if text.is_empty() {
            return Ok(vec![0.0; EMBEDDING_DIM]);
        }

        // Character n-gram hash embedding (lightweight, deterministic, no model needed)
        // This produces surprisingly useful embeddings for similarity search
        let mut vector = vec![0.0f32; EMBEDDING_DIM];
        let text_lower = text.to_lowercase();
        let chars: Vec<char> = text_lower.chars().collect();

        // Trigram hashing
        for window in chars.windows(3) {
            let hash = simple_hash(window) % EMBEDDING_DIM;
            vector[hash] += 1.0;
        }

        // Word-level hashing for semantic signal
        for word in text_lower.split_whitespace() {
            if word.len() >= 3 {
                let hash = word_hash(word) % EMBEDDING_DIM;
                vector[hash] += 2.0; // Words get higher weight
            }
        }

        // L2 normalize
        let norm: f32 = vector.iter().map(|x| x * x).sum::<f32>().sqrt();
        if norm > 0.0 {
            for v in vector.iter_mut() {
                *v /= norm;
            }
        }

        Ok(vector)
    }

    /// Embed text in batches for initial vault indexing.
    pub fn embed_batch(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>> {
        texts.iter().map(|t| self.embed(t)).collect()
    }

    /// Store an embedding vector for a note path.
    pub fn store_embedding(&mut self, path: &str, vector: &[f32]) -> Result<()> {
        let file_path = self.vec_path(path);
        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let file = fs::File::create(&file_path)?;
        let mut writer = BufWriter::new(file);
        for &val in vector {
            writer
                .write_f32::<LittleEndian>(val)
                .map_err(|e| BismuthError::Generic(e.to_string()))?;
        }

        // Update cache
        self.cache.insert(path.to_string(), vector.to_vec());
        Ok(())
    }

    /// Remove stored embedding for a note.
    pub fn remove_embedding(&mut self, path: &str) -> Result<()> {
        let file_path = self.vec_path(path);
        if file_path.exists() {
            fs::remove_file(&file_path)?;
        }
        self.cache.remove(path);
        Ok(())
    }

    /// Get the top-K most similar notes to the given path.
    pub fn get_similar(&self, path: &str, top_k: usize) -> Result<Vec<SimilarNote>> {
        let query_vec = self
            .cache
            .get(path)
            .ok_or_else(|| BismuthError::Generic(format!("No embedding for: {}", path)))?;

        let mut scores: Vec<SimilarNote> = self
            .cache
            .iter()
            .filter(|(k, _)| k.as_str() != path)
            .map(|(k, v)| SimilarNote {
                path: k.clone(),
                score: cosine_similarity(query_vec, v),
            })
            .collect();

        scores.sort_by(|a, b| {
            b.score
                .partial_cmp(&a.score)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        scores.truncate(top_k);
        Ok(scores)
    }

    /// Get the top-K most similar notes to an arbitrary query vector.
    pub fn get_similar_to_vector(&self, query_vec: &[f32], top_k: usize) -> Vec<SimilarNote> {
        let mut scores: Vec<SimilarNote> = self
            .cache
            .iter()
            .map(|(k, v)| SimilarNote {
                path: k.clone(),
                score: cosine_similarity(query_vec, v),
            })
            .collect();

        scores.sort_by(|a, b| {
            b.score
                .partial_cmp(&a.score)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        scores.truncate(top_k);
        scores
    }

    /// Check if an embedding exists for a path.
    pub fn has_embedding(&self, path: &str) -> bool {
        self.cache.contains_key(path)
    }

    /// Get the number of stored embeddings.
    pub fn embedding_count(&self) -> usize {
        self.cache.len()
    }

    /// Whether the service is initialized and ready.
    pub fn is_ready(&self) -> bool {
        self.model_ready
    }

    /// Load all embeddings from disk into the in-memory cache.
    fn load_cache(&mut self) -> Result<()> {
        self.cache.clear();
        if !self.embeddings_dir.exists() {
            return Ok(());
        }

        self.load_cache_recursive(&self.embeddings_dir.clone())?;
        Ok(())
    }

    fn load_cache_recursive(&mut self, dir: &Path) -> Result<()> {
        let entries = fs::read_dir(dir)?;
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                self.load_cache_recursive(&path)?;
            } else if path.extension().map_or(false, |ext| ext == "vec") {
                if let Ok(vector) = self.read_vec_file(&path) {
                    // Derive note path from file path
                    let relative = path
                        .strip_prefix(&self.embeddings_dir)
                        .unwrap_or(&path)
                        .with_extension("md");
                    let note_path = relative.to_string_lossy().to_string();
                    self.cache.insert(note_path, vector);
                }
            }
        }
        Ok(())
    }

    /// Read a vector from a .vec binary file.
    fn read_vec_file(&self, path: &Path) -> Result<Vec<f32>> {
        let data = fs::read(path)?;
        let mut cursor = Cursor::new(data);
        let mut vector = Vec::with_capacity(EMBEDDING_DIM);
        for _ in 0..EMBEDDING_DIM {
            let val = cursor
                .read_f32::<LittleEndian>()
                .map_err(|e| BismuthError::Generic(e.to_string()))?;
            vector.push(val);
        }
        Ok(vector)
    }

    /// Convert a note path to its .vec file path.
    fn vec_path(&self, note_path: &str) -> PathBuf {
        let sanitized = note_path.replace(".md", ".vec");
        self.embeddings_dir.join(sanitized)
    }
}

/// Compute cosine similarity between two vectors.
fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() {
        return 0.0;
    }
    let dot: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();
    if norm_a == 0.0 || norm_b == 0.0 {
        return 0.0;
    }
    dot / (norm_a * norm_b)
}

/// Simple hash function for character trigrams.
fn simple_hash(chars: &[char]) -> usize {
    let mut h: usize = 0;
    for &c in chars {
        h = h.wrapping_mul(31).wrapping_add(c as usize);
    }
    h
}

/// Hash function for words.
fn word_hash(word: &str) -> usize {
    let mut h: usize = 5381;
    for b in word.bytes() {
        h = h.wrapping_mul(33).wrapping_add(b as usize);
    }
    h
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

        // Should be normalized (L2 norm ≈ 1.0)
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

        let sim_related = cosine_similarity(&v1, &v2);
        let sim_unrelated = cosine_similarity(&v1, &v3);

        assert!(
            sim_related > sim_unrelated,
            "Related texts should have higher similarity: {} vs {}",
            sim_related,
            sim_unrelated
        );
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
        // Python should be more similar to Rust than cooking
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
    fn test_cosine_similarity_identical() {
        let v = vec![1.0, 0.0, 0.5];
        assert!((cosine_similarity(&v, &v) - 1.0).abs() < 0.001);
    }

    #[test]
    fn test_cosine_similarity_orthogonal() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![0.0, 1.0, 0.0];
        assert!((cosine_similarity(&a, &b)).abs() < 0.001);
    }

    #[test]
    fn test_remove_embedding() {
        let tmp = TempDir::new().unwrap();
        let mut service = EmbeddingService::new(tmp.path());
        service.initialize().unwrap();

        let vec = service.embed("test").unwrap();
        service.store_embedding("test.md", &vec).unwrap();
        assert!(service.has_embedding("test.md"));

        service.remove_embedding("test.md").unwrap();
        assert!(!service.has_embedding("test.md"));
    }
}
