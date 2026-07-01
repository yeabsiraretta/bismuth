//! Embedding generation and vector storage operations

use crate::error::{BismuthError, Result};
use byteorder::{LittleEndian, ReadBytesExt, WriteBytesExt};
use std::collections::HashMap;
use std::fs;
use std::io::{BufWriter, Cursor};
use std::path::{Path, PathBuf};

use super::EMBEDDING_DIM;

/// Embed text into a dense vector using character n-gram hashing.
///
/// This is a lightweight fallback that works without a neural model.
/// Produces deterministic embeddings useful for similarity search.
pub fn embed(text: &str) -> Result<Vec<f32>> {
    if text.is_empty() {
        return Ok(vec![0.0; EMBEDDING_DIM]);
    }

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
            vector[hash] += 2.0;
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
pub fn embed_batch(texts: &[&str]) -> Result<Vec<Vec<f32>>> {
    texts.iter().map(|t| embed(t)).collect()
}

/// Store an embedding vector to a .vec binary file and update cache.
pub fn store_embedding(
    embeddings_dir: &Path,
    cache: &mut HashMap<String, Vec<f32>>,
    path: &str,
    vector: &[f32],
) -> Result<()> {
    let file_path = vec_path(embeddings_dir, path);
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

    cache.insert(path.to_string(), vector.to_vec());
    Ok(())
}

/// Remove stored embedding for a note.
pub fn remove_embedding(
    embeddings_dir: &Path,
    cache: &mut HashMap<String, Vec<f32>>,
    path: &str,
) -> Result<()> {
    let file_path = vec_path(embeddings_dir, path);
    if file_path.exists() {
        fs::remove_file(&file_path)?;
    }
    cache.remove(path);
    Ok(())
}

/// Load all embeddings from disk into the in-memory cache.
pub fn load_cache(embeddings_dir: &Path, cache: &mut HashMap<String, Vec<f32>>) -> Result<()> {
    cache.clear();
    if !embeddings_dir.exists() {
        return Ok(());
    }
    load_cache_recursive(embeddings_dir, embeddings_dir, cache)?;
    Ok(())
}

fn load_cache_recursive(
    base_dir: &Path,
    dir: &Path,
    cache: &mut HashMap<String, Vec<f32>>,
) -> Result<()> {
    let entries = fs::read_dir(dir)?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            load_cache_recursive(base_dir, &path, cache)?;
        } else if path.extension().map_or(false, |ext| ext == "vec") {
            if let Ok(vector) = read_vec_file(&path) {
                let relative = path
                    .strip_prefix(base_dir)
                    .unwrap_or(&path)
                    .with_extension("md");
                let note_path = relative.to_string_lossy().to_string();
                cache.insert(note_path, vector);
            }
        }
    }
    Ok(())
}

/// Read a vector from a .vec binary file with size validation.
pub fn read_vec_file(path: &Path) -> Result<Vec<f32>> {
    let data = fs::read(path)?;
    let expected_size = EMBEDDING_DIM * 4;
    if data.len() != expected_size {
        return Err(BismuthError::Generic(format!(
            "Invalid .vec file size: expected {} bytes, got {} ({})",
            expected_size, data.len(), path.display()
        )));
    }
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

/// Convert a note path to its .vec file path (extension-only replacement).
pub fn vec_path(embeddings_dir: &Path, note_path: &str) -> PathBuf {
    let p = Path::new(note_path);
    let sanitized = p.with_extension("vec");
    embeddings_dir.join(sanitized)
}

fn simple_hash(chars: &[char]) -> usize {
    let mut h: usize = 0;
    for &c in chars {
        h = h.wrapping_mul(31).wrapping_add(c as usize);
    }
    h
}

fn word_hash(word: &str) -> usize {
    let mut h: usize = 5381;
    for b in word.bytes() {
        h = h.wrapping_mul(33).wrapping_add(b as usize);
    }
    h
}
