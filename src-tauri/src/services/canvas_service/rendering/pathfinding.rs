//! Edge routing algorithms for canvas edges.
//!
//! Supports orthogonal, bezier, and floating edge routing.
//! Performance target: 100 edges < 50ms.

use serde::{Deserialize, Serialize};

/// A 2D point.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

/// A rectangle (node bounds).
#[derive(Debug, Clone, Copy)]
pub struct Rect {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

impl Rect {
    pub fn center(&self) -> Point {
        Point { x: self.x + self.width / 2.0, y: self.y + self.height / 2.0 }
    }

    pub fn side_midpoint(&self, side: &str) -> Point {
        match side {
            "top" => Point { x: self.x + self.width / 2.0, y: self.y },
            "bottom" => Point { x: self.x + self.width / 2.0, y: self.y + self.height },
            "left" => Point { x: self.x, y: self.y + self.height / 2.0 },
            "right" => Point { x: self.x + self.width, y: self.y + self.height / 2.0 },
            _ => self.center(),
        }
    }
}

/// Edge routing style.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EdgeRouting {
    Straight,
    Orthogonal,
    Bezier,
}

/// A routed edge path as a series of points.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutedEdge {
    pub edge_id: String,
    pub points: Vec<Point>,
    pub routing: EdgeRouting,
}

/// Compute a straight-line route between two node sides.
pub fn route_straight(
    edge_id: &str,
    from: &Rect,
    from_side: &str,
    to: &Rect,
    to_side: &str,
) -> RoutedEdge {
    let start = from.side_midpoint(from_side);
    let end = to.side_midpoint(to_side);
    RoutedEdge {
        edge_id: edge_id.to_string(),
        points: vec![start, end],
        routing: EdgeRouting::Straight,
    }
}

/// Compute an orthogonal (right-angle) route between two nodes.
pub fn route_orthogonal(
    edge_id: &str,
    from: &Rect,
    from_side: &str,
    to: &Rect,
    to_side: &str,
) -> RoutedEdge {
    let start = from.side_midpoint(from_side);
    let end = to.side_midpoint(to_side);

    // Simple L-shaped routing: go horizontal then vertical
    let mid = Point { x: end.x, y: start.y };
    RoutedEdge {
        edge_id: edge_id.to_string(),
        points: vec![start, mid, end],
        routing: EdgeRouting::Orthogonal,
    }
}

/// Compute bezier control points for smooth curved edges.
pub fn route_bezier(
    edge_id: &str,
    from: &Rect,
    from_side: &str,
    to: &Rect,
    to_side: &str,
) -> RoutedEdge {
    let start = from.side_midpoint(from_side);
    let end = to.side_midpoint(to_side);

    // Control points offset from start/end by 1/3 of distance
    let dx = (end.x - start.x) / 3.0;
    let _dy = (end.y - start.y) / 3.0;
    let cp1 = Point { x: start.x + dx, y: start.y };
    let cp2 = Point { x: end.x - dx, y: end.y };

    RoutedEdge {
        edge_id: edge_id.to_string(),
        points: vec![start, cp1, cp2, end],
        routing: EdgeRouting::Bezier,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_straight_route() {
        let from = Rect { x: 0.0, y: 0.0, width: 100.0, height: 50.0 };
        let to = Rect { x: 200.0, y: 0.0, width: 100.0, height: 50.0 };
        let route = route_straight("e1", &from, "right", &to, "left");
        assert_eq!(route.points.len(), 2);
        assert_eq!(route.points[0].x, 100.0); // right side of from
        assert_eq!(route.points[1].x, 200.0); // left side of to
    }

    #[test]
    fn test_orthogonal_route() {
        let from = Rect { x: 0.0, y: 0.0, width: 100.0, height: 50.0 };
        let to = Rect { x: 200.0, y: 100.0, width: 100.0, height: 50.0 };
        let route = route_orthogonal("e1", &from, "right", &to, "left");
        assert_eq!(route.points.len(), 3); // start, mid, end
    }

    #[test]
    fn test_bezier_route() {
        let from = Rect { x: 0.0, y: 0.0, width: 100.0, height: 50.0 };
        let to = Rect { x: 300.0, y: 0.0, width: 100.0, height: 50.0 };
        let route = route_bezier("e1", &from, "right", &to, "left");
        assert_eq!(route.points.len(), 4); // start, cp1, cp2, end
    }
}
