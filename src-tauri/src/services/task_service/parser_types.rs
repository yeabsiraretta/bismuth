//! Task types and compiled regex patterns for the markdown task parser.
//!
//! The emoji characters in the regex patterns below are Obsidian Tasks-compatible
//! syntax markers that users write in their vault notes (e.g. `📅 2024-12-31`).
//! This parser reads them from user content — it never generates or displays emoji.
//! These patterns must remain emoji-based to maintain format compatibility.

use regex::Regex;
use std::sync::LazyLock;

#[derive(
    Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, serde::Serialize, serde::Deserialize,
)]
#[serde(rename_all = "lowercase")]
pub enum TaskPriority {
    Lowest,
    Low,
    None,
    Medium,
    High,
    Highest,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum StatusType {
    Todo,
    Done,
    InProgress,
    OnHold,
    Cancelled,
    NonTask,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TaskStatus {
    Open,
    Done,
    InProgress,
    OnHold,
    Cancelled,
}

/// A single parsed task from a Markdown file.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ParsedTask {
    pub text: String,
    pub status: TaskStatus,
    pub status_symbol: char,
    pub status_type: StatusType,
    pub priority: TaskPriority,
    pub due_date: Option<String>,
    pub created_date: Option<String>,
    pub start_date: Option<String>,
    pub scheduled_date: Option<String>,
    pub done_date: Option<String>,
    pub cancelled_date: Option<String>,
    pub recurrence: Option<String>,
    pub id: Option<String>,
    pub depends_on: Vec<String>,
    pub tags: Vec<String>,
    pub line: usize,
    pub source_path: String,
    pub project: Option<String>,
    pub heading: Option<String>,
    pub on_completion: Option<String>,
}

// ─── Compiled static regexes ───────────────────────────────────────────────────

pub static TASK_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^(\s*)- \[(.)]\s*(.*)$").unwrap());

pub static DUE_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"📅\s*(\d{4}-\d{2}-\d{2})").unwrap());

pub static SCHEDULED_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"⏳\s*(\d{4}-\d{2}-\d{2})").unwrap());

pub static START_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"🛫\s*(\d{4}-\d{2}-\d{2})").unwrap());

pub static DONE_DATE_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"✅\s*(\d{4}-\d{2}-\d{2})").unwrap());

pub static CREATED_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"➕\s*(\d{4}-\d{2}-\d{2})").unwrap());

pub static CANCELLED_DATE_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"❌\s*(\d{4}-\d{2}-\d{2})").unwrap());

pub static RECURRENCE_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"🔁\s*([^📅⏳🛫✅➕❌🆔⛔#]+)").unwrap());

pub static ID_RE: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"🆔\s*(\S+)").unwrap());

pub static DEPENDS_RE: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"⛔\s*(\S+)").unwrap());

pub static TAG_RE: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"#([a-zA-Z0-9_/\-]+)").unwrap());

pub static PRIORITY_EMOJI_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"[⏫🔺🔼🔽⏬]").unwrap());

pub static ON_COMPLETION_RE: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"🏁\s*(\S+)").unwrap());
