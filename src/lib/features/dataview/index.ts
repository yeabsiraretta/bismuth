/**
 * Dataview feature module — query your vault as a database.
 *
 * Provides a DQL (Dataview Query Language) engine for filtering, sorting,
 * and extracting structured data from markdown frontmatter and inline fields.
 *
 * Entry points:
 *   - dataviewExtension()     — CodeMirror extension for ```dataview blocks
 *   - inlineFieldExtension()  — CodeMirror extension for Key:: Value decoration
 *   - initDataviewIndex()     — Start vault-wide indexing
 *   - runDataviewQuery()      — Execute a DQL query string
 */

export { dataviewExtension } from './extensions/dataviewExtension';
export { inlineFieldExtension } from './extensions/inlineFieldExtension';
export {
  initDataviewIndex,
  runDataviewQuery,
  dataviewPages,
  dataviewPageCount,
  dataviewIndexing,
  rebuildIndex,
} from './stores/dataviewStore';
export { parseQuery, parseExpr } from './services/queryParser';
export { executeQuery, evaluateExpr } from './services/queryEngine';
export { isTruthy, toNumber, compareValues, exprToString } from './services/exprEvaluator';
export {
  parseDocumentInlineFields,
  parseDocumentTasks,
  parseLineInlineFields,
  coerceValue,
} from './services/inlineFieldParser';
export { QueryCache, queryCache } from './services/queryCache';
export type {
  DvQuery,
  DvResult,
  DvPage,
  DvValue,
  DvLink,
  DvTask,
  DvSection,
  DvTableResult,
  DvListResult,
  DvTaskResult,
  DvCalendarResult,
  DvGroupedResult,
  DvQueryTiming,
  DvBinaryOp,
  InlineField,
} from './types/dataview';
export { DV_AUTO_LIMIT } from './types/dataview';
