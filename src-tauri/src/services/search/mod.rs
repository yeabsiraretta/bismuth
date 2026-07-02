//! Search and indexing services
//!
//! Groups the Tantivy index service, query builder, and HTTP search server.

pub mod index_service;
pub(crate) mod index_writer;
mod search_http;
mod search_routes;
pub(crate) mod search_handlers;
pub(crate) mod agent_utils;
pub(crate) mod agent_read_handlers;
pub(crate) mod agent_write_handlers;
pub(crate) mod agent_handlers;
pub mod search_query;
pub mod search_server;

pub use index_service::IndexService;
