/**
 * Enhanced Copy transform pipeline — processes markdown text through
 * a series of transformations before copying to clipboard.
 *
 * Transforms: links, footnotes, callouts, highlights, wikilinks,
 * tabs, strict line breaks, and user-defined regex rules.
 */

import type { EnhancedCopyConfig, RegexRule } from '../types';

/**
 * Transform markdown links based on the configured mode.
 * - keep: no change
 * - remove-all: [text](url) → text
 * - remove-internal: only remove links without http(s) prefix
 */
export function transformLinks(text: string, mode: EnhancedCopyConfig['linkMode']): string {
  if (mode === 'keep') return text;

  return text.replace(/\[([^\]]*)\]\(([^)]*)\)/g, (_match, linkText: string, url: string) => {
    if (mode === 'remove-all') return linkText;
    // remove-internal: keep external links, strip internal
    if (/^https?:\/\//i.test(url)) return _match;
    return linkText;
  });
}

/**
 * Transform footnote references and definitions.
 * - keep: no change
 * - remove: strip footnote markers entirely
 * - format: convert Obsidian turndown format to standard [^N]
 */
export function transformFootnotes(text: string, mode: EnhancedCopyConfig['footnoteMode']): string {
  if (mode === 'keep') return text;

  if (mode === 'remove') {
    // Remove inline footnote references like footnote[[1]](#fn-1-xxx)
    let result = text.replace(/\[\[\d+\]\]\(#fn-\d+-[a-zA-Z0-9]*\)/g, '');
    // Remove standard footnote refs [^1]
    result = result.replace(/\[\^\d+\]/g, '');
    // Remove footnote definition lines
    result = result.replace(/^\[\^\d+\]:.*$/gm, '');
    return result;
  }

  // format mode: convert to [^N] style
  let counter = 0;
  const footnoteMap = new Map<string, number>();

  let result = text.replace(
    /\[\[(\d+)\]\]\(#fn-(\d+)-[a-zA-Z0-9]*\)/g,
    (_match, _num: string, fnId: string) => {
      if (!footnoteMap.has(fnId)) {
        counter++;
        footnoteMap.set(fnId, counter);
      }
      return `[^${footnoteMap.get(fnId)}]`;
    }
  );

  // Also fix footnote definition lines at the end
  result = result.replace(
    /^(\d+)\.\s+\[\^?\]?\(#fnref-(\d+)-[a-zA-Z0-9]*\)\s*(.*)/gm,
    (_match, _num: string, fnId: string, content: string) => {
      const idx = footnoteMap.get(fnId) ?? parseInt(_num, 10);
      return `[^${idx}]: ${content.trim()}`;
    }
  );

  return result;
}

/**
 * Transform callout blocks.
 * - keep: no change
 * - type-to-strong: > [!type] Title → > **Type** Title
 * - blockquote: > [!type] Title → > Title (strip type)
 */
export function transformCallouts(text: string, mode: EnhancedCopyConfig['calloutMode']): string {
  if (mode === 'keep') return text;

  return text.replace(
    /^(>\s*)\[!(\w+)\]\s*(.*)/gm,
    (_match, prefix: string, type: string, title: string) => {
      if (mode === 'type-to-strong') {
        const capitalized = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
        return title ? `${prefix}**${capitalized}** ${title}` : `${prefix}**${capitalized}**`;
      }
      // blockquote: just keep the title as a blockquote
      return title ? `${prefix}${title}` : prefix.trimEnd();
    }
  );
}

/**
 * Remove highlight marks (==text==) → text.
 */
export function removeHighlights(text: string): string {
  return text.replace(/==(.*?)==/g, '$1');
}

/**
 * Convert wikilinks to markdown links: [[target|alias]] → [alias](target)
 * and [[target]] → [target](target).
 */
export function convertWikilinks(text: string): string {
  return text.replace(
    /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_match, target: string, alias?: string) => {
      const display = alias || target;
      return `[${display}](${target})`;
    }
  );
}

/**
 * Convert tabs to spaces.
 */
export function convertTabsToSpaces(text: string, tabSize: number): string {
  return text.replace(/\t/g, ' '.repeat(tabSize));
}

/**
 * Add strict line breaks (two trailing spaces before newlines).
 */
export function addStrictLineBreaks(text: string): string {
  return text.replace(/(?<! {2})\n/g, '  \n');
}

/**
 * Apply user-defined regex replacement rules.
 */
export function applyRegexRules(text: string, rules: RegexRule[]): string {
  let result = text;
  for (const rule of rules) {
    try {
      const re = new RegExp(rule.pattern, rule.flags);
      result = result.replace(re, rule.replacement);
    } catch {
      // Skip invalid regex rules silently
    }
  }
  return result;
}

/**
 * Run the full enhanced copy transform pipeline on the input text.
 */
export function enhancedCopyTransform(text: string, config: EnhancedCopyConfig): string {
  let result = text;

  // 1. Convert wikilinks first (before link transforms)
  if (config.convertWikilinks) {
    result = convertWikilinks(result);
  }

  // 2. Transform links
  result = transformLinks(result, config.linkMode);

  // 3. Transform footnotes
  result = transformFootnotes(result, config.footnoteMode);

  // 4. Transform callouts
  result = transformCallouts(result, config.calloutMode);

  // 5. Remove highlight marks
  if (config.removeHighlightMarks) {
    result = removeHighlights(result);
  }

  // 6. Convert tabs to spaces
  if (config.tabToSpaces) {
    result = convertTabsToSpaces(result, config.tabSize);
  }

  // 7. Strict line breaks
  if (config.strictLineBreaks) {
    result = addStrictLineBreaks(result);
  }

  // 8. User regex rules (always last before output)
  if (config.regexRules.length > 0) {
    result = applyRegexRules(result, config.regexRules);
  }

  return result;
}
