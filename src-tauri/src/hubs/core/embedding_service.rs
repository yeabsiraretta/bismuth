use std::collections::HashMap;
use std::fs;

use serde::{Deserialize, Serialize};

use crate::infrastructure::error::AppResult;
use crate::infrastructure::state::AppState;

use super::vault_service;

// ── Types ────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SmartConnection {
    pub path: String,
    pub title: String,
    pub score: f64,
    pub snippet: String,
}

// ── Stop words ───────────────────────────────────────────────────────────────

const STOP_WORDS: &[&str] = &[
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "it", "as", "be", "was", "are",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "shall", "can", "this",
    "that", "these", "those", "i", "you", "he", "she", "we", "they",
    "me", "him", "her", "us", "them", "my", "your", "his", "its", "our",
    "their", "what", "which", "who", "whom", "when", "where", "why", "how",
    "not", "no", "nor", "if", "then", "else", "so", "up", "out", "just",
    "about", "into", "through", "during", "before", "after", "above",
    "below", "between", "each", "all", "both", "few", "more", "most",
    "other", "some", "such", "than", "too", "very", "also", "here",
    "there", "again", "once", "only", "own", "same", "over", "any",
];

fn is_stop_word(w: &str) -> bool {
    STOP_WORDS.contains(&w)
}

// ── Tokenization ─────────────────────────────────────────────────────────────

pub fn tokenize(text: &str) -> Vec<String> {
    use regex::Regex;
    use std::sync::OnceLock;

    static FM_RE: OnceLock<Regex> = OnceLock::new();
    static CODE_RE: OnceLock<Regex> = OnceLock::new();
    static URL_RE: OnceLock<Regex> = OnceLock::new();
    static LINK_RE: OnceLock<Regex> = OnceLock::new();
    static MD_RE: OnceLock<Regex> = OnceLock::new();

    let fm = FM_RE.get_or_init(|| Regex::new(r"(?s)^---\s*\n.*?\n---").unwrap());
    let code = CODE_RE.get_or_init(|| Regex::new(r"```[\s\S]*?```").unwrap());
    let url = URL_RE.get_or_init(|| Regex::new(r"https?://\S+").unwrap());
    let link = LINK_RE.get_or_init(|| Regex::new(r"\[\[([^\]]+)\]\]").unwrap());
    let md = MD_RE.get_or_init(|| Regex::new(r"[#*_`~\[\]()>!|\\]").unwrap());

    let cleaned = fm.replace_all(text, "");
    let cleaned = code.replace_all(&cleaned, "");
    let cleaned = url.replace_all(&cleaned, "");
    let cleaned = link.replace_all(&cleaned, "$1");
    let cleaned = md.replace_all(&cleaned, " ");

    cleaned
        .to_lowercase()
        .split(|c: char| !c.is_alphanumeric())
        .filter(|w| w.len() >= 2 && !is_stop_word(w) && w.parse::<f64>().is_err())
        .map(|w| w.to_string())
        .collect()
}

// ── TF-IDF ───────────────────────────────────────────────────────────────────

fn compute_tf(tokens: &[String]) -> HashMap<String, f64> {
    let mut tf: HashMap<String, f64> = HashMap::new();
    for token in tokens {
        *tf.entry(token.clone()).or_insert(0.0) += 1.0;
    }
    let len = tokens.len() as f64;
    if len > 0.0 {
        for v in tf.values_mut() {
            *v /= len;
        }
    }
    tf
}

fn compute_idf(doc_tfs: &[HashMap<String, f64>]) -> HashMap<String, f64> {
    let n = doc_tfs.len() as f64;
    let mut df: HashMap<String, f64> = HashMap::new();
    for tf in doc_tfs {
        for term in tf.keys() {
            *df.entry(term.clone()).or_insert(0.0) += 1.0;
        }
    }
    let mut idf: HashMap<String, f64> = HashMap::new();
    for (term, count) in &df {
        idf.insert(term.clone(), ((n + 1.0) / (count + 1.0)).ln() + 1.0);
    }
    idf
}

struct TfIdfVector {
    terms: HashMap<String, f64>,
    magnitude: f64,
}

