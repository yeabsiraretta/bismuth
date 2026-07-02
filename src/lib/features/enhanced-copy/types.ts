/**
 * Enhanced Copy types — configuration for markdown-aware clipboard copying.
 */

/** How to handle markdown links when copying. */
export type LinkMode = 'keep' | 'remove-all' | 'remove-internal';

/** How to handle footnotes when copying. */
export type FootnoteMode = 'keep' | 'remove' | 'format';

/** How to handle callouts when copying. */
export type CalloutMode = 'keep' | 'type-to-strong' | 'blockquote';

/** Which view mode the enhanced copy applies to. */
export type CopyViewScope = 'reading' | 'editing' | 'all';

/** A user-defined regex replacement rule. */
export interface RegexRule {
  pattern: string;
  flags: string;
  replacement: string;
}

/** Configuration for the enhanced copy feature. */
export interface EnhancedCopyConfig {
  viewScope: CopyViewScope;
  overrideDefaultCopy: boolean;

  linkMode: LinkMode;
  footnoteMode: FootnoteMode;
  calloutMode: CalloutMode;
  removeHighlightMarks: boolean;
  strictLineBreaks: boolean;
  convertWikilinks: boolean;
  tabToSpaces: boolean;
  tabSize: number;
  regexRules: RegexRule[];

  copyAsHtml: boolean;
}

export const DEFAULT_ENHANCED_COPY_CONFIG: EnhancedCopyConfig = {
  viewScope: 'all',
  overrideDefaultCopy: false,

  linkMode: 'keep',
  footnoteMode: 'format',
  calloutMode: 'keep',
  removeHighlightMarks: false,
  strictLineBreaks: false,
  convertWikilinks: true,
  tabToSpaces: false,
  tabSize: 4,
  regexRules: [],

  copyAsHtml: false,
};
