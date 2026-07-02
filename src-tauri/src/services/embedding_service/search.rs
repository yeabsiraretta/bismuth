//! Similarity search operations for the embedding service

use super::SimilarNote;

/// Compute cosine similarity between two vectors.
pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
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

/// Get the top-K most similar notes from a cache given a query vector.
pub fn top_k_similar(
    cache: &std::collections::HashMap<String, Vec<f32>>,
    query_vec: &[f32],
    exclude_path: Option<&str>,
    top_k: usize,
) -> Vec<SimilarNote> {
    let mut scores: Vec<SimilarNote> = cache
        .iter()
        .filter(|(k, _)| {
            if let Some(excl) = exclude_path {
                k.as_str() != excl
            } else {
                true
            }
        })
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
