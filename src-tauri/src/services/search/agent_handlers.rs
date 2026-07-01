//! Agent REST endpoint handlers for the Bismuth local search server.
//!
//! All routes require `Authorization: Bearer {token}`.
//!
//! Read routes (GET):
//! - `/notes/search?q=<query>&limit=<N>` — full-text search via Tantivy
//! - `/notes/<path>` — read note content + frontmatter
//! - `/vault/list` — list all note paths
//!
//! Write routes (staged — no vault modification):
//! - `PUT /notes/<path>` — propose update
//! - `POST /notes/<path>` — propose create
//! - `DELETE /notes/<path>` — propose deletion

pub(crate) use super::agent_read_handlers::{handle_agent_search, handle_read_note, handle_vault_list};
pub(crate) use super::agent_utils::check_bearer;
pub(crate) use super::agent_write_handlers::{handle_delete_note, handle_write_note};
