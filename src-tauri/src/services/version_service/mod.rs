//! Version service — per-file semantic versioning for notes and canvas documents.
//!
//! Diffs are computed server-side via the `similar` crate. Complexity metrics drive
//! automatic semver bump classification (patch / minor / major). Version files are
//! stored in `.bismuth/versions/{file_id}/` under the vault root.

pub mod diff;
pub mod storage;
