//! Spreadsheet service layer (Spec 042)
//!
//! Provides CSV/TSV tokenisation and JSON-table normalisation utilities used
//! by the IPC command handlers. No database access; pure in-memory operations.

pub mod parser;
