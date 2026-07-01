//! Token type definitions and keyword list for the task query lexer.
//!
//! Extracted from `lexer.rs` to keep that file under the 300-line limit.

/// Token types produced by the lexer.
#[derive(Debug, Clone, PartialEq)]
pub enum Token {
    /// A keyword like `done`, `not`, `sort`, `by`, `group`, `hide`, `show`, `limit`
    Keyword(String),
    /// A string literal (unquoted value or quoted)
    StringLit(String),
    /// A regex literal `/pattern/flags`
    Regex { pattern: String, flags: String },
    /// A numeric literal
    Number(u32),
    /// An ISO date `YYYY-MM-DD`
    Date(String),
    /// Boolean combinator: AND, OR, NOT, XOR
    BoolOp(BoolOperator),
    /// Open parenthesis
    LParen,
    /// Close parenthesis
    RParen,
    /// A comment line (starts with #)
    Comment(String),
    /// Template variable `{{...}}`
    TemplateVar(String),
}

/// Boolean operators for combining filters.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BoolOperator {
    And,
    Or,
    Not,
    Xor,
    AndNot,
    OrNot,
}

/// A single tokenized line from the query.
#[derive(Debug, Clone, PartialEq)]
pub struct TokenLine {
    pub tokens: Vec<Token>,
    pub raw: String,
}

/// Reserved keywords recognized by the lexer.
pub(super) const KEYWORDS: &[&str] = &[
    "done",
    "not",
    "sort",
    "by",
    "group",
    "hide",
    "show",
    "limit",
    "short",
    "full",
    "mode",
    "explain",
    "exclude",
    "sub-items",
    "ignore",
    "global",
    "query",
    "to",
    "tasks",
    "groups",
    "reverse",
    "includes",
    "does",
    "include",
    "regex",
    "matches",
    "match",
    "is",
    "has",
    "no",
    "before",
    "after",
    "on",
    "or",
    "in",
    "above",
    "below",
    "status",
    "priority",
    "due",
    "done",
    "created",
    "start",
    "scheduled",
    "cancelled",
    "happens",
    "recurring",
    "recurrence",
    "path",
    "root",
    "folder",
    "filename",
    "heading",
    "description",
    "tag",
    "tags",
    "id",
    "depends",
    "blocked",
    "blocking",
    "type",
    "name",
    "date",
    "invalid",
    "filter",
    "function",
    "preset",
    "urgency",
    "random",
    "backlink",
];
