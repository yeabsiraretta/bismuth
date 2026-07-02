//! Knowledge domain — entities, wikilinks, backlinks, graph
//!
//! **Commands**: `commands/knowledge/` (backlinks, entity, graph, tag, wikilink)
//! **Services**: `services/knowledge/` (entity_service, wikilink_service, concept_service)
//! **Models**: `models/link.rs`

pub use crate::models::Link;
pub use crate::services::knowledge::{EntityService, WikilinkService};
