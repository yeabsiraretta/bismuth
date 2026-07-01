//! Force-directed graph layout computation (performance-critical).
//!
//! Implements a Barnes-Hut optimized force simulation in Rust for O(n log n)
//! repulsion, compared to the O(n²) JavaScript fallback. Targets <3s for 10k nodes.

use serde::{Deserialize, Serialize};
use tauri::State;

use super::graph::GraphState;
use super::layout_algorithms::{build_quadtree, SimNode};

/// Position output for a single node after layout computation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodePosition {
    pub id: String,
    pub x: f64,
    pub y: f64,
}

/// Layout parameters matching the frontend GraphSettings.
#[derive(Debug, Clone, Deserialize)]
pub struct LayoutSettings {
    pub center_force: f64,
    pub repel_force: f64,
    pub link_force: f64,
    pub link_distance: f64,
    pub width: f64,
    pub height: f64,
    pub iterations: u32,
}

impl Default for LayoutSettings {
    fn default() -> Self {
        Self {
            center_force: 0.1,
            repel_force: 300.0,
            link_force: 0.3,
            link_distance: 120.0,
            width: 800.0,
            height: 600.0,
            iterations: 100,
        }
    }
}


// ─── Force Layout Engine ─────────────────────────────────────────────────────

pub(crate) fn run_layout(
    node_ids: &[String],
    edges: &[(usize, usize)],
    settings: &LayoutSettings,
) -> Vec<NodePosition> {
    let n = node_ids.len();
    if n == 0 {
        return Vec::new();
    }

    // Initialize with jittered circle positions to break symmetry.
    // A perfect circle creates balanced repulsion that never collapses
    // into a natural web — random perturbation fixes this.
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut nodes: Vec<SimNode> = node_ids
        .iter()
        .enumerate()
        .map(|(i, id)| {
            let angle = 2.0 * std::f64::consts::PI * (i as f64) / (n as f64);
            let radius = (n as f64).sqrt() * 20.0;
            // Deterministic jitter derived from node id for reproducibility
            let mut hasher = DefaultHasher::new();
            id.hash(&mut hasher);
            let h = hasher.finish();
            let jx = ((h & 0xFFFF) as f64 / 65535.0 - 0.5) * radius * 0.6;
            let jy = (((h >> 16) & 0xFFFF) as f64 / 65535.0 - 0.5) * radius * 0.6;
            SimNode {
                id: id.clone(),
                x: settings.width / 2.0 + angle.cos() * radius + jx,
                y: settings.height / 2.0 + angle.sin() * radius + jy,
                vx: 0.0,
                vy: 0.0,
            }
        })
        .collect();

    let cx = settings.width / 2.0;
    let cy = settings.height / 2.0;
    let iters = settings.iterations.min(300);

    for tick in 0..iters {
        // Adaptive damping: high energy early to escape local minima,
        // lower damping later to settle into stable positions
        let progress = tick as f64 / iters as f64;
        let damping = 0.95 - progress * 0.25; // 0.95 → 0.70

        // Adaptive alpha (cooling schedule) — strong forces early, weak late
        let alpha = 1.0 - progress;

        // Barnes-Hut repulsion — O(n log n)
        let tree = build_quadtree(&nodes);
        for i in 0..n {
            let (fx, fy) = tree.calc_force(nodes[i].x, nodes[i].y, 0.8);
            nodes[i].vx += fx * settings.repel_force * alpha;
            nodes[i].vy += fy * settings.repel_force * alpha;
        }

        // Center force — gentle pull, keeps graph in view without bunching
        let center_strength = settings.center_force * 0.01;
        for node in nodes.iter_mut() {
            node.vx += (cx - node.x) * center_strength;
            node.vy += (cy - node.y) * center_strength;
        }

        // Link force (10× stronger than before so edges actually pull nodes together)
        for &(src, tgt) in edges {
            let dx = nodes[tgt].x - nodes[src].x;
            let dy = nodes[tgt].y - nodes[src].y;
            let dist = (dx * dx + dy * dy).sqrt().max(1.0);
            let f = (dist - settings.link_distance) * settings.link_force * 0.1;
            let fx = (dx / dist) * f;
            let fy = (dy / dist) * f;
            nodes[src].vx += fx;
            nodes[src].vy += fy;
            nodes[tgt].vx -= fx;
            nodes[tgt].vy -= fy;
        }

        // Integrate + damping
        for node in nodes.iter_mut() {
            node.x += node.vx;
            node.y += node.vy;
            node.vx *= damping;
            node.vy *= damping;
        }
    }

    nodes
        .into_iter()
        .map(|n| NodePosition {
            id: n.id,
            x: n.x,
            y: n.y,
        })
        .collect()
}

/// Computes force-directed layout positions for all graph nodes.
///
/// Uses Barnes-Hut tree for O(n log n) repulsion instead of O(n²).
/// Performance target: <3s for 10k nodes.
#[tauri::command]
pub async fn compute_graph_layout(
    state: State<'_, GraphState>,
    settings: LayoutSettings,
) -> Result<Vec<NodePosition>, String> {
    let db = &state.db;

    let notes = db
        .get_all_notes()
        .map_err(|e| format!("Failed to get notes: {}", e))?;

    let links = db
        .get_all_links()
        .map_err(|e| format!("Failed to get links: {}", e))?;

    let node_ids: Vec<String> = notes
        .iter()
        .map(|n| n.path.to_string_lossy().to_string())
        .collect();

    // Build index for O(1) edge lookups
    let id_map: std::collections::HashMap<&str, usize> = node_ids
        .iter()
        .enumerate()
        .map(|(i, id)| (id.as_str(), i))
        .collect();

    let edges: Vec<(usize, usize)> = links
        .iter()
        .filter_map(|link| {
            let src = id_map.get(link.source_path.to_string_lossy().as_ref())?;
            let tgt_path = link.target_path.as_ref()?;
            let tgt = id_map.get(tgt_path.to_string_lossy().as_ref())?;
            Some((*src, *tgt))
        })
        .collect();

    Ok(run_layout(&node_ids, &edges, &settings))
}

#[cfg(test)]
#[path = "graph_layout_tests.rs"]
mod tests;