fn build_tfidf_vector(tf: &HashMap<String, f64>, idf: &HashMap<String, f64>) -> TfIdfVector {
    let mut terms: HashMap<String, f64> = HashMap::new();
    let mut sum_sq = 0.0f64;
    for (term, freq) in tf {
        let idf_val = idf.get(term).copied().unwrap_or(1.0);
        let weight = freq * idf_val;
        terms.insert(term.clone(), weight);
        sum_sq += weight * weight;
    }
    TfIdfVector {
        terms,
        magnitude: sum_sq.sqrt(),
    }
}

fn cosine_similarity(a: &TfIdfVector, b: &TfIdfVector) -> f64 {
    if a.magnitude == 0.0 || b.magnitude == 0.0 {
        return 0.0;
    }
    let (smaller, larger) = if a.terms.len() <= b.terms.len() {
        (&a.terms, &b.terms)
    } else {
        (&b.terms, &a.terms)
    };
    let mut dot = 0.0f64;
    for (term, wa) in smaller {
        if let Some(wb) = larger.get(term) {
            dot += wa * wb;
        }
    }
    dot / (a.magnitude * b.magnitude)
}

// ── Public API ───────────────────────────────────────────────────────────────

pub fn find_similar_notes(
    state: &AppState,
    note_path: &str,
    limit: usize,
    min_score: f64,
) -> AppResult<Vec<SmartConnection>> {
    let root = state.vault_root()?;
    let all_notes = vault_service::scan_vault(state)?;

    // Tokenize all documents
    let mut doc_ids: Vec<String> = Vec::new();
    let mut doc_tfs: Vec<HashMap<String, f64>> = Vec::new();
    let mut contents: HashMap<String, String> = HashMap::new();

    for note in &all_notes {
        let full_path = root.join(&note.path);
        if let Ok(content) = fs::read_to_string(&full_path) {
            let tokens = tokenize(&content);
            let tf = compute_tf(&tokens);
            doc_ids.push(note.path.clone());
            doc_tfs.push(tf);
            contents.insert(note.path.clone(), content);
        }
    }

    let idf = compute_idf(&doc_tfs);

    // Build vectors
    let mut vectors: HashMap<String, TfIdfVector> = HashMap::new();
    for (i, id) in doc_ids.iter().enumerate() {
        vectors.insert(id.clone(), build_tfidf_vector(&doc_tfs[i], &idf));
    }

    // Find similar
    let target = match vectors.get(note_path) {
        Some(v) => v,
        None => return Ok(Vec::new()),
    };

    let mut results: Vec<(String, f64)> = Vec::new();
    for (id, vector) in &vectors {
        if id == note_path {
            continue;
        }
        let score = cosine_similarity(target, vector);
        if score >= min_score {
            results.push((id.clone(), score));
        }
    }

    results.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
    results.truncate(limit);

    let connections = results
        .into_iter()
        .filter_map(|(path, score)| {
            let note = all_notes.iter().find(|n| n.path == path)?;
            let content = contents.get(&path).cloned().unwrap_or_default();
            let snippet = extract_snippet(&content);
            Some(SmartConnection {
                path,
                title: note.title.clone(),
                score: (score * 100.0).round() / 100.0,
                snippet,
            })
        })
        .collect();

    Ok(connections)
}

pub fn find_similar_to_text(
    state: &AppState,
    query: &str,
    limit: usize,
    min_score: f64,
) -> AppResult<Vec<SmartConnection>> {
    let root = state.vault_root()?;
    let all_notes = vault_service::scan_vault(state)?;

    let mut doc_ids: Vec<String> = Vec::new();
    let mut doc_tfs: Vec<HashMap<String, f64>> = Vec::new();
    let mut contents: HashMap<String, String> = HashMap::new();

    for note in &all_notes {
        let full_path = root.join(&note.path);
        if let Ok(content) = fs::read_to_string(&full_path) {
            let tokens = tokenize(&content);
            let tf = compute_tf(&tokens);
            doc_ids.push(note.path.clone());
            doc_tfs.push(tf);
            contents.insert(note.path.clone(), content);
        }
    }

    let idf = compute_idf(&doc_tfs);

    let mut vectors: HashMap<String, TfIdfVector> = HashMap::new();
    for (i, id) in doc_ids.iter().enumerate() {
        vectors.insert(id.clone(), build_tfidf_vector(&doc_tfs[i], &idf));
    }

    // Build query vector
    let query_tokens = tokenize(query);
    let query_tf = compute_tf(&query_tokens);
    let query_vec = build_tfidf_vector(&query_tf, &idf);

    let mut results: Vec<(String, f64)> = Vec::new();
    for (id, vector) in &vectors {
        let score = cosine_similarity(&query_vec, vector);
        if score >= min_score {
            results.push((id.clone(), score));
        }
    }

    results.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
    results.truncate(limit);

    let connections = results
        .into_iter()
        .filter_map(|(path, score)| {
            let note = all_notes.iter().find(|n| n.path == path)?;
            let content = contents.get(&path).cloned().unwrap_or_default();
            let snippet = extract_snippet(&content);
            Some(SmartConnection {
                path,
                title: note.title.clone(),
                score: (score * 100.0).round() / 100.0,
                snippet,
            })
        })
        .collect();

    Ok(connections)
}

