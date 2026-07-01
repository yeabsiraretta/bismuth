/**
 * Design Document schema validation — runtime type guards for each document type.
 */

import type { DesignDocument, DocumentType, DesignDocumentAny } from '@/types/design-documents';
import type { TokenPayload } from '@/types/design-documents/token';
import type { ComponentPayload } from '@/types/design-documents/component';
import type { LayoutPayload } from '@/types/design-documents/layout';
import type { FlowPayload } from '@/types/design-documents/flow';
import type { ThemePayload } from '@/types/design-documents/theme';
import type { PagePayload } from '@/types/design-documents/page';

const VALID_TYPES: DocumentType[] = ['token', 'component', 'layout', 'flow', 'theme', 'page'];

/** Validate the shared envelope fields. */
export function isValidEnvelope(doc: unknown): doc is DesignDocument<unknown> {
  if (!doc || typeof doc !== 'object') return false;
  const d = doc as Record<string, unknown>;
  return (
    typeof d['schema_version'] === 'string' &&
    VALID_TYPES.includes(d['document_type'] as DocumentType) &&
    typeof d['document_id'] === 'string' &&
    typeof d['name'] === 'string' &&
    typeof d['version'] === 'number' &&
    d['payload'] !== undefined &&
    d['canvas_source'] !== undefined
  );
}

/** Validate a TokenPayload. */
export function isValidTokenPayload(payload: unknown): payload is TokenPayload {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  return Array.isArray(p['collections']) && (p['collections'] as unknown[]).every((c: unknown) => {
    if (!c || typeof c !== 'object') return false;
    const col = c as Record<string, unknown>;
    return typeof col['name'] === 'string' && Array.isArray(col['tokens']);
  });
}

/** Validate a ComponentPayload. */
export function isValidComponentPayload(payload: unknown): payload is ComponentPayload {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  return (
    typeof p['component_name'] === 'string' &&
    typeof p['file_path'] === 'string' &&
    Array.isArray(p['props']) &&
    Array.isArray(p['slots']) &&
    Array.isArray(p['states'])
  );
}

/** Validate a LayoutPayload. */
export function isValidLayoutPayload(payload: unknown): payload is LayoutPayload {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  return (
    typeof p['layout_name'] === 'string' &&
    (p['type'] === 'grid' || p['type'] === 'flex') &&
    typeof p['breakpoints'] === 'object' &&
    Array.isArray(p['regions'])
  );
}

/** Validate a FlowPayload. */
export function isValidFlowPayload(payload: unknown): payload is FlowPayload {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  return (
    typeof p['flow_name'] === 'string' &&
    Array.isArray(p['steps']) &&
    Array.isArray(p['error_paths']) &&
    Array.isArray(p['components_used'])
  );
}

/** Validate a ThemePayload. */
export function isValidThemePayload(payload: unknown): payload is ThemePayload {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  return (
    typeof p['theme_name'] === 'string' &&
    typeof p['extends'] === 'string' &&
    typeof p['attribute'] === 'string' &&
    typeof p['overrides'] === 'object'
  );
}

/** Validate a PagePayload. */
export function isValidPagePayload(payload: unknown): payload is PagePayload {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  return (
    typeof p['page_name'] === 'string' &&
    typeof p['route'] === 'string' &&
    typeof p['layout'] === 'string' &&
    Array.isArray(p['components'])
  );
}

/** Validate a full design document (envelope + payload). */
export function validateDocument(doc: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!isValidEnvelope(doc)) {
    errors.push('Invalid document envelope (missing required fields)');
    return { valid: false, errors };
  }
  const d = doc as DesignDocumentAny;
  const validators: Record<DocumentType, (p: unknown) => boolean> = {
    token: isValidTokenPayload,
    component: isValidComponentPayload,
    layout: isValidLayoutPayload,
    flow: isValidFlowPayload,
    theme: isValidThemePayload,
    page: isValidPagePayload,
  };
  const validator = validators[d.document_type];
  if (!validator(d.payload)) {
    errors.push(`Invalid ${d.document_type} payload`);
  }
  return { valid: errors.length === 0, errors };
}
