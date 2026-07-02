//! Task query DSL parser.
//!
//! Parses Obsidian Tasks-compatible query strings into an executable AST.
//! Pipeline: query text → lexer → tokens → parser → AST → evaluator.

pub mod ast;
pub(crate) mod ast_nodes;
pub mod date_parser;
pub mod lexer;
pub(crate) mod lexer_helpers;
pub(crate) mod lexer_tokens;
pub mod parser;
pub(crate) mod parser_fields;
pub(crate) mod parser_filters;
pub(crate) mod parser_filters_date;
pub(crate) mod parser_utils;