fn extract_snippet(content: &str) -> String {
    use regex::Regex;
    use std::sync::OnceLock;

    static FM_RE: OnceLock<Regex> = OnceLock::new();
    static HD_RE: OnceLock<Regex> = OnceLock::new();

    let fm = FM_RE.get_or_init(|| Regex::new(r"(?s)^---\s*\n.*?\n---\n?").unwrap());
    let hd = HD_RE.get_or_init(|| Regex::new(r"(?m)^#+\s+.+$").unwrap());

    let stripped = fm.replace_all(content, "");
    let stripped = hd.replace(&stripped, "");
    let trimmed = stripped.trim();

    if trimmed.len() <= 120 {
        trimmed.to_string()
    } else {
        let end = trimmed.floor_char_boundary(120);
        format!("{}…", trimmed[..end].trim_end())
    }
}

// ── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tokenize_basic() {
        let tokens = tokenize("Hello world, this is a test!");
        assert!(tokens.contains(&"hello".to_string()));
        assert!(tokens.contains(&"world".to_string()));
        assert!(tokens.contains(&"test".to_string()));
        // stop words should be filtered
        assert!(!tokens.contains(&"this".to_string()));
        assert!(!tokens.contains(&"is".to_string()));
    }

    #[test]
    fn tokenize_strips_frontmatter() {
        let tokens = tokenize("---\ntitle: test\n---\nhello world");
        assert!(!tokens.contains(&"title".to_string()));
        assert!(tokens.contains(&"hello".to_string()));
    }

    #[test]
    fn tokenize_strips_urls() {
        let tokens = tokenize("see https://example.com for details");
        assert!(!tokens.iter().any(|t| t.contains("http")));
    }

    #[test]
    fn compute_tf_basic() {
        let tokens = vec!["a".into(), "b".into(), "a".into()];
        let tf = compute_tf(&tokens);
        assert!((tf["a"] - 2.0 / 3.0).abs() < 1e-6);
        assert!((tf["b"] - 1.0 / 3.0).abs() < 1e-6);
    }

    #[test]
    fn cosine_similarity_identical() {
        let mut terms = HashMap::new();
        terms.insert("test".to_string(), 1.0);
        let v = TfIdfVector { terms: terms.clone(), magnitude: 1.0 };
        let v2 = TfIdfVector { terms, magnitude: 1.0 };
        let sim = cosine_similarity(&v, &v2);
        assert!((sim - 1.0).abs() < 1e-6);
    }

    #[test]
    fn cosine_similarity_orthogonal() {
        let mut t1 = HashMap::new();
        t1.insert("foo".to_string(), 1.0);
        let mut t2 = HashMap::new();
        t2.insert("bar".to_string(), 1.0);
        let v1 = TfIdfVector { terms: t1, magnitude: 1.0 };
        let v2 = TfIdfVector { terms: t2, magnitude: 1.0 };
        assert_eq!(cosine_similarity(&v1, &v2), 0.0);
    }

    #[test]
    fn extract_snippet_short() {
        let s = extract_snippet("---\ntitle: x\n---\nHello world.");
        assert_eq!(s, "Hello world.");
    }

    #[test]
    fn extract_snippet_truncates() {
        let long = "a ".repeat(200);
        let s = extract_snippet(&long);
        assert!(s.ends_with('…'));
        assert!(s.len() <= 124); // 120 + "…"
    }

    #[test]
    fn extract_snippet_multibyte_boundary() {
        // Place an em-dash (3-byte char) right at the 120-byte boundary
        let mut content = "x".repeat(119);
        content.push('—'); // bytes 119..122
        content.push_str("more text after");
        let s = extract_snippet(&content);
        assert!(s.ends_with('…'));
        // Must not panic on multi-byte char boundary
    }
}
