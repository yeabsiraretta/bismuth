//! Knowledge graph services
//!
//! Groups services related to entities, wikilinks, and concept linking.

pub mod concept_service;
pub mod entity_relationships;
pub mod entity_service;
pub mod entity_types;
pub mod wikilink_service;
pub(crate) mod wikilink_parser;

pub use entity_service::EntityService;
pub use wikilink_service::WikilinkService;
