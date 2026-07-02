//! Tests for the Barnes-Hut force-directed layout engine.

use super::*;

#[test]
fn test_empty_layout() {
    let settings = LayoutSettings::default();
    let result = run_layout(&[], &[], &settings);
    assert!(result.is_empty());
}

#[test]
fn test_single_node_stays_centered() {
    let settings = LayoutSettings::default();
    let ids = vec!["note-1".to_string()];
    let result = run_layout(&ids, &[], &settings);
    assert_eq!(result.len(), 1);
    // Should stay near center
    assert!((result[0].x - 400.0).abs() < 50.0);
    assert!((result[0].y - 300.0).abs() < 50.0);
}

#[test]
fn test_linked_nodes_attract() {
    let settings = LayoutSettings {
        iterations: 50,
        ..Default::default()
    };
    let ids = vec!["a".to_string(), "b".to_string()];
    let edges = vec![(0, 1)];
    let result = run_layout(&ids, &edges, &settings);
    let dist = ((result[0].x - result[1].x).powi(2)
        + (result[0].y - result[1].y).powi(2))
    .sqrt();
    // Should be near link_distance
    assert!(dist < settings.link_distance * 2.0);
}

#[test]
fn test_disconnected_nodes_repel() {
    let settings = LayoutSettings {
        iterations: 50,
        ..Default::default()
    };
    let ids = vec!["a".to_string(), "b".to_string()];
    let result = run_layout(&ids, &[], &settings);
    let dist = ((result[0].x - result[1].x).powi(2)
        + (result[0].y - result[1].y).powi(2))
    .sqrt();
    // Should be repelled apart
    assert!(dist > 30.0);
}

#[test]
fn test_large_graph_completes() {
    let settings = LayoutSettings {
        iterations: 30,
        width: 1000.0,
        height: 1000.0,
        ..Default::default()
    };
    // 1000 nodes with chain edges
    let ids: Vec<String> = (0..1000).map(|i| format!("node-{}", i)).collect();
    let edges: Vec<(usize, usize)> = (0..999).map(|i| (i, i + 1)).collect();
    let result = run_layout(&ids, &edges, &settings);
    assert_eq!(result.len(), 1000);
    // All positions should be finite
    assert!(result.iter().all(|p| p.x.is_finite() && p.y.is_finite()));
}
