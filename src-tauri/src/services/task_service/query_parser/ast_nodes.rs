//! Secondary AST node types: filters, sort, group, display, and limit instructions.
//!
//! Consumed by [`super::ast`] and the parser.

// ─── Status Filters ──────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub enum StatusFilter {
    Done,
    NotDone,
    StatusName(StringMatcher),
    StatusType(StatusTypeMatch),
}

#[derive(Debug, Clone, PartialEq)]
pub enum StatusTypeMatch {
    Is(String),
    IsNot(String),
}

// ─── Date Filters ────────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub struct DateFilter {
    pub field: DateField,
    pub condition: DateCondition,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DateField {
    Due,
    Done,
    Created,
    Start,
    Scheduled,
    Cancelled,
    Happens,
}

#[derive(Debug, Clone)]
pub enum DateCondition {
    On(DateValue),
    Before(DateValue),
    After(DateValue),
    OnOrBefore(DateValue),
    OnOrAfter(DateValue),
    InRange(DateValue, DateValue),
    HasDate,
    NoDate,
    IsInvalid,
}

/// A date value — either absolute or relative.
#[derive(Debug, Clone)]
pub enum DateValue {
    Absolute(String),
    Relative(RelativeDate),
    TemplateVar(String),
}

#[derive(Debug, Clone)]
pub enum RelativeDate {
    Today,
    Yesterday,
    Tomorrow,
    Last(DateUnit),
    This(DateUnit),
    Next(DateUnit),
    /// ISO week notation e.g. `2024-W03`
    IsoWeek(String),
    /// ISO month e.g. `2024-03`
    IsoMonth(String),
    /// ISO quarter e.g. `2024-Q1`
    IsoQuarter(String),
    /// Year e.g. `2024`
    Year(u32),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DateUnit {
    Week,
    Month,
    Quarter,
    Year,
}

// ─── Priority Filters ────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub struct PriorityFilter {
    pub comparison: PriorityComparison,
    pub level: PriorityLevel,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PriorityComparison {
    Is,
    IsNot,
    Above,
    Below,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PriorityLevel {
    Lowest,
    Low,
    None,
    Medium,
    High,
    Highest,
}

// ─── Path/File Filters ───────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub struct PathFilter {
    pub field: PathField,
    pub matcher: StringMatcher,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PathField {
    Path,
    Root,
    Folder,
    Filename,
    Heading,
}

// ─── String Matching ─────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub enum StringMatcher {
    Includes(StringValue),
    DoesNotInclude(StringValue),
    RegexMatches(String, String),
    RegexDoesNotMatch(String, String),
}

/// A string value that may contain template variables.
#[derive(Debug, Clone)]
pub enum StringValue {
    Literal(String),
    TemplateVar(String),
}

// ─── String Filter (description) ─────────────────────────────────────────────

#[derive(Debug, Clone)]
pub struct StringFilter {
    pub matcher: StringMatcher,
}

// ─── Tag Filters ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub enum TagFilter {
    HasTags,
    NoTags,
    Includes(StringMatcher),
}

// ─── Recurrence Filters ──────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub enum RecurrenceFilter {
    IsRecurring,
    IsNotRecurring,
    Matches(StringMatcher),
}

// ─── Dependency Filters ──────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub enum DependencyFilter {
    HasId,
    NoId,
    IdMatches(StringMatcher),
    HasDependsOn,
    NoDependsOn,
    IsBlocked,
    IsNotBlocked,
    IsBlocking,
    IsNotBlocking,
}

// ─── Sort Instructions ───────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub struct SortInstruction {
    pub field: SortField,
    pub reverse: bool,
}

#[derive(Debug, Clone)]
pub enum SortField {
    Status,
    StatusName,
    StatusType,
    Id,
    Done,
    Created,
    Start,
    Scheduled,
    Due,
    Cancelled,
    Happens,
    Recurring,
    Priority,
    Urgency,
    Path,
    Filename,
    Heading,
    Description,
    Tag(Option<u32>),
    Random,
}

// ─── Group Instructions ──────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub struct GroupInstruction {
    pub field: GroupField,
}

#[derive(Debug, Clone)]
pub enum GroupField {
    Status,
    StatusName,
    StatusType,
    Id,
    Done,
    Created,
    Start,
    Scheduled,
    Due,
    Cancelled,
    Happens,
    Recurring,
    Recurrence,
    Priority,
    Urgency,
    Path,
    Root,
    Folder,
    Filename,
    Heading,
    Backlink,
    Tags,
}

// ─── Display Instructions ────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub enum DisplayInstruction {
    Hide(DisplayField),
    Show(DisplayField),
    ShortMode,
    FullMode,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DisplayField {
    Id,
    DependsOn,
    DoneDate,
    CreatedDate,
    StartDate,
    ScheduledDate,
    DueDate,
    CancelledDate,
    Priority,
    RecurrenceRule,
    Tags,
    Backlink,
    EditButton,
    PostponeButton,
    TaskCount,
    Urgency,
    Tree,
}

// ─── Limit Instructions ──────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub enum LimitInstruction {
    Tasks(u32),
    Groups(u32),
}
