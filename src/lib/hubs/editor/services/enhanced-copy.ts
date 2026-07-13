export type LinkMode = 'keep' | 'remove-all' | 'remove-internal';
export type FootnoteMode = 'keep' | 'remove' | 'format';
export type CalloutMode = 'keep' | 'type-to-strong' | 'blockquote';

interface RegexRule {
  pattern: string;
  flags: string;
  replacement: string;
}

export interface EnhancedCopyConfig {
  linkMode: LinkMode;
  footnoteMode: FootnoteMode;
  calloutMode: CalloutMode;
  removeHighlightMarks: boolean;
  strictLineBreaks: boolean;
  convertWikilinks: boolean;
  tabToSpaces: boolean;
  tabSize: number;
  regexRules: RegexRule[];
}

export const DEFAULT_ENHANCED_COPY_CONFIG: EnhancedCopyConfig = {
  linkMode: 'keep',
  footnoteMode: 'format',
  calloutMode: 'keep',
  removeHighlightMarks: false,
  strictLineBreaks: false,
  convertWikilinks: true,
  tabToSpaces: false,
  tabSize: 4,
  regexRules: [],
};

export function transformLinks(text: string, mode: LinkMode): string {
  if (mode === 'keep') return text;
  return text.replace(/\[([^\]]*)\]\(([^)]*)\)/g, (_match, linkText: string, url: string) => {
    if (mode === 'remove-all') return linkText;
    if (/^https?:\/\//i.test(url)) return _match;
    return linkText;
  });
}

export function transformFootnotes(text: string, mode: FootnoteMode): string {
  if (mode === 'keep') return text;

  if (mode === 'remove') {
    let result = text.replace(/\[\[\d+\]\]\(#fn-\d+-[a-zA-Z0-9]*\)/g, '');
    result = result.replace(/\[\^\d+\]/g, '');
    result = result.replace(/^\[\^\d+\]:.*$/gm, '');
    return result;
  }

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

  result = result.replace(
    /^(\d+)\.\s+\[\^?\]?\(#fnref-(\d+)-[a-zA-Z0-9]*\)\s*(.*)/gm,
    (_match, _num: string, fnId: string, content: string) => {
      const idx = footnoteMap.get(fnId) ?? parseInt(_num, 10);
      return `[^${idx}]: ${content.trim()}`;
    }
  );

  return result;
}

export function transformCallouts(text: string, mode: CalloutMode): string {
  if (mode === 'keep') return text;
  return text.replace(
    /^(>\s*)\[!(\w+)\]\s*(.*)/gm,
    (_match, prefix: string, type: string, title: string) => {
      if (mode === 'type-to-strong') {
        const capitalized = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
        return title ? `${prefix}**${capitalized}** ${title}` : `${prefix}**${capitalized}**`;
      }
      return title ? `${prefix}${title}` : prefix.trimEnd();
    }
  );
}

export function removeHighlights(text: string): string {
  return text.replace(/==(.*?)==/g, '$1');
}

export function convertWikilinks(text: string): string {
  return text.replace(
    /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_match, target: string, alias?: string) => {
      const display = alias || target;
      return `[${display}](${target})`;
    }
  );
}

export function convertTabsToSpaces(text: string, tabSize: number): string {
  return text.replace(/\t/g, ' '.repeat(tabSize));
}

export function addStrictLineBreaks(text: string): string {
  return text.replace(/(?<! {2})\n/g, '  \n');
}

function applyRegexRules(text: string, rules: RegexRule[]): string {
  let result = text;
  for (const rule of rules) {
    try {
      const re = new RegExp(rule.pattern, rule.flags);
      result = result.replace(re, rule.replacement);
    } catch {
      // Skip invalid regex rules
    }
  }
  return result;
}

export function enhancedCopyTransform(text: string, config: EnhancedCopyConfig): string {
  let result = text;

  if (config.convertWikilinks) {
    result = convertWikilinks(result);
  }

  result = transformLinks(result, config.linkMode);
  result = transformFootnotes(result, config.footnoteMode);
  result = transformCallouts(result, config.calloutMode);

  if (config.removeHighlightMarks) {
    result = removeHighlights(result);
  }

  if (config.tabToSpaces) {
    result = convertTabsToSpaces(result, config.tabSize);
  }

  if (config.strictLineBreaks) {
    result = addStrictLineBreaks(result);
  }

  if (config.regexRules.length > 0) {
    result = applyRegexRules(result, config.regexRules);
  }

  return result;
}
