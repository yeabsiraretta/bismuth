//! Benchmark: Tantivy search performance (T098)
//!
//! Validates NFR-002: <100ms query time on large index.
//! Run with: `cargo bench --bench search_bench`

use bismuth::models::note::Note;
use bismuth::services::index_service::{IndexService, SearchQuery};
use chrono::Utc;
use criterion::{black_box, criterion_group, criterion_main, Criterion};
use std::collections::HashMap;
use std::path::PathBuf;
use tempfile::TempDir;

/// Generate a synthetic note with realistic content
fn generate_note(id: usize) -> Note {
    let topics = [
        "rust programming",
        "knowledge management",
        "machine learning",
        "distributed systems",
        "functional programming",
        "web development",
        "database design",
        "operating systems",
        "compiler design",
        "network protocols",
    ];
    let topic = topics[id % topics.len()];
    let content = format!(
        "# Note {id}\n\n\
        This note discusses {topic} in detail. \
        It covers various aspects of the subject including \
        implementation details, best practices, and common patterns. \
        The key insight is that {topic} requires careful consideration \
        of trade-offs between performance and maintainability. \
        Related concepts include data structures, algorithms, \
        and system architecture. Note {id} connects to notes {} and {}.",
        (id + 1) % 1000,
        (id + 7) % 1000
    );

    Note {
        path: PathBuf::from(format!("/vault/notes/note-{id}.md")),
        title: format!("Note {id}: {topic}"),
        content,
        frontmatter: HashMap::new(),
        created_at: Utc::now(),
        modified_at: Utc::now(),
    }
}

fn bench_search_small_index(c: &mut Criterion) {
    let tmp = TempDir::new().unwrap();
    let service = IndexService::new(tmp.path()).unwrap();

    // Index 100 notes
    let notes: Vec<Note> = (0..100).map(generate_note).collect();
    service.index_all(notes).unwrap();

    c.bench_function("search_100_notes", |b| {
        b.iter(|| {
            let query = SearchQuery {
                query: black_box("programming patterns".to_string()),
                limit: 20,
            };
            service.search(query).unwrap();
        });
    });
}

fn bench_search_medium_index(c: &mut Criterion) {
    let tmp = TempDir::new().unwrap();
    let service = IndexService::new(tmp.path()).unwrap();

    // Index 1000 notes
    let notes: Vec<Note> = (0..1000).map(generate_note).collect();
    service.index_all(notes).unwrap();

    c.bench_function("search_1000_notes", |b| {
        b.iter(|| {
            let query = SearchQuery {
                query: black_box("knowledge management best practices".to_string()),
                limit: 20,
            };
            service.search(query).unwrap();
        });
    });
}

fn bench_advanced_search(c: &mut Criterion) {
    let tmp = TempDir::new().unwrap();
    let service = IndexService::new(tmp.path()).unwrap();

    // Index 1000 notes
    let notes: Vec<Note> = (0..1000).map(generate_note).collect();
    service.index_all(notes).unwrap();

    c.bench_function("advanced_search_1000_notes", |b| {
        b.iter(|| {
            service
                .advanced_search(black_box("\"best practices\" programming -draft"), 20)
                .unwrap();
        });
    });
}

fn bench_index_single_note(c: &mut Criterion) {
    let tmp = TempDir::new().unwrap();
    let service = IndexService::new(tmp.path()).unwrap();

    let note = generate_note(999);

    c.bench_function("index_single_note", |b| {
        b.iter(|| {
            service.index_note(black_box(&note)).unwrap();
        });
    });
}

criterion_group!(
    benches,
    bench_search_small_index,
    bench_search_medium_index,
    bench_advanced_search,
    bench_index_single_note
);
criterion_main!(benches);
