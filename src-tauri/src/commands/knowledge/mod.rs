//! Knowledge graph IPC command handlers
//!
//! Groups commands related to the knowledge graph: backlinks, entities,
//! graph visualization, wikilinks, and tags.

pub mod backlinks;
pub(crate) mod backlink_indexer;
pub mod entity;
pub mod graph;
pub mod graph_layout;
pub(crate) mod layout_algorithms;
pub mod tag;
pub mod wikilink;

pub use backlinks::*;
pub use entity::*;
pub use graph::*;
pub use graph_layout::*;
pub use tag::*;
pub use wikilink::*;
