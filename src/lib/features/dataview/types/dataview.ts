/**
 * Core types for the Dataview query engine.
 * Models the query AST, page metadata, inline fields, and query results.
 */

/** A single inline field parsed from markdown content. */
export interface InlineField {
  key: string;
  value: DvValue;
  /** Character offset of the full `Key:: Value` span. */
  from: number;
  to: number;
  /** 'frontmatter' | 'inline' | 'inline-bracket' | 'inline-paren' */
  source: 'frontmatter' | 'inline' | 'inline-bracket' | 'inline-paren';
}

/** Supported runtime value types for fields. */
export type DvValue = string | number | boolean | Date | null | DvLink | DvValue[];

/** An internal link reference. */
export interface DvLink {
  type: 'link';
  path: string;
  display?: string;
  subpath?: string;
}

/** Metadata page object — one per vault note. */
export interface DvPage {
  /** Relative path from vault root. */
  path: string;
  /** The note's `file` metadata namespace. */
  file: DvFileInfo;
  /** Merged frontmatter + inline fields. */
  fields: Record<string, DvValue>;
  /** Raw inline field entries. */
  inlineFields: InlineField[];
  /** Tags found in frontmatter and body. */
  tags: string[];
  /** Parsed sections. */
  sections: DvSection[];
}

/** Metadata about the file itself (mirrors Obsidian's `file.*` namespace). */
export interface DvFileInfo {
  name: string;
  path: string;
  folder: string;
  ext: string;
  link: DvLink;
  /** ISO date string. */
  ctime: string;
  /** ISO date string. */
  mtime: string;
  size: number;
  tags: string[];
  /** Outgoing wikilinks. */
  outlinks: DvLink[];
  /** Task items found in the note body. */
  tasks: DvTask[];
  /** Parsed date from file name (YYYY-MM-DD pattern), if any. */
  day: Date | null;
}

/** A section within a markdown page (h1–h6). */
export interface DvSection {
  /** Section heading text (empty for root section). */
  heading: string;
  /** Heading level (0 = root, 1 = h1, etc.). */
  level: number;
  /** Line number of the heading (1-based). */
  line: number;
  /** Section body content. */
  content: string;
  /** Fields found within this section. */
  fields: Record<string, DvValue>;
  /** Tasks found within this section. */
  tasks: DvTask[];
}

/** A task item extracted from a markdown checkbox. */
export interface DvTask {
  text: string;
  completed: boolean;
  line: number;
  path: string;
  tags: string[];
}

// ─── Query AST ───────────────────────────────────────────────────────────────

export type DvQueryType = 'table' | 'list' | 'task' | 'calendar';

/** Default auto-limit for queries without explicit LIMIT. */
export const DV_AUTO_LIMIT = 100;

export interface DvQuery {
  type: DvQueryType;
  /** Column expressions for TABLE queries. */
  fields: DvFieldExpr[];
  /** Source filter (folder paths, tags, links). */
  from: DvFromClause | null;
  /** WHERE predicate. */
  where: DvExpr | null;
  /** SORT clauses. */
  sort: DvSortClause[];
  /** GROUP BY expression. */
  groupBy: DvExpr | null;
  /** FLATTEN expression. */
  flatten: DvFieldExpr | null;
  /** LIMIT clause. */
  limit: number | null;
}

/** A field expression: `field-path AS "Display Name"` */
export interface DvFieldExpr {
  expr: DvExpr;
  alias?: string;
}

/** Source filter for FROM clause. */
export interface DvFromClause {
  type: 'folder' | 'tag' | 'link' | 'all';
  value: string;
  /** OR/AND combined sources. */
  combinator?: 'and' | 'or';
  right?: DvFromClause;
}

/** Sort direction. */
export interface DvSortClause {
  field: DvExpr;
  direction: 'asc' | 'desc';
}

// ─── Expressions ─────────────────────────────────────────────────────────────

export type DvExpr = DvFieldRef | DvLiteral | DvBinaryExpr | DvUnaryExpr | DvFunctionCall;

export interface DvFieldRef {
  type: 'field';
  /** Dot-separated path, e.g. 'file.name' or 'rating'. */
  path: string;
}

export interface DvLiteral {
  type: 'literal';
  value: DvValue;
}

export type DvBinaryOp =
  '=' | '!=' | '>' | '<' | '>=' | '<=' | 'and' | 'or' | 'contains' | '+' | '-' | '*' | '/' | '%';

export interface DvBinaryExpr {
  type: 'binary';
  op: DvBinaryOp;
  left: DvExpr;
  right: DvExpr;
}

export interface DvUnaryExpr {
  type: 'unary';
  op: 'not' | '-';
  operand: DvExpr;
}

export interface DvFunctionCall {
  type: 'function';
  name: string;
  args: DvExpr[];
}

// ─── Query Results ───────────────────────────────────────────────────────────

export interface DvTableResult {
  type: 'table';
  headers: string[];
  rows: DvValue[][];
  totalCount: number;
}

export interface DvListResult {
  type: 'list';
  items: Array<{ value: DvValue; page: DvLink }>;
  totalCount: number;
}

export interface DvTaskResult {
  type: 'task';
  tasks: DvTask[];
  totalCount: number;
}

export interface DvCalendarResult {
  type: 'calendar';
  items: Array<{ date: Date; value: DvValue; page: DvLink }>;
  totalCount: number;
}

export interface DvGroupedResult {
  type: 'grouped';
  groups: Array<{ key: DvValue; rows: DvValue[][] }>;
  headers: string[];
  totalCount: number;
}

/** Timing metadata attached to every query result. */
export interface DvQueryTiming {
  /** Total query time in milliseconds. */
  totalMs: number;
  /** Index lookup time in milliseconds. */
  filterMs: number;
  /** Sort + project time in milliseconds. */
  renderMs: number;
  /** Whether auto-limit was applied. */
  autoLimited: boolean;
  /** Original count before limit. */
  unfilteredCount: number;
}

export type DvResult =
  | (DvTableResult & { timing?: DvQueryTiming })
  | (DvListResult & { timing?: DvQueryTiming })
  | (DvTaskResult & { timing?: DvQueryTiming })
  | (DvCalendarResult & { timing?: DvQueryTiming })
  | (DvGroupedResult & { timing?: DvQueryTiming });
