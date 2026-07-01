//! Navigation generation for the published site.
//!
//! Builds filetree, backlinks, local graph, and breadcrumbs from published notes.

use super::PublishableNote;
use serde::Serialize;
use std::collections::HashMap;

/// Navigation data for the entire published site.
#[derive(Debug, Serialize)]
pub struct SiteNavigation {
    pub filetree: Vec<NavNode>,
    pub backlinks: HashMap<String, Vec<BacklinkEntry>>,
    pub graph: GraphData,
}

/// A node in the filetree navigation.
#[derive(Debug, Serialize)]
pub struct NavNode {
    pub title: String,
    pub slug: String,
    pub is_dir: bool,
    pub children: Vec<NavNode>,
    pub is_home: bool,
    pub pinned: bool,
}

/// A single backlink entry pointing to a note.
#[derive(Debug, Serialize)]
pub struct BacklinkEntry {
    pub title: String,
    pub slug: String,
    pub context: String,
}

/// Graph data for all published notes and their connections.
#[derive(Debug, Serialize)]
pub struct GraphData {
    pub nodes: Vec<GraphNode>,
    pub edges: Vec<GraphEdge>,
}

#[derive(Debug, Serialize)]
pub struct GraphNode {
    pub id: String,
    pub title: String,
    pub slug: String,
}

#[derive(Debug, Serialize)]
pub struct GraphEdge {
    pub source: String,
    pub target: String,
}

/// Builds all navigation data from the set of published notes.
pub fn build_navigation(notes: &[PublishableNote]) -> SiteNavigation {
    let filetree = build_filetree(notes);
    let backlinks = build_backlinks(notes);
    let graph = build_graph(notes);
    SiteNavigation { filetree, backlinks, graph }
}

/// Builds a filetree from note paths, grouping by directory.
fn build_filetree(notes: &[PublishableNote]) -> Vec<NavNode> {
    let mut root_nodes: Vec<NavNode> = Vec::new();

    // Sort notes: pinned first, then by order, then alphabetical
    let mut sorted: Vec<&PublishableNote> = notes.iter()
        .filter(|n| !n.hide_nav)
        .collect();
    sorted.sort_by(|a, b| {
        b.pinned.cmp(&a.pinned)
            .then(a.order.unwrap_or(999).cmp(&b.order.unwrap_or(999)))
            .then(a.title.cmp(&b.title))
    });

    for note in sorted {
        let parts: Vec<&str> = note.path.split('/').collect();
        if parts.len() == 1 {
            root_nodes.push(NavNode {
                title: note.title.clone(),
                slug: note.slug.clone(),
                is_dir: false,
                children: Vec::new(),
                is_home: note.is_home,
                pinned: note.pinned,
            });
        } else {
            insert_into_tree(&mut root_nodes, &parts, note);
        }
    }

    root_nodes
}

fn insert_into_tree(nodes: &mut Vec<NavNode>, parts: &[&str], note: &PublishableNote) {
    if parts.len() <= 1 {
        nodes.push(NavNode {
            title: note.title.clone(),
            slug: note.slug.clone(),
            is_dir: false,
            children: Vec::new(),
            is_home: note.is_home,
            pinned: note.pinned,
        });
        return;
    }

    let dir_name = parts[0];
    let existing = nodes.iter_mut().find(|n| n.is_dir && n.title == dir_name);

    if let Some(dir_node) = existing {
        insert_into_tree(&mut dir_node.children, &parts[1..], note);
    } else {
        let mut new_dir = NavNode {
            title: dir_name.to_string(),
            slug: String::new(),
            is_dir: true,
            children: Vec::new(),
            is_home: false,
            pinned: false,
        };
        insert_into_tree(&mut new_dir.children, &parts[1..], note);
        nodes.push(new_dir);
    }
}

/// Builds backlink index: for each note slug, list notes that link to it.
fn build_backlinks(notes: &[PublishableNote]) -> HashMap<String, Vec<BacklinkEntry>> {
    let mut backlinks: HashMap<String, Vec<BacklinkEntry>> = HashMap::new();
    let slugs: Vec<String> = notes.iter().map(|n| n.slug.clone()).collect();

    for note in notes {
        let links = extract_wikilink_targets(&note.content);
        for target in links {
            let target_slug = target.to_lowercase().replace(' ', "-");
            if slugs.contains(&target_slug) && target_slug != note.slug {
                let context = extract_link_context(&note.content, &target);
                backlinks.entry(target_slug).or_default().push(BacklinkEntry {
                    title: note.title.clone(),
                    slug: note.slug.clone(),
                    context,
                });
            }
        }
    }

    backlinks
}

/// Builds graph adjacency data for visualization.
fn build_graph(notes: &[PublishableNote]) -> GraphData {
    let slugs: Vec<String> = notes.iter().map(|n| n.slug.clone()).collect();
    let nodes: Vec<GraphNode> = notes.iter().map(|n| GraphNode {
        id: n.slug.clone(),
        title: n.title.clone(),
        slug: n.slug.clone(),
    }).collect();

    let mut edges: Vec<GraphEdge> = Vec::new();
    for note in notes {
        let links = extract_wikilink_targets(&note.content);
        for target in links {
            let target_slug = target.to_lowercase().replace(' ', "-");
            if slugs.contains(&target_slug) && target_slug != note.slug {
                edges.push(GraphEdge {
                    source: note.slug.clone(),
                    target: target_slug,
                });
            }
        }
    }

    GraphData { nodes, edges }
}

/// Extracts all [[wikilink]] targets from content.
fn extract_wikilink_targets(content: &str) -> Vec<String> {
    let mut targets = Vec::new();
    let mut remaining = content;
    while let Some(start) = remaining.find("[[") {
        if let Some(end) = remaining[start..].find("]]") {
            let link = &remaining[start + 2..start + end];
            // Handle [[Note#heading]] and [[Note|alias]] syntax
            let target = link.split('#').next().unwrap_or(link);
            let target = target.split('|').next().unwrap_or(target);
            targets.push(target.to_string());
            remaining = &remaining[start + end + 2..];
        } else {
            break;
        }
    }
    targets
}

/// Extracts surrounding context for a link mention.
fn extract_link_context(content: &str, target: &str) -> String {
    let search = format!("[[{}]]", target);
    if let Some(pos) = content.find(&search) {
        let start = pos.saturating_sub(40);
        let end = (pos + search.len() + 40).min(content.len());
        let snippet = &content[start..end];
        snippet.lines().next().unwrap_or("").trim().to_string()
    } else {
        String::new()
    }
}

/// Generates breadcrumb for a note path.
pub fn breadcrumb_for(note: &PublishableNote) -> Vec<(String, String)> {
    let parts: Vec<&str> = note.path.split('/').collect();
    let mut crumbs = Vec::new();
    for (i, part) in parts.iter().enumerate() {
        if i == parts.len() - 1 {
            crumbs.push((note.title.clone(), note.slug.clone()));
        } else {
            crumbs.push((part.to_string(), String::new()));
        }
    }
    crumbs
}
