//! Barnes-Hut quadtree and force simulation primitives for graph layout.
//!
//! Implements the O(n log n) repulsion computation used by [`super::run_layout`].

/// Internal simulation node with velocity.
pub(super) struct SimNode {
    pub(super) id: String,
    pub(super) x: f64,
    pub(super) y: f64,
    pub(super) vx: f64,
    pub(super) vy: f64,
}

// ─── Barnes-Hut Quadtree ─────────────────────────────────────────────────────

pub(super) struct QuadNode {
    pub(super) cx: f64,
    pub(super) cy: f64,
    pub(super) mass: f64,
    pub(super) children: [Option<Box<QuadNode>>; 4],
    // Bounds
    pub(super) min_x: f64,
    pub(super) min_y: f64,
    pub(super) max_x: f64,
    pub(super) max_y: f64,
    pub(super) is_leaf: bool,
    pub(super) body_idx: Option<usize>,
}

impl QuadNode {
    pub(super) fn new(min_x: f64, min_y: f64, max_x: f64, max_y: f64) -> Self {
        Self {
            cx: 0.0,
            cy: 0.0,
            mass: 0.0,
            children: [None, None, None, None],
            min_x,
            min_y,
            max_x,
            max_y,
            is_leaf: true,
            body_idx: None,
        }
    }

    pub(super) fn quadrant(&self, x: f64, y: f64) -> usize {
        let mid_x = (self.min_x + self.max_x) / 2.0;
        let mid_y = (self.min_y + self.max_y) / 2.0;
        match (x >= mid_x, y >= mid_y) {
            (false, false) => 0,
            (true, false) => 1,
            (false, true) => 2,
            (true, true) => 3,
        }
    }

    pub(super) fn child_bounds(&self, quad: usize) -> (f64, f64, f64, f64) {
        let mid_x = (self.min_x + self.max_x) / 2.0;
        let mid_y = (self.min_y + self.max_y) / 2.0;
        match quad {
            0 => (self.min_x, self.min_y, mid_x, mid_y),
            1 => (mid_x, self.min_y, self.max_x, mid_y),
            2 => (self.min_x, mid_y, mid_x, self.max_y),
            3 => (mid_x, mid_y, self.max_x, self.max_y),
            _ => unreachable!(),
        }
    }

    pub(super) fn insert(&mut self, idx: usize, x: f64, y: f64) {
        if self.mass == 0.0 && self.is_leaf {
            // Empty leaf — place body here
            self.cx = x;
            self.cy = y;
            self.mass = 1.0;
            self.body_idx = Some(idx);
            return;
        }

        if self.is_leaf {
            // Subdivide: move existing body to a child
            self.is_leaf = false;
            if let Some(old_idx) = self.body_idx.take() {
                let old_x = self.cx;
                let old_y = self.cy;
                let q = self.quadrant(old_x, old_y);
                let (bx0, by0, bx1, by1) = self.child_bounds(q);
                let child = self.children[q].get_or_insert_with(|| Box::new(QuadNode::new(bx0, by0, bx1, by1)));
                child.insert(old_idx, old_x, old_y);
            }
        }

        // Insert new body into appropriate child
        let q = self.quadrant(x, y);
        let (bx0, by0, bx1, by1) = self.child_bounds(q);
        let child = self.children[q].get_or_insert_with(|| Box::new(QuadNode::new(bx0, by0, bx1, by1)));
        child.insert(idx, x, y);

        // Update center of mass
        let total = self.mass + 1.0;
        self.cx = (self.cx * self.mass + x) / total;
        self.cy = (self.cy * self.mass + y) / total;
        self.mass = total;
    }

    /// Calculate repulsive force on node at (px, py) using Barnes-Hut (theta=0.8)
    pub(super) fn calc_force(&self, px: f64, py: f64, theta: f64) -> (f64, f64) {
        if self.mass == 0.0 {
            return (0.0, 0.0);
        }

        let dx = self.cx - px;
        let dy = self.cy - py;
        let dist_sq = dx * dx + dy * dy;

        if dist_sq < 1.0 {
            return (0.0, 0.0);
        }

        let size = self.max_x - self.min_x;

        // If sufficiently far or is a leaf, treat as single body
        if self.is_leaf || (size * size / dist_sq) < (theta * theta) {
            let dist = dist_sq.sqrt();
            let f = self.mass / dist_sq;
            return (-dx / dist * f, -dy / dist * f);
        }

        // Otherwise recurse into children
        let mut fx = 0.0;
        let mut fy = 0.0;
        for child in &self.children {
            if let Some(c) = child {
                let (cfx, cfy) = c.calc_force(px, py, theta);
                fx += cfx;
                fy += cfy;
            }
        }
        (fx, fy)
    }
}

/// Builds a Barnes-Hut quadtree over the given simulation nodes.
pub(super) fn build_quadtree(nodes: &[SimNode]) -> QuadNode {
    let mut min_x = f64::MAX;
    let mut min_y = f64::MAX;
    let mut max_x = f64::MIN;
    let mut max_y = f64::MIN;
    for n in nodes {
        min_x = min_x.min(n.x);
        min_y = min_y.min(n.y);
        max_x = max_x.max(n.x);
        max_y = max_y.max(n.y);
    }
    // Add padding to avoid zero-size bounds
    let pad = 10.0;
    let mut root = QuadNode::new(min_x - pad, min_y - pad, max_x + pad, max_y + pad);
    for (i, n) in nodes.iter().enumerate() {
        root.insert(i, n.x, n.y);
    }
    root
}
