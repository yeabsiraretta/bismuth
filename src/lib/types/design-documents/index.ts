/**
 * Design Documents type system — barrel exports.
 */

export type { DesignDocument, DocumentType, CanvasSource, DesignDocumentMeta } from './envelope';
export type { TokenPayload, TokenCollection, DesignToken } from './token';
export type {
  ComponentPayload,
  ComponentProp,
  ComponentSlot,
  ComponentVariant,
  CodeConnect,
} from './component';
export type { LayoutPayload, LayoutBreakpoint, LayoutRegion } from './layout';
export type { FlowPayload, FlowStep, FlowErrorPath } from './flow';
export type { ThemePayload } from './theme';
export type { PagePayload, PageComponentInstance, ResponsivePageVariant } from './page';

import type { DesignDocument } from './envelope';
import type { TokenPayload } from './token';
import type { ComponentPayload } from './component';
import type { LayoutPayload } from './layout';
import type { FlowPayload } from './flow';
import type { ThemePayload } from './theme';
import type { PagePayload } from './page';

/** Union of all design document types. */
export type DesignDocumentAny =
  | DesignDocument<TokenPayload>
  | DesignDocument<ComponentPayload>
  | DesignDocument<LayoutPayload>
  | DesignDocument<FlowPayload>
  | DesignDocument<ThemePayload>
  | DesignDocument<PagePayload>;
