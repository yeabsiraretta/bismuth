//! Domain facade modules
//!
//! Thin re-export layer that documents domain boundaries and provides
//! a single import path per domain. No business logic lives here.
//!
//! Each sub-module groups the public API from commands, services, and models
//! that belong to one domain.

pub mod canvas;
pub mod content;
pub mod knowledge;
pub mod search;
pub mod system;
pub mod vault;
