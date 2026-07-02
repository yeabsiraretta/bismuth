// Side-effect: register all baseline schemas
import './schemas';

export { schemaRegistry } from './registry';
export {
  versionedRead,
  versionedWrite,
  auditCompatibility,
  getCompatSummary,
  getAppVersion,
  parseSemver,
  compareSemver,
} from './compat';
export type {
  VersionEnvelope,
  CompatCheckResult,
  SchemaDefinition,
  SchemaMigration,
} from './types';
