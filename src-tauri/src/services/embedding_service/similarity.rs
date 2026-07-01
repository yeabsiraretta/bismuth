//! Cosine similarity computation and cache for embedding vectors.

use std::collections::HashMap;
use std::path::{Path, PathBuf};

/// A similarity result between the query note and a target note.
#[derive(Debug, Clone, serde::Serialize)]
pub struct SimilarNote {
    pub path: String,
    pub title: String,
    pub score: f64,
}

/// In-memory embedding vector cache.
pub struct EmbeddingCache {
    vectors: HashMap<PathBuf, Vec<f32>>,
}

impl EmbeddingCache {
    pub fn new() -> Self {
        Self {
            vectors: HashMap::new(),
        }
    }

    /// Store an embedding for a file path.
    pub fn insert(&mut self, path: PathBuf, vector: Vec<f32>) {
        self.vectors.insert(path, vector);
    }

    /// Invalidate a cached embedding (on file change).
    pub fn invalidate(&mut self, path: &Path) {
        self.vectors.remove(path);
    }

    /// Get cached vector for a path.
    pub fn get(&self, path: &Path) -> Option<&Vec<f32>> {
        self.vectors.get(path)
    }

    /// Number of cached entries.
    pub fn len(&self) -> usize {
        self.vectors.len()
    }

    /// Get all cached paths.
    pub fn paths(&self) -> Vec<&PathBuf> {
        self.vectors.keys().collect()
    }
}

/// Compute cosine similarity between two vectors.
pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f64 {
    if a.len() != b.len() || a.is_empty() {
        return 0.0;
    }

    let dot: f64 = a.iter().zip(b.iter()).map(|(x, y)| (*x as f64) * (*y as f64)).sum();
    let mag_a: f64 = a.iter().map(|x| (*x as f64) * (*x as f64)).sum::<f64>().sqrt();
    let mag_b: f64 = b.iter().map(|x| (*x as f64) * (*x as f64)).sum::<f64>().sqrt();

    if mag_a == 0.0 || mag_b == 0.0 {
        return 0.0;
    }

    dot / (mag_a * mag_b)
}

/// Find top-N similar notes to the given query vector.
pub fn find_similar(
    query_path: &Path,
    query_vector: &[f32],
    cache: &EmbeddingCache,
    top_n: usize,
    exclude_folders: &[String],
) -> Vec<SimilarNote> {
    let mut scores: Vec<(PathBuf, f64)> = Vec::new();

    for (path, vector) in &cache.vectors {
        // Skip self
        if path == query_path {
            continue;
        }
        // Skip excluded folders
        let path_str = path.to_string_lossy();
        if exclude_folders.iter().any(|f| path_str.contains(f)) {
            continue;
        }

        let score = cosine_similarity(query_vector, vector);
        scores.push((path.clone(), score));
    }

    // Sort by score descending
    scores.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
    scores.truncate(top_n);

    scores.into_iter().map(|(path, score)| {
        let title = path.file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_default();
        SimilarNote {
            path: path.to_string_lossy().to_string(),
            title,
            score,
        }
    }).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cosine_similarity_identical() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![1.0, 0.0, 0.0];
        let sim = cosine_similarity(&a, &b);
        assert!((sim - 1.0).abs() < 1e-10);
    }

    #[test]
    fn test_cosine_similarity_orthogonal() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![0.0, 1.0, 0.0];
        let sim = cosine_similarity(&a, &b);
        assert!((sim - 0.0).abs() < 1e-10);
    }

    #[test]
    fn test_cosine_similarity_opposite() {
        let a = vec![1.0, 0.0];
        let b = vec![-1.0, 0.0];
        let sim = cosine_similarity(&a, &b);
        assert!((sim - (-1.0)).abs() < 1e-10);
    }

    #[test]
    fn test_find_similar() {
        let mut cache = EmbeddingCache::new();
        cache.insert(PathBuf::from("/vault/note1.md"), vec![1.0, 0.0, 0.0]);
        cache.insert(PathBuf::from("/vault/note2.md"), vec![0.9, 0.1, 0.0]);
        cache.insert(PathBuf::from("/vault/note3.md"), vec![0.0, 1.0, 0.0]);

        let query = vec![1.0, 0.0, 0.0];
        let results = find_similar(
            Path::new("/vault/note1.md"),
            &query,
            &cache,
            2,
            &[],
        );
        assert_eq!(results.len(), 2);
        assert_eq!(results[0].title, "note2"); // Most similar
    }

    #[test]
    fn test_cache_operations() {
        let mut cache = EmbeddingCache::new();
        let path = PathBuf::from("/test.md");
        cache.insert(path.clone(), vec![1.0, 2.0]);
        assert_eq!(cache.len(), 1);
        assert!(cache.get(&path).is_some());
        cache.invalidate(&path);
        assert!(cache.get(&path).is_none());
    }
}
