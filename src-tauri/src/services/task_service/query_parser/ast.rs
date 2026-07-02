//! Query AST node types.
//!
//! Defines the abstract syntax tree for the task query DSL.
//! Secondary instruction types (sort, group, display, limit) live in
//! [`ast_nodes`].

pub use super::ast_nodes::{
    DateCondition, DateField, DateFilter, DateUnit, DateValue, DependencyFilter,
    DisplayField, DisplayInstruction, GroupField, GroupInstruction, LimitInstruction,
    PathField, PathFilter, PriorityComparison, PriorityFilter, PriorityLevel,
    RecurrenceFilter, RelativeDate, SortField, SortInstruction,
    StatusFilter, StatusTypeMatch, StringFilter, StringMatcher, StringValue, TagFilter,
};

/// A complete parsed query — a sequence of instructions.
#[derive(Debug, Clone)]
pub struct Query {
    pub instructions: Vec<Instruction>,
}

/// A single instruction in the query.
#[derive(Debug, Clone)]
pub enum Instruction {
    Filter(FilterExpr),
    Sort(SortInstruction),
    Group(GroupInstruction),
    Display(DisplayInstruction),
    Limit(LimitInstruction),
    Comment(String),
    Explain,
    ExcludeSubItems,
    IgnoreGlobalQuery,
}

/// A filter expression — simple or boolean combination.
#[derive(Debug, Clone)]
pub enum FilterExpr {
    Simple(Filter),
    And(Box<FilterExpr>, Box<FilterExpr>),
    Or(Box<FilterExpr>, Box<FilterExpr>),
    Not(Box<FilterExpr>),
    Xor(Box<FilterExpr>, Box<FilterExpr>),
}

/// Individual filter types.
#[derive(Debug, Clone)]
pub enum Filter {
    Status(StatusFilter),
    Date(DateFilter),
    Priority(PriorityFilter),
    Path(PathFilter),
    Description(StringFilter),
    Tag(TagFilter),
    Recurrence(RecurrenceFilter),
    Dependency(DependencyFilter),
    /// Scripting stub — always returns informative error
    ScriptFilter(String),
}


