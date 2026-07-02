/**
 * @deprecated Import from '@/utils/compat' instead. This re-export exists
 * only for backward compatibility and will be removed in a future release.
 */
export {
  schemaRegistry,
  versionedRead,
  versionedWrite,
  auditCompatibility,
  getCompatSummary,
  getAppVersion,
  parseSemver,
  compareSemver,
} from '@/utils/compat';
export type {
  VersionEnvelope,
  CompatCheckResult,
  SchemaDefinition,
  SchemaMigration,
} from '@/utils/compat';
